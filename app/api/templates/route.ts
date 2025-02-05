import { NextResponse } from 'next/server';
import { bucketName, minioClient } from '@/lib/minio';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { Readable } from 'stream';
//import sharp from 'sharp';

import docxtemplaterImageModuleFree from 'docxtemplater-image-module-free';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const variablesString = formData.get('variables') as string | null;

    let variables: Record<string, unknown> = {};
    if (variablesString) {
      variables = JSON.parse(variablesString);
    }

    if (!bucketName) {
      throw new Error('Bucket não configurado');
    }

    // 1. Upload do template para MinIO
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

    // 2. Baixar template para processar
    const { Body: templateFile } = await minioClient.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    if (!templateFile) {
      throw new Error('Failed to retrieve template file from MinIO');
    }

    // Converter stream em buffer
    const templateBuffer = await streamToBuffer(templateFile as Readable);

    // Configurar o módulo de imagem (versão default)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageModule = new (docxtemplaterImageModuleFree as any)({
      
      getImage: async (tagValue: string) => {
        console.log('Processing tag:', tagValue);
        
        if (!tagValue) {
          throw new Error('Tag value is empty');
        }
        
        // Se a URL for um data URI (base64), converte diretamente
        if (tagValue.startsWith('data:')) {
          console.log('Processing base64 image');
          return Buffer.from(tagValue.split(',')[1], 'base64');
        }
        
        // Se não for uma URL HTTP válida, lança erro
        if (!tagValue.startsWith('http')) {
          throw new Error(`URL de imagem inválida: ${tagValue}`);
        }
        
        // Para URLs HTTP, baixa a imagem
        console.log('Downloading image:', tagValue);
        const response = await fetch(tagValue);
        if (!response.ok) {
          throw new Error(`Erro ao baixar imagem em: ${tagValue}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      },
      getSize: async () => {
      //getSize: async (imgBuffer: Buffer) => {
        //const metadata = await sharp(imgBuffer).metadata();
        //return [metadata.width || 100, metadata.height || 100];
        return [200, 200];
      }
    });
    
    // Carregar no PizZip
    const zip = new PizZip(templateBuffer);

    // V4: passar modules no construtor (não chamar attachModule depois)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
      modules: [imageModule],
    });

    console.log(variables);
    await doc.renderAsync(variables);

    // Gera o arquivo final em buffer
    const output = doc.getZip().generate({ type: 'nodebuffer' });

    // 3. Salvar o documento gerado no MinIO (opcional)
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

    // Retorna o arquivo para download imediato
    return new NextResponse(output, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
