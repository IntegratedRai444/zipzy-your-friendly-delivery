
import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { 'Authorization': `Bearer ${session.access_token}` };
  }
  // For demo/development fallback if session is not available but we want to test
  return {};
}

export const api = {
  async get(endpoint: string) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }
    return response.json();
  },

  async post(endpoint: string, data: any) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }
    return response.json();
  },

  async patch(endpoint: string, data: any) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }
    return response.json();
  },

  async delete(endpoint: string) {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        ...headers,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }
    return response.json();
  },
};
