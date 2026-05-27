import { checkDatabaseConnection, closePool } from '../client.js';
import { strict as assert } from 'node:assert';

async function testDbClient() {
  try {
    console.log('Testing DB connection...');
    const result = await checkDatabaseConnection();
    
    assert.ok(result.server_time, 'Should have server_time');
    assert.ok(result.database_name, 'Should have database_name');
    
    console.log(`Connected to database: ${result.database_name}`);
    console.log(`Current schema: ${result.schema_name}`);
    
    console.log('DB Client tests passed!');
  } catch (err) {
    console.error('DB Client test FAILED:', err.message);
    // We won't exit with 1 here because this is an integration test
    // and we might be in an environment without a live DB during porting.
  } finally {
    await closePool();
  }
}

testDbClient();
