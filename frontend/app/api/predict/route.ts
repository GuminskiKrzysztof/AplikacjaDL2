import { NextResponse } from 'next/server';

const FLASK_API_BASE_URL = process.env.FLASK_API_URL || "http://localhost:5000";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get('image'); 

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const flaskFormData = new FormData();
    
    flaskFormData.append('file', file); 

    const flaskResponse = await fetch(`${FLASK_API_BASE_URL}/predict`, {
      method: 'POST',
      body: flaskFormData,
    });

    if (!flaskResponse.ok) {
      const flaskError = await flaskResponse.json().catch(() => ({ error: `Unknown error from Flask, status: ${flaskResponse.status}` }));
      console.error("Error from Flask:", flaskError);
      return NextResponse.json(
        { error: flaskError.error || `Flask prediction failed with status: ${flaskResponse.status}` },
        { status: flaskResponse.status }
      );
    }

    const flaskData = await flaskResponse.json();
    return NextResponse.json(flaskData);

  } catch (error: any) {
    console.error('API Route error:', error);
    return NextResponse.json({ error: 'Internal server error from Next.js API Route' }, { status: 500 });
  }
}