import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Storage abstraction. Today this implements the "local" driver, which writes
 * uploaded files under LOCAL_UPLOAD_DIR (defaults to ./public/uploads).
 *
 * To switch to AWS S3, Cloudflare R2, or Supabase Storage:
 *  1. Set STORAGE_DRIVER=s3 in .env
 *  2. Install the AWS SDK: npm install @aws-sdk/client-s3
 *  3. Implement putObject/getObjectStream/deleteObject below using
 *     S3_ENDPOINT / S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY / S3_REGION
 *     from .env — the rest of the app only calls the functions exported here,
 *     so no API routes need to change.
 */

const UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR
  ? path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR)
  : path.resolve(process.cwd(), "public/uploads");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

/** Build a collision-proof, owner-namespaced relative storage key. */
export function buildStorageKey(ownerId: string, originalName: string): string {
  const ext = path.extname(originalName);
  const unique = crypto.randomBytes(16).toString("hex");
  return path.join(ownerId, `${unique}${ext}`);
}

export async function saveBuffer(storageKey: string, buffer: Buffer): Promise<void> {
  const driver = process.env.STORAGE_DRIVER || "local";
  if (driver !== "local") {
    throw new Error(
      `Storage driver "${driver}" is not implemented yet. See src/lib/storage.ts for how to wire up S3/R2/Supabase.`
    );
  }
  const fullPath = path.join(UPLOAD_DIR, storageKey);
  await ensureDir(path.dirname(fullPath));
  await fs.writeFile(fullPath, buffer);
}

export async function readBuffer(storageKey: string): Promise<Buffer> {
  const fullPath = path.join(UPLOAD_DIR, storageKey);
  return fs.readFile(fullPath);
}

export async function deleteObject(storageKey: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, storageKey);
  await fs.rm(fullPath, { force: true });
}

export function sha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function categoryFromMime(mime: string): "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "ARCHIVE" | "OTHER" {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("audio/")) return "AUDIO";
  if (
    mime === "application/zip" ||
    mime === "application/x-rar-compressed" ||
    mime === "application/x-7z-compressed" ||
    mime === "application/x-tar"
  )
    return "ARCHIVE";
  if (
    mime === "application/pdf" ||
    mime.includes("word") ||
    mime.includes("excel") ||
    mime.includes("spreadsheet") ||
    mime.includes("presentation") ||
    mime === "text/plain" ||
    mime === "text/csv" ||
    mime === "application/json"
  )
    return "DOCUMENT";
  return "OTHER";
}
