import { NextRequest, NextResponse } from 'next/server';
import { ERPNEXT_API_URLS } from '@/lib/config/api.config';
import { parseErpNextError } from '@/lib/api/utils/parseErpNextError';

// GET - Get single user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;

    if (!token) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const user_name = searchParams.get('user_name');

    // Build query string for ERPNext
    let queryString = '';
    if (user_name) {
      queryString = `?user_name=${encodeURIComponent(user_name)}`;
    }

    // Format headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token.startsWith('Token ')) {
      headers['Authorization'] = token;
    } else if (token.includes(':')) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Cookie'] = `sid=${token}`;
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Forward to ERPNext
    const response = await fetch(
      `${ERPNEXT_API_URLS.GET_USER}${queryString}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const errorMessage = parseErpNextError(errorText, 'Failed to get user');
      
      console.error(
        `Failed to get user: ${response.status} - ${errorMessage}`,
        { errorText }
      );

      return NextResponse.json(
        { success: false, message: errorMessage, error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    // ERPNext API methods return { message: {...} }, unwrap it
    const result = data.message || data;
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('ERPNext get user proxy error:', error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
