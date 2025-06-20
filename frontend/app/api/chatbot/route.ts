import { NextResponse } from 'next/server';

const FLASK_API_BASE_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || "http://localhost:5000";

export async function POST(req: Request) {
  try {
    const requestBody = await req.json();
    
    const messageText: string = requestBody.text; // Oczekujemy 'text' od frontendu

    if (!messageText) {
        return NextResponse.json({ error: 'No message text provided.' }, { status: 400 });
    }

    const flaskResponse = await fetch(`${FLASK_API_BASE_URL}/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: messageText }),
    });

    if (!flaskResponse.ok) {
      const errorData = await flaskResponse.json();
      console.error('Flask API error:', errorData);
      return NextResponse.json({ error: 'Failed to get response from Flask API', details: errorData }, { status: flaskResponse.status });
    }

    const data = await flaskResponse.json();
    const botResponseText = data.response_text;

    return NextResponse.json({ response_text: botResponseText });

  } catch (error) {
    console.error('Error in Next.js chatbot API route:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'GET method not allowed.' }, { status: 405 });
}