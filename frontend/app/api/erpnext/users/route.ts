import { NextRequest, NextResponse } from 'next/server';
import { ERPNEXT_API_URLS } from '@/lib/config/api.config';
import { parseErpNextError } from '@/lib/api/utils/parseErpNextError';

// GET - List users
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
    const page = searchParams.get('page') || '1';
    const page_length = searchParams.get('page_length') || '20';
    const search_term = searchParams.get('search_term') || '';

    // Build query string for ERPNext
    let queryString = `page=${page}&page_length=${page_length}`;
    if (search_term) {
      queryString += `&search_term=${encodeURIComponent(search_term)}`;
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

    // Try GET first, then POST if GET fails (ERPNext API methods can be called either way)
    let response = await fetch(
      `${ERPNEXT_API_URLS.LIST_USERS}?${queryString}`,
      {
        method: 'GET',
        headers,
      }
    );

    // If GET fails, try POST with JSON body
    if (!response.ok) {
      console.warn(`list_users GET failed (${response.status}), trying POST`);
      const requestBody: any = {
        page: parseInt(page),
        page_length: parseInt(page_length),
      };
      if (search_term) {
        requestBody.search_term = search_term;
      }

      response = await fetch(ERPNEXT_API_URLS.LIST_USERS, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const errorMessage = parseErpNextError(errorText, 'Failed to list users');
      
      console.error(
        `Failed to list users: ${response.status} - ${errorMessage}`,
        { errorText }
      );

      return NextResponse.json(
        { success: false, message: errorMessage, error: errorMessage, data: [], total: 0 },
        { status: response.status }
      );
    }

    const data = await response.json();
    // ERPNext API methods return { message: {...} }, unwrap it
    const result = data.message || data;
    
    // Ensure the response has the expected structure
    if (result && typeof result === 'object') {
      // If result already has success field, return as is
      if ('success' in result) {
        return NextResponse.json(result);
      }
      // Otherwise wrap it
      return NextResponse.json({
        success: true,
        ...result,
      });
    }
    
    // Fallback
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      page: parseInt(page),
      page_length: parseInt(page_length),
      total_pages: 0,
    });
  } catch (error) {
    console.error('ERPNext list users proxy error:', error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST - Create user
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
    const response = await fetch(ERPNEXT_API_URLS.CREATE_USER, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const errorMessage = parseErpNextError(errorText, 'Failed to create user');
      
      console.error(
        `Failed to create user: ${response.status} - ${errorMessage}`,
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
    console.error('ERPNext create user proxy error:', error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
