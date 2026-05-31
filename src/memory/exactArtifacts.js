import { getPool } from '../db/client.js';
import { decrypt, encrypt } from '../utils/crypto.js';

export async function saveArtifact(taskId, artifactType, data) {
  const encryptedContent = encrypt(JSON.stringify(data));
  const result = await getPool().query(
    `
      INSERT INTO memory_artifacts (task_id, artifact_type, content)
      VALUES ($1, $2, $3)
      RETURNING id
    `,
    [taskId, artifactType, encryptedContent]
  );

  return result.rows[0].id;
}

export async function getArtifact(taskId, artifactType) {
  const result = await getPool().query(
    `
      SELECT content
      FROM memory_artifacts
      WHERE task_id = $1 AND artifact_type = $2
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `,
    [taskId, artifactType]
  );

  if (result.rowCount === 0) {
    throw new Error(`Artifact not found for task ${taskId} and type ${artifactType}`);
  }

  return JSON.parse(decrypt(result.rows[0].content));
}
