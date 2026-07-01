import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Config() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME ?? "rxbox-prescriptions";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 storage is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY."
    );
  }

  return { endpoint, accessKeyId, secretAccessKey, bucket };
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const { endpoint, accessKeyId, secretAccessKey } = getR2Config();

  s3Client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return s3Client;
}

export function getPublicImageUrl(key: string): string {
  const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (publicBase) {
    return `${publicBase}/${key}`;
  }
  return `/api/files/${key}`;
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  const { bucket } = getR2Config();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return { key, url: getPublicImageUrl(key) };
}

export async function getFromR2(key: string): Promise<{
  body: Buffer;
  contentType: string;
}> {
  const client = getS3Client();
  const { bucket } = getR2Config();

  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );

  const bytes = await response.Body?.transformToByteArray();
  if (!bytes) {
    throw new Error("Empty object from R2");
  }

  return {
    body: Buffer.from(bytes),
    contentType: response.ContentType ?? "application/octet-stream",
  };
}

export async function getSignedR2Url(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client();
  const { bucket } = getR2Config();

  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn }
  );
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getS3Client();
  const { bucket } = getR2Config();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

/** Delete an R2 object if present; logs and continues on failure. */
export async function deleteFromR2Safe(
  key: string | null | undefined
): Promise<void> {
  if (!key) return;

  try {
    await deleteFromR2(key);
  } catch (error) {
    console.error(`Failed to delete R2 object ${key}:`, error);
  }
}

export async function deletePrescriptionFilesFromR2(
  prescriptions: Array<{ storageKey: string | null }>
): Promise<void> {
  await Promise.all(
    prescriptions.map((prescription) =>
      deleteFromR2Safe(prescription.storageKey)
    )
  );
}

export function buildPrescriptionKey(
  familyId: string,
  memberId: string,
  fileName: string
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `prescriptions/${familyId}/${memberId}/${Date.now()}-${safeName}`;
}

export function buildMemberDocumentKey(
  familyId: string,
  memberId: string,
  fileName: string
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `documents/${familyId}/${memberId}/${Date.now()}-${safeName}`;
}

export function buildMedicalReportKey(
  familyId: string,
  memberId: string,
  fileName: string
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `medical-reports/${familyId}/${memberId}/${Date.now()}-${safeName}`;
}

export async function deleteStorageKeysFromR2(
  items: Array<{ storageKey: string | null }>
): Promise<void> {
  await Promise.all(
    items.map((item) => deleteFromR2Safe(item.storageKey))
  );
}
