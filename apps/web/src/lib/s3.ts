import "server-only";
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function isS3Configured() {
  return Boolean(
    process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.S3_BUCKET,
  );
}

let _client: S3Client | null = null;
function s3(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return _client;
}

const BUCKET = () => process.env.S3_BUCKET as string;
const ROOT = () => {
  const p = process.env.S3_PREFIX ?? "";
  return p ? p.replace(/\/?$/, "/") : "";
};

/** Rejects path traversal and normalizes to a key under the sandbox prefix. */
function assertSafe(path: string) {
  const parts = path.split("/");
  if (parts.some((p) => p === "..")) throw new Error("invalid path");
}
function fullKey(path: string) {
  assertSafe(path);
  return ROOT() + path.replace(/^\/+/, "");
}
function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export type CloudEntry = {
  name: string;
  path: string; // user-facing path (without root prefix)
  type: "folder" | "file";
  size?: number;
  updatedAt?: string;
};

export async function listDir(prefix: string): Promise<CloudEntry[]> {
  const root = ROOT();
  let full = fullKey(prefix);
  if (full && !full.endsWith("/")) full += "/";
  const out = await s3().send(
    new ListObjectsV2Command({ Bucket: BUCKET(), Prefix: full, Delimiter: "/" }),
  );
  const folders: CloudEntry[] = (out.CommonPrefixes ?? []).map((p) => {
    const key = p.Prefix as string;
    return {
      name: key.slice(full.length).replace(/\/$/, ""),
      path: key.slice(root.length),
      type: "folder",
    };
  });
  const files: CloudEntry[] = (out.Contents ?? [])
    .filter((o) => o.Key && o.Key !== full)
    .map((o) => ({
      name: (o.Key as string).slice(full.length),
      path: (o.Key as string).slice(root.length),
      type: "file" as const,
      size: o.Size,
      updatedAt: o.LastModified?.toISOString(),
    }))
    .filter((f) => f.name);
  return [...folders, ...files];
}

export async function createFolder(path: string) {
  const key = fullKey(path).replace(/\/?$/, "/");
  await s3().send(new PutObjectCommand({ Bucket: BUCKET(), Key: key, Body: "" }));
}

export async function presignUpload(path: string, contentType: string) {
  const cmd = new PutObjectCommand({ Bucket: BUCKET(), Key: fullKey(path), ContentType: contentType });
  return getSignedUrl(s3(), cmd, { expiresIn: 300 });
}

export async function presignDownload(path: string) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET(), Key: fullKey(path) });
  return getSignedUrl(s3(), cmd, { expiresIn: 300 });
}

export async function deleteEntry(path: string, isFolder: boolean) {
  if (!isFolder) {
    await s3().send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: fullKey(path) }));
    return;
  }
  const prefix = fullKey(path).replace(/\/?$/, "/");
  let token: string | undefined;
  do {
    const out = await s3().send(
      new ListObjectsV2Command({ Bucket: BUCKET(), Prefix: prefix, ContinuationToken: token }),
    );
    const objs = (out.Contents ?? []).map((o) => ({ Key: o.Key as string }));
    if (objs.length) {
      await s3().send(new DeleteObjectsCommand({ Bucket: BUCKET(), Delete: { Objects: objs } }));
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
}

export async function renameEntry(from: string, to: string, isFolder: boolean) {
  if (!isFolder) {
    const src = fullKey(from);
    await s3().send(
      new CopyObjectCommand({
        Bucket: BUCKET(),
        CopySource: `${BUCKET()}/${encodeKey(src)}`,
        Key: fullKey(to),
      }),
    );
    await s3().send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: src }));
    return;
  }
  const fromPrefix = fullKey(from).replace(/\/?$/, "/");
  const toPrefix = fullKey(to).replace(/\/?$/, "/");
  let token: string | undefined;
  do {
    const out = await s3().send(
      new ListObjectsV2Command({ Bucket: BUCKET(), Prefix: fromPrefix, ContinuationToken: token }),
    );
    for (const o of out.Contents ?? []) {
      const rel = (o.Key as string).slice(fromPrefix.length);
      await s3().send(
        new CopyObjectCommand({
          Bucket: BUCKET(),
          CopySource: `${BUCKET()}/${encodeKey(o.Key as string)}`,
          Key: toPrefix + rel,
        }),
      );
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  await deleteEntry(from, true);
}
