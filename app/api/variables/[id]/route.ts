import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.templateVariable.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { error: 'Variable not found' },
      { status: 404 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, value } = await request.json();
    
    const updatedVariable = await prisma.templateVariable.update({
      where: { id: params.id },
      data: { name, value }
    });
    
    return NextResponse.json(updatedVariable);
    
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json(
      { error: 'Update failed' },
      { status: 400 }
    );
  }
}