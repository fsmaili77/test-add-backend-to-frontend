// src/services/authService.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5093'; // Your ASP.NET Core Identity URL

/**
 * Login — store token and clear any previous user's client selection
 */
export const login = async (email, password) => {
  const response = await fetch(`${AUTH_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();

  // Clear previous user's client selection before storing new token
  localStorage.removeItem('selectedClientId');

  // Store the new token
  localStorage.setItem('token', data.token || data.accessToken);

  // Dispatch storage event so ClientContext reacts
  window.dispatchEvent(new Event('storage'));

  return data;
};

/**
 * Logout — clear token AND client selection
 */
export const logout = async () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch(`${AUTH_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // Proceed with local cleanup even if server call fails
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedClientId'); // ← Critical: clear client on logout
    sessionStorage.clear();
    window.dispatchEvent(new Event('storage'));
  }
};

/**
 * Get the currently authenticated user's profile
 */
export const getCurrentUser = async () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;

  const response = await fetch(`${AUTH_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return null;
  return response.json();
};

/**
 * Check if the user is authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check token expiry
    return payload.exp ? payload.exp * 1000 > Date.now() : true;
  } catch {
    return false;
  }
};

/**
 * Get the current user's role
 */
export const getUserRole = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      payload['role'] ||
      null
    );
  } catch {
    return null;
  }
};

/**
 * Attempt to refresh the access token
 */
export const refreshAccessToken = async () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) throw new Error('No token to refresh');

  const response = await fetch(`${AUTH_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const data = await response.json();
  const newToken = data.token || data.accessToken;
  if (newToken) {
    localStorage.setItem('token', newToken);
  }
  return data;
};

/**
 * Register a new user account
 */
export const register = async ({ username, email, password, firstName, lastName, organization, position }) => {
  const response = await fetch(`${AUTH_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, firstName, lastName, organization, position }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
};

/**
 * Get authorization headers for JSON API requests
 * ✅ Includes Content-Type: application/json for standard fetch/axios calls
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
};

/**
 * 🔥 NEW: Get authorization headers for multipart/form-data requests (FormData uploads)
 * ✅ Returns ONLY Authorization header - NO Content-Type
 * ✅ Lets axios/browser auto-set multipart boundary parameter
 * 
 * Usage: 
 *   axios.post(url, formData, { headers: getMultipartAuthHeaders() })
 */
export const getMultipartAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  // ✅ Return ONLY Authorization - let browser/axios set Content-Type with boundary
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

/**
 * Helper: Get token string directly (for manual header construction)
 */
export const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

/**
 * Helper: Check if token is expired
 */
export const isTokenExpired = (token = null) => {
  const tokenToCheck = token || localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!tokenToCheck) return true;
  
  try {
    const payload = JSON.parse(atob(tokenToCheck.split('.')[1]));
    return payload.exp ? payload.exp * 1000 <= Date.now() : false;
  } catch {
    return true;
  }
};