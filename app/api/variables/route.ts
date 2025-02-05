import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET ALL
export async function GET() {
  const variables = await prisma.templateVariable.findMany();
  return NextResponse.json(variables);
}

// CREATE
export async function POST(request: Request) {
  try {
    const { name, value } = await request.json();
    
    const newVariable = await prisma.templateVariable.create({
      data: { name, value }
    });
    
    return NextResponse.json(newVariable);
    
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { error: 'Creation failed' },
      { status: 400 }
    );
  }
}