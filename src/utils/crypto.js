import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const MIN_KEY_LENGTH = 32;

function getEncryptionKey() {
  const rawKey = process.env.ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error('ENCRYPTION_KEY is required for encryption operations');
  }

  const keyBuffer = Buffer.from(rawKey, 'utf8');

  if (keyBuffer.length < MIN_KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be at least ${MIN_KEY_LENGTH} bytes when UTF-8 encoded`
    );
  }

  return createHash('sha256').update(keyBuffer).digest();
}

export function encrypt(text) {
  if (typeof text !== 'string') {
    throw new Error('encrypt(text) expects a string input');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

export function decrypt(text) {
  if (typeof text !== 'string') {
    throw new Error('decrypt(text) expects a string input');
  }

  const [ivHex, authTagHex, encryptedHex, ...rest] = text.split(':');

  if (!ivHex || !authTagHex || !encryptedHex || rest.length > 0) {
    throw new Error('Encrypted payload is not in the expected format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  if (iv.length !== IV_LENGTH) {
    throw new Error('Encrypted payload has an invalid initialization vector');
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Encrypted payload has an invalid authentication tag');
  }

  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
