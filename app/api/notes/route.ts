import { NextResponse } from 'next/server';
import crypto from 'crypto';

interface Note {
  content: string;
  createdAt: number;
  expiresIn: number;
  isPasswordProtected: boolean;
  algorithm: string;
  recipientEmail?: string;
  accessLog: {
    timestamp: number;
    ipAddress: string;
    userAgent: string;
  }[];
}

// In-memory store for development. In production, use a proper database
const notes = new Map<string, Note>();

export async function POST(request: Request) {
  try {
    const { 
      content, 
      expiresIn, 
      isPasswordProtected, 
      algorithm,
      recipientEmail 
    } = await request.json();
    
    const id = crypto.randomBytes(16).toString('hex');
    
    notes.set(id, {
      content,
      createdAt: Date.now(),
      expiresIn: expiresIn * 60 * 60 * 1000,
      isPasswordProtected,
      algorithm,
      recipientEmail,
      accessLog: [],
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ipAddress = request.headers.get('x-forwarded-for') || 'Unknown';
  
  if (!id) {
    return NextResponse.json(
      { error: 'Note ID is required' },
      { status: 400 }
    );
  }

  const note = notes.get(id);
  
  if (!note) {
    return NextResponse.json(
      { error: 'Note not found or already accessed' },
      { status: 404 }
    );
  }

  if (Date.now() - note.createdAt > note.expiresIn) {
    notes.delete(id);
    return NextResponse.json(
      { error: 'Note has expired' },
      { status: 410 }
    );
  }

  // Log access attempt
  note.accessLog.push({
    timestamp: Date.now(),
    ipAddress,
    userAgent,
  });

  // In a real app, send email notification here
  if (note.recipientEmail) {
    console.log(`Note accessed by ${ipAddress} at ${new Date().toISOString()}`);
  }

  const response = {
    content: note.content,
    isPasswordProtected: note.isPasswordProtected,
    algorithm: note.algorithm,
    accessLog: note.accessLog,
  };

  // Delete note after access
  notes.delete(id);
  
  return NextResponse.json(response);
}