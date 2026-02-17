// src/services/authService.js - Fixed to prevent infinite refresh loop
import axios from 'axios';

const API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api';

class AuthService {
  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.refreshTokenTimeout = null;
    this.isRefreshing = false; // ADD THIS: Prevent concurrent refresh attempts
    this.failedQueue = []; // ADD THIS: Queue failed requests during refresh

    // Setup axios interceptors
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor - add token to all requests
    axios.interceptors.request.use(
      (config) => {
        if (this.accessToken && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // CRITICAL: Don't intercept refresh endpoint errors to prevent infinite loop
        if (originalRequest.url?.includes('/auth/refresh')) {
          return Promise.reject(error);
        }

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(token => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axios(originalRequest);
              })
              .catch(err => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            
            // Process queued requests
            this.failedQueue.forEach(({ resolve }) => resolve(newToken));
            this.failedQueue = [];
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Process queued requests with error
            this.failedQueue.forEach(({ reject }) => reject(refreshError));
            this.failedQueue = [];
            
            // Clear tokens and redirect to login
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { accessToken, refreshToken, user } = response.data;

      this.setTokens(accessToken, refreshToken);
      this.setUser(user);
      this.scheduleTokenRefresh();

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Invalid email or password';
      return { success: false, error: errorMessage };
    }
  }

  async register(userData) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 'Registration failed';
      return { success: false, error: errorMessage };
    }
  }

  async logout() {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  async refreshAccessToken() {
    if (!this.accessToken || !this.refreshToken) {
      throw new Error('No tokens available');
    }

    try {
      // Make direct axios call without interceptor interference
      const response = await axios.post(
        `${API_URL}/auth/refresh`,
        {
          accessToken: this.accessToken,
          refreshToken: this.refreshToken
        },
        {
          // Don't use default headers to avoid circular token issues
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const { accessToken, refreshToken } = response.data;
      this.setTokens(accessToken, refreshToken);
      
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      
      this.setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  async forgotPassword(email) {
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to send reset email' };
    }
  }

  async resetPassword(email, token, newPassword) {
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        token,
        newPassword
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to reset password' };
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await axios.put(`${API_URL}/usermanagement/profile`, profileData, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update profile' };
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await axios.put(`${API_URL}/usermanagement/change-password`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to change password' };
    }
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  setUser(user) {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken'); // Legacy token
    
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }
  }

  scheduleTokenRefresh() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }

    // Refresh token 5 minutes before expiration (7200s - 300s = 6900s)
    this.refreshTokenTimeout = setTimeout(() => {
      this.refreshAccessToken().catch(() => {
        this.clearTokens();
        window.location.href = '/login';
      });
    }, 6900 * 1000);
  }

  isAuthenticated() {
    return !!this.accessToken && !!this.user;
  }

  getUser() {
    return this.user;
  }

  hasRole(role) {
    return this.user?.roles?.includes(role) || false;
  }

  hasAnyRole(...roles) {
    return roles.some(role => this.hasRole(role));
  }

  canAccessAdvancedFeatures() {
    return this.hasAnyRole('Admin', 'Manager', 'Lawyer');
  }

  canManageUsers() {
    return this.hasAnyRole('Admin', 'Manager');
  }

  isAdmin() {
    return this.hasRole('Admin');
  }

  getAuthHeaders() {
    if (!this.accessToken) {
      return {};
    }
    return {
      'Authorization': `Bearer ${this.accessToken}`
    };
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;