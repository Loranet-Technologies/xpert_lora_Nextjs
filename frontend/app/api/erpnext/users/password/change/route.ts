import { NextRequest, NextResponse } from 'next/server';
import { ERPNEXT_API_URLS } from '@/lib/config/api.config';
import { parseErpNextError } from '@/lib/api/utils/parseErpNextError';

// POST - Change password
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;

    if (!token) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const body = await request.json();

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
    const response = await fetch(ERPNEXT_API_URLS.CHANGE_PASSWORD, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const errorMessage = parseErpNextError(errorText, 'Failed to change password');
      
      console.error(
        `Failed to change password: ${response.status} - ${errorMessage}`,
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
    
    // If result already has success field, return as is (preserve error responses)
    if (result && typeof result === 'object' && 'success' in result) {
      // If it's an error response, make sure it's properly formatted
      if (result.success === false) {
        return NextResponse.json({
          success: false,
          message: result.message || 'Error',
          error: result.error || result.message || 'An error occurred',
        }, { status: response.status >= 400 ? response.status : 400 });
      }
      return NextResponse.json(result);
    }
    
    // Otherwise wrap it
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('ERPNext change password proxy error:', error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
