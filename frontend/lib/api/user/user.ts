import { getERPNextToken } from '../utils/token';
import { ERPNEXT_API_URLS } from '@/lib/config/api.config';

export interface UserDetail {
  name: string;
  email: string;
  username?: string;
  full_name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  role: string;
  enabled: number;
  language?: string;
  creation?: string;
  modified?: string;
  owner?: string;
  modified_by?: string;
  last_active?: string | null;
}

export interface ListUsersResponse {
  success: boolean;
  data: UserDetail[];
  total: number;
  page: number;
  page_length: number;
  total_pages: number;
  error?: string;
}

export interface GetUserResponse {
  success: boolean;
  data?: UserDetail;
  error?: string;
}

export interface CreateUserResponse {
  success: boolean;
  message?: string;
  data?: UserDetail;
  password?: string;
  error?: string;
}

export interface UpdateUserResponse {
  success: boolean;
  message?: string;
  data?: UserDetail;
  error?: string;
}

export interface DeleteUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// List users with pagination and search
export async function listUsers(params?: {
  page?: number;
  page_length?: number;
  search_term?: string;
}): Promise<ListUsersResponse> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        'ERPNext authentication token not found. Please login first.'
      );
    }

    const page = params?.page || 1;
    const page_length = params?.page_length || 20;
    const search_term = params?.search_term || '';

    // Build query parameters
    let queryParams = `page=${page}&page_length=${page_length}`;
    if (search_term) {
      queryParams += `&search_term=${encodeURIComponent(search_term)}`;
    }

    const response = await fetch(`/api/erpnext/users?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorData: any = { message: 'Failed to fetch users' };
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Failed to fetch users' };
      }
      
      const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      console.error('Failed to fetch users:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorText,
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Ensure response has expected structure
    if (data && typeof data === 'object') {
      // If data has success field and it's false, treat as error
      if (data.success === false) {
        throw new Error(data.message || data.error || 'Failed to fetch users');
      }
      
      // Ensure data array exists
      if (data.data === undefined && Array.isArray(data)) {
        // If data is directly an array, wrap it
        return {
          success: true,
          data: data,
          total: data.length,
          page: page,
          page_length: page_length,
          total_pages: Math.ceil(data.length / page_length),
        };
      }
      
      return data;
    }
    
    // Fallback: return empty result
    return {
      success: true,
      data: [],
      total: 0,
      page: page,
      page_length: page_length,
      total_pages: 0,
    };
  } catch (error) {
    console.error('Failed to list users:', error);
    throw error;
  }
}

// Get a single user
export async function getUser(userName?: string): Promise<GetUserResponse> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        'ERPNext authentication token not found. Please login first.'
      );
    }

    let queryParams = '';
    if (userName) {
      queryParams = `?user_name=${encodeURIComponent(userName)}`;
    }

    const response = await fetch(`/api/erpnext/users/user${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Failed to fetch user',
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get user:', error);
    throw error;
  }
}

// Create a new user
export async function createUser(
  userData: {
    email: string;
    first_name: string;
    role: string;
    username?: string;
    middle_name?: string;
    last_name?: string;
    language?: string;
    enabled?: number;
    password?: string;
  }
): Promise<CreateUserResponse> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        'ERPNext authentication token not found. Please login first.'
      );
    }

    const response = await fetch('/api/erpnext/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: 'Failed to create user',
      error: 'Invalid response from server',
    }));

    // Check if the response indicates an error (even if status is 200)
    if (data.success === false) {
      const errorMessage = data.error || data.message || 'Failed to create user';
      throw new Error(errorMessage);
    }

    if (!response.ok) {
      const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
  }
}

// Update an existing user
export async function updateUser(
  userName: string,
  userData: {
    email?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    username?: string;
    role?: string;
    language?: string;
    enabled?: number;
    password?: string;
  }
): Promise<UpdateUserResponse> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        'ERPNext authentication token not found. Please login first.'
      );
    }

    const response = await fetch(`/api/erpnext/users/${encodeURIComponent(userName)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: 'Failed to update user',
      error: 'Invalid response from server',
    }));

    // Check if the response indicates an error (even if status is 200)
    if (data.success === false) {
      const errorMessage = data.error || data.message || 'Failed to update user';
      throw new Error(errorMessage);
    }

    if (!response.ok) {
      const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
}

// Delete (disable) a user
export async function deleteUser(
  userName: string
): Promise<DeleteUserResponse> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        'ERPNext authentication token not found. Please login first.'
      );
    }

    const response = await fetch(`/api/erpnext/users/${encodeURIComponent(userName)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: 'Failed to delete user',
      error: 'Invalid response from server',
    }));

    // Check if the response indicates an error (even if status is 200)
    if (data.success === false) {
      const errorMessage = data.error || data.message || 'Failed to delete user';
      throw new Error(errorMessage);
    }

    if (!response.ok) {
      const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
}
