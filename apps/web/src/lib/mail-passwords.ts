import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey() {
  const raw = process.env.MAIL_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error("MAIL_ENCRYPTION_KEY is required to store mail passwords");
  }

  const fromBase64 = Buffer.from(raw, "base64");
  if (fromBase64.length === 32) return fromBase64;

  const fromHex = Buffer.from(raw, "hex");
  if (fromHex.length === 32) return fromHex;

  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptMailPassword(password: string) {
  const key = getEncryptionKey();
  const nonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, nonce);
  const encrypted = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);

  return {
    encryptedPassword: encrypted.toString("base64"),
    passwordNonce: nonce.toString("base64"),
    passwordAuthTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptMailPassword(params: {
  encryptedPassword: string;
  passwordNonce: string;
  passwordAuthTag: string;
}) {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(params.passwordNonce, "base64"),
  );

  decipher.setAuthTag(Buffer.from(params.passwordAuthTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(params.encryptedPassword, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
