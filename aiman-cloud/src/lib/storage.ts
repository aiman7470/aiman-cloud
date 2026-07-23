import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR
  ? path.resolve(process.cwd(), process.env.LOCAL_UPLOAD_DIR)
  : path.resolve(process.cwd(), "public/uploads");

function driver(): "local" | "s3" {
  return (process.env.STORAGE_DRIVER as "local" | "s3") || "local";
}

let s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (s3Client) return s3Client;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "STORAGE_DRIVER=s3 but S3_ENDPOINT / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY are not set in .env."
    );
  }
  s3Client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return s3Client;
}

function bucket(): string {
  const b = process.env.S3_BUCKET;
  if (!b) throw new Error("STORAGE_DRIVER=s3 but S3_BUCKET is not set in .env.");
  return b;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export function buildStorageKey(ownerId: string, originalName: string): string {
  const ext = path.extname(originalName);
  const unique = crypto.randomBytes(16).toString("hex");
  return `${ownerId}/${unique}${ext}`;
}

export async function saveBuffer(storageKey: string, buffer: Buffer, mimeType?: string): Promise<void> {
  if (driver() === "s3") {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: storageKey,
        Body: buffer,
        ContentType: mimeType || "application/octet-stream",
      })
    );
    return;
  }
  const fullPath = path.join(UPLOAD_DIR, storageKey);
  await ensureDir(path.dirname(fullPath));
  await fs.writeFile(fullPath, buffer);
}

export async function readBuffer(storageKey: string): Promise<Buffer> {
  if (driver() === "s3") {
    const res = await getS3Client().send(new GetObjectCommand({ Bucket: bucket(), Key: storageKey }));
    const stream = res.Body as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  const fullPath = path.join(UPLOAD_DIR, storageKey);
  return fs.readFile(fullPath);
}

export async function deleteObject(storageKey: string): Promise<void> {
  if (driver() === "s3") {
    await getS3Client()
      .send(new DeleteObjectCommand({ Bucket: bucket(), Key: storageKey }))
      .catch(() => {});
    return;
  }
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
