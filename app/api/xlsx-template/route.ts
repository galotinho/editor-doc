import { NextResponse } from 'next/server';
import { bucketName, minioClient } from '@/lib/minio';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import XlsxTemplate from 'xlsx-template';
import { Readable } from 'stream';
import sharp from 'sharp';

export async function POST(request: Request) {
  try {
    // Ler formData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const variablesString = formData.get('variables') as string | null;

    let variables: Record<string, unknown> = {}; // substituído 'any' por 'unknown' para evitar erros de tipo
    if (variablesString) {
      variables = JSON.parse(variablesString);
    }

    if (!bucketName) {
      throw new Error('Bucket não configurado');
    }

    // Upload do template XLSX para o MinIO
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `templates/${Date.now()}-${file.name}`;
    await minioClient.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Baixar o template
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

    // Converter URLs de imagem para Base64 se houver no objeto de variáveis
    if (variables.items && Array.isArray(variables.items)) {
      for (const item of variables.items) {
        if (item.image && typeof item.image === 'string' && item.image.startsWith('http')) {
          item.image = await getImageBase64FromUrl(item.image);
        }
      }
    }

    // Criar instância do XlsxTemplate
    const template = new XlsxTemplate(templateBuffer);
    console.log('Variables:', variables);

    // Substituir os placeholders no primeiro sheet (sheetNumber = 1)
    template.substitute(1, variables);

    // Gerar o arquivo final como Buffer
    const outputBuffer = template.generate({ type: 'nodebuffer' });

    // Salvar o documento gerado no MinIO (opcional)
    const outputKey = `generated/${Date.now()}-${file.name}`;
    await minioClient.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: outputKey,
        Body: outputBuffer,
        ContentType: file.type,
      })
    );

    return new NextResponse(outputBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=${file.name}`,
        },
      });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}

// Função auxiliar para converter stream em Buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Função para baixar uma imagem e retornar uma string Base64
async function getImageBase64FromUrl(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao baixar imagem em: ${url}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
  
    // Redimensiona a imagem para 300x200 (ajuste as dimensões conforme necessário)
    const resizedBuffer = await sharp(inputBuffer)
      .resize({ width: 100, height: 25, fit: 'inside' })
      .toBuffer();
  
    // Retorna a string Base64 da imagem redimensionada
    return resizedBuffer.toString('base64');
  }
