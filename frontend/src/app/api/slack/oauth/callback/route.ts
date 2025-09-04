import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    // Forward the request to your backend
    const backendResponse = await fetch('http://localhost:3001/api/slack/oauth/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });

    const result = await backendResponse.json();

    if (backendResponse.ok) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: backendResponse.status });
    }
  } catch (error) {
    console.error('Frontend OAuth callback error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
