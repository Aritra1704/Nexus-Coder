import { verifyAndCommit } from '../gitGuardian.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { strict as assert } from 'node:assert';
import { runTool } from '../../tools/registry.js';

const testRoot = '/Users/aritrarpal/Documents/workspace_biz/surgical-orchestrator/workspace/test-workspace/git-guardian';
const originalPath = process.env.PATH ?? '';

async function writeExecutable(filePath, content) {
  await fs.writeFile(filePath, content, { mode: 0o755 });
}

async function initRepo(repoDir) {
  await fs.mkdir(repoDir, { recursive: true });
  await runTool('run_terminal_command', { command: 'git init' }, repoDir);
  await runTool('run_terminal_command', { command: 'git config user.email "tests@example.com"' }, repoDir);
  await runTool('run_terminal_command', { command: 'git config user.name "Test Runner"' }, repoDir);
}

async function commitAll(repoDir, message) {
  await runTool('run_terminal_command', { command: `git add . && git commit -m "${message}"` }, repoDir);
}

async function withToolOnPath(toolName, scriptContent, callback) {
  const binDir = path.join(testRoot, 'bin');
  await fs.mkdir(binDir, { recursive: true });
  await writeExecutable(path.join(binDir, toolName), scriptContent);
  process.env.PATH = `${binDir}:${originalPath}`;

  try {
    await callback();
  } finally {
    process.env.PATH = originalPath;
  }
}

async function testJavaScriptVerificationAndRollback() {
  const repoDir = path.join(testRoot, 'js-repo');
  const testFile = path.join(repoDir, 'test.js');

  await initRepo(repoDir);
  await fs.writeFile(testFile, 'console.log("hello");\n');
  await commitAll(repoDir, 'initial');

  await fs.writeFile(testFile, 'console.log("updated");\n');
  await verifyAndCommit(testFile, 'task-js-success');

  const successLog = await runTool('run_terminal_command', { command: 'git log -1 --pretty=%s' }, repoDir);
  assert.match(successLog.output, /task-js-success/, 'Successful JS verification should commit the change');

  await fs.writeFile(testFile, 'invalid syntax {\n');
  await assert.rejects(
    verifyAndCommit(testFile, 'task-js-failure'),
    /Verification failed/
  );

  const content = await fs.readFile(testFile, 'utf8');
  assert.strictEqual(content, 'console.log("updated");\n', 'JS verification failure should revert the file');
}

async function testJavaVerificationUsesMavenAndRollsBack() {
  const repoDir = path.join(testRoot, 'java-repo');
  const srcDir = path.join(repoDir, 'src');
  const testFile = path.join(srcDir, 'Main.java');
  const markerFile = path.join(repoDir, 'mvn-args.txt');

  await initRepo(repoDir);
  await fs.mkdir(srcDir, { recursive: true });
  await fs.writeFile(path.join(repoDir, 'pom.xml'), '<project />\n');
  await fs.writeFile(testFile, 'class Main {}\n');
  await commitAll(repoDir, 'initial');

  await fs.writeFile(testFile, 'class Main { syntax error }\n');

  await withToolOnPath(
    'mvn',
    `#!/bin/sh
printf '%s' "$*" > "${markerFile}"
exit 1
`,
    async () => {
      await assert.rejects(
        verifyAndCommit(testFile, 'task-java-failure'),
        /Arnold report/
      );
    }
  );

  const content = await fs.readFile(testFile, 'utf8');
  assert.strictEqual(content, 'class Main {}\n', 'Java verification failure should revert the file');

  const mvnArgs = await fs.readFile(markerFile, 'utf8');
  assert.match(mvnArgs, /compile/, 'Java verification should invoke Maven compile');
  assert.match(mvnArgs, /pom\.xml/, 'Java verification should target the located pom.xml');
}

async function testTypeScriptVerificationUsesTsc() {
  const repoDir = path.join(testRoot, 'ts-repo');
  const srcDir = path.join(repoDir, 'src');
  const testFile = path.join(srcDir, 'index.ts');
  const markerFile = path.join(repoDir, 'tsc-args.txt');

  await initRepo(repoDir);
  await fs.mkdir(srcDir, { recursive: true });
  await fs.writeFile(path.join(repoDir, 'tsconfig.json'), '{ "compilerOptions": { "target": "ES2022" } }\n');
  await fs.writeFile(testFile, 'export const count: number = 1;\n');
  await commitAll(repoDir, 'initial');

  await fs.writeFile(testFile, 'export const count: number = 2;\n');

  await withToolOnPath(
    'tsc',
    `#!/bin/sh
printf '%s' "$*" > "${markerFile}"
exit 0
`,
    async () => {
      await verifyAndCommit(testFile, 'task-ts-success');
    }
  );

  const tscArgs = await fs.readFile(markerFile, 'utf8');
  assert.match(tscArgs, /--project/, 'TypeScript verification should use tsc with a project when tsconfig exists');
  assert.match(tscArgs, /tsconfig\.json/, 'TypeScript verification should reference the discovered tsconfig');

  const successLog = await runTool('run_terminal_command', { command: 'git log -1 --pretty=%s' }, repoDir);
  assert.match(successLog.output, /task-ts-success/, 'Successful TS verification should commit the change');
}

async function testGitGuardian() {
  await fs.rm(testRoot, { recursive: true, force: true });
  await fs.mkdir(testRoot, { recursive: true });

  await testJavaScriptVerificationAndRollback();
  await testJavaVerificationUsesMavenAndRollsBack();
  await testTypeScriptVerificationUsesTsc();

  await fs.rm(testRoot, { recursive: true, force: true });
  console.log('GitGuardian tests passed!');
}

testGitGuardian().catch((err) => {
  process.env.PATH = originalPath;
  console.error(err);
  process.exit(1);
});
