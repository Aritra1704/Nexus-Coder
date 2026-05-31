import { strict as assert } from 'node:assert';

process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

const { decrypt, encrypt } = await import('../crypto.js');

async function testCrypto() {
  const plaintext = JSON.stringify({ foo: 'bar', count: 2 });
  const encrypted = encrypt(plaintext);
  const decrypted = decrypt(encrypted);

  assert.notStrictEqual(encrypted, plaintext, 'Encrypted payload should differ from plaintext');
  assert.strictEqual(decrypted, plaintext, 'Decrypted payload should match plaintext');

  console.log('Crypto tests passed!');
}

testCrypto().catch((err) => {
  console.error(err);
  process.exit(1);
});
