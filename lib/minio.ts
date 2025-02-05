// lib/minio.ts
import { S3Client } from '@aws-sdk/client-s3';

export const minioClient = new S3Client({
    endpoint: `${process.env.MINIO_ENDPOINT}`,
    region: "us-east-1", // MinIO requires a region, but it can be any value
    credentials: {
      accessKeyId: `${process.env.MINIO_ROOT_USER}`,
      secretAccessKey: `${process.env.MINIO_ROOT_PASSWORD}`,
    },
    forcePathStyle: true, // Required for MinIO
    tls: process.env.MINIO_USE_SSL === "false",
  });
  
  export const bucketName = process.env.MINIO_BUCKET_NAME;
  