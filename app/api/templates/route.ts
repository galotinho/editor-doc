import { NextResponse } from 'next/server';
import { bucketName, minioClient } from '@/lib/minio';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { Readable } from 'stream';
//import sharp from 'sharp';
import docxtemplaterImageModuleFree from 'docxtemplater-image-module-free';

interface Variables {
  nome: string;
  cnpj: string;
  cliente: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  relatorio: string;
  sugestoes: string;
  dia: number;
  mes: string;
  ano: number;
  items: {
    image: string;
    numero: number;
    legenda: string;
  }[];
}

async function gerarRelatorio(contexto: string): Promise<string> {
  const prompt = `Com base no seguinte contexto: "${contexto}": \n Gere um texto com vários parágrafos descrevendo cronologicamnente o que foi coletado com riqueza de detalhes utilizando termos técnicos da área de engenharia civil."`;
  
  console.log(`Bearer ${process.env.OPENAI_API_KEY}`);
  console.log(prompt);

  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo-instruct",
      prompt,
      max_tokens: 1000,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  let texto =  data.choices[0].text.trim();
  texto = texto.replace(/(?<!\n)\n(?!\n)/g, " ").replace(/(\n)\n/g, "$1").replace(/^(?!\s*$)/gm, "\t");
 
  return texto;
}

async function gerarSugestoes(contexto: string): Promise<string> {
  const prompt = `Com base no seguinte contexto: "${contexto}", sugira uma série de intervenções que podem ser feitas para resolver os problemas encontrados na vistoria. Faça um breve parágrafo resumindo as ações e, em seguida, crie uma sequência de bullets descrevendo cada intervenção detalhadamente. Finalize com uma conclusão.`;
   
  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo-instruct",
      prompt,
      max_tokens: 600,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  let texto =  data.choices[0].text.trim();
  texto = texto.replace(/(\n)\n/g, "$1").replace(/(?<!\n)\n(?!\n)/g, " ").replace(/^(?!\s*$)/gm, "\t").replace(/(?:\s*-\s+)/g, "\n- ");;
 
  return texto;
}



export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    //const variablesString = formData.get('variables') as string | null;   

    // Gerar os campos relatorio e sugestoes utilizando a API da OpenAI
    const prompt = "Você é um engenheiro civil especialista e atual desenvolvendo laudos técnicos de construções e reformas. O laudo técnico deve conter informações detalhadas baseada nas seguintes vistorias realizadas: (te informarei data da vistoria, dados técnicos coletados e observações feitas). \n";

    const contexto = prompt.concat([
      "01/07/2023 - Concreto armado: resistência adequada, sem fissuras visíveis; armaduras alinhadas. Observação: Obra em conformidade.",
      "02/07/2023 - Estrutura metálica: soldas inspecionadas, ausência de corrosão. Observação: Recomenda-se limpeza periódica.",
      "03/07/2023 - Alvenaria: paredes alinhadas e niveladas; rejunte bem aplicado. Observação: Pequenas fissuras em áreas não críticas.",
      "04/07/2023 - Instalações elétricas: fiação organizada, quadros em bom estado. Observação: Verificar aterramento.",
      "05/07/2023 - Instalações hidráulicas: tubulações sem vazamentos, conexões seguras. Observação: Teste de pressão recomendado.",
      "06/07/2023 - Impermeabilização: áreas críticas protegidas; aplicação uniforme. Observação: Reavaliação após chuva intensa.",
      "07/07/2023 - Acabamentos: revestimentos e pintura com boa aderência. Observação: Corrigir pequenas manchas localizadas.",
      "08/07/2023 - Cobertura: telhado com estrutura estável, calhas limpas. Observação: Manutenção preventiva sugerida.",
      "09/07/2023 - Escadas e rampas: dimensões adequadas, corrimãos fixos. Observação: Verificar sinalização de segurança.",
      "10/07/2023 - Áreas comuns: piso antiderrapante, iluminação adequada. Observação: Manutenção regular necessária."
    ].join("\n"));

    const relatorioGerado = await gerarRelatorio(contexto);
    const sugestoesGeradas = await gerarSugestoes(contexto);   
    

    // Se a variável for enviada, usamos o JSON.parse, senão, inicializamos com os valores padrão
    const variables: Variables = {
        nome: "Empresa Exemplo Ltda".toUpperCase(),
        cnpj: "12.345.678/0001-99".toUpperCase(),
        cliente: "Cliente Exemplo".toUpperCase(),
        endereco: "Rua Exemplo, 123".toUpperCase(),
        cidade: "São Paulo".toUpperCase(),
        estado: "SP",
        cep: "01001-000",
        relatorio: relatorioGerado,
        sugestoes: sugestoesGeradas,
        dia: 15,
        mes: "julho".toUpperCase(),
        ano: 2023,
        items: [
          {
            image: "https://media.investnews.com.br/uploads/2020/01/shutterstock_552493561.jpg",
            numero: 1,
            legenda: "Legenda da imagem 1".toUpperCase()
          },
          {
            image: "https://media.investnews.com.br/uploads/2020/01/shutterstock_552493561.jpg",
            numero: 2,
            legenda: "Legenda da imagem 2".toUpperCase()
          },
          {
            image: "https://media.investnews.com.br/uploads/2020/01/shutterstock_552493561.jpg",
            numero: 3,
            legenda: "Legenda da imagem 3".toUpperCase()
          }
        ]
      };

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
        return [500, 350];
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
