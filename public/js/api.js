// NEXUS GEAR API Client Wrapper

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // Setup headers
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, options);
    
    // Check if empty response or text
    const contentType = response.headers.get('content-type');
    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg = (data && data.error) ? data.error : `HTTP error! Status: ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`API Request failed for ${endpoint}:`, err);
    throw err;
  }
}

const api = {
  // Product Endpoints
  products: {
    getAll: (category = '', search = '') => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      
      const query = params.toString();
      return request(`/products${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/products/${id}`)
  },

  // Authentication Endpoints
  auth: {
    register: (username, email, password) => 
      request('/auth/register', {
        method: 'POST',
        body: { username, email, password }
      }),
    login: (email, password) => 
      request('/auth/login', {
        method: 'POST',
        body: { email, password }
      }),
    logout: () => 
      request('/auth/logout', { method: 'POST' }),
    me: async () => {
      try {
        return await request('/auth/me');
      } catch (err) {
        // If not authenticated, return null instead of throwing
        return null;
      }
    }
  },

  // Order Endpoints
  orders: {
    create: (shipping_address, items) => 
      request('/orders', {
        method: 'POST',
        body: { shipping_address, items }
      }),
    getUserOrders: () => request('/orders'),
    getDetails: (id) => request(`/orders/${id}`),
    
    // Admin actions
    adminGetAll: () => request('/orders/admin/all'),
    adminUpdateStatus: (id, status) => 
      request(`/orders/admin/${id}`, {
        method: 'PATCH',
        body: { status }
      })
  }
};

window.api = api;
