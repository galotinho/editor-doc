// app/api/templates/route.ts
import { NextResponse } from 'next/server';
import { bucketName, minioClient } from '@/lib/minio';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
// import { prisma } from '@/lib/prisma';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const variables = JSON.parse(formData.get('variables') as string);

    // Validação do bucket    
    if (!bucketName) {
      throw new Error('Bucket não configurado');
    }

    // 1. Upload do template
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `templates/${Date.now()}-${file.name}`;

    await minioClient.send(
      new PutObjectCommand({
        Bucket: bucketName, // Usa a variável de ambiente
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );
    
    // 2. Processar template
    const { Body: templateFile } = await minioClient.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    if (!templateFile) {
      throw new Error('Failed to retrieve template file from MinIO');
    }
    const templateBuffer = await streamToBuffer(templateFile as Readable);
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      // Habilita substituições múltiplas
      delimiters: {
        start: '{{',
        end: '}}'
      }
    });
    console.log('Variables:', variables);
    doc.render(variables);
    const output = doc.getZip().generate({ type: 'nodebuffer' });
    
    // 3. Salvar documento gerado
    const outputKey = `generated/${Date.now()}-${file.name}`;
    await minioClient.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: outputKey,
        Body: output,
        ContentType: file.type,
      })
    );
    console.log(`Generated document saved to: ${outputKey}`);
    return new NextResponse(output, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename=${file.name}`,
      },
    });

    // // Construir URL de acesso
    // const minioEndpoint = process.env.MINIO_ENDPOINT!;
    // const publicUrl = `${minioEndpoint}/${bucketName}/${outputKey}`;

    // return NextResponse.json({
    //   success: true,
    //   url: publicUrl,
    //   filename: file.name,
    //   key: outputKey
    // });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}

import { Readable } from 'stream';

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}