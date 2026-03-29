// src/pages/login/index.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Icon from 'components/AppIcon';
import { login, isAuthenticated } from '../../services/authService'; // FIX: named imports, no default export exists

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const data = await login(formData.email, formData.password); // FIX: direct call

      // login() throws on failure, so if we reach here it succeeded
      // Decode the token to get the user role
      const token = localStorage.getItem('token');
      let roles = [];
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const roleValue =
            payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
            payload['role'] ||
            payload['roles'];
          roles = Array.isArray(roleValue) ? roleValue : roleValue ? [roleValue] : [];
        } catch {}
      }

      if (roles.includes('Admin')) {
        navigate('/admin/dashboard');
      } else if (roles.includes('Manager')) {
        navigate('/manager/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: error.message || 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (email, password) => {
    setFormData({ email, password, rememberMe: false });
    setIsLoading(true);
    setErrors({});

    try {
      await login(email, password); // FIX: direct call

      const token = localStorage.getItem('token');
      let roles = [];
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const roleValue =
            payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
            payload['role'] ||
            payload['roles'];
          roles = Array.isArray(roleValue) ? roleValue : roleValue ? [roleValue] : [];
        } catch {}
      }

      if (roles.includes('Admin')) {
        navigate('/admin/dashboard');
      } else if (roles.includes('Manager')) {
        navigate('/manager/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setErrors({ general: error.message || 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl shadow-elevation-3 p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Icon name="Scale" size={24} color="white" />
              </div>
              <h1 className="text-2xl font-bold text-primary">LegalAnalyzer</h1>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Welcome Back</h2>
            <p className="text-text-secondary">
              Sign in to access your legal document analysis platform
            </p>
          </div>

          {/* Registration Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Icon name="CheckCircle" size={20} className="text-green-600 mr-3" />
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Icon name="AlertCircle" size={20} className="text-error mr-3" />
                  <p className="text-sm text-error">{errors.general}</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                disabled={isLoading}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 ${
                  errors.email ? 'border-error' : 'border-border-light'
                }`}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-error flex items-center">
                  <Icon name="AlertCircle" size={16} className="mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50 ${
                    errors.password ? 'border-error' : 'border-border-light'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  disabled={isLoading}
                >
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={20} />
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-error flex items-center">
                  <Icon name="AlertCircle" size={16} className="mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="h-4 w-4 text-primary focus:ring-accent border-border-medium rounded disabled:opacity-50"
                />
                <span className="ml-2 text-sm text-text-secondary">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:text-blue-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:text-blue-700 font-medium">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials Info */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-amber-800 mb-3">Demo Credentials:</h3>
          <div className="space-y-2 text-xs text-amber-700">
            <div className="flex justify-between items-center">
              <span><strong>Admin:</strong> admin@legaldocs.com / Admin@123456</span>
              <button
                onClick={() => handleDemoLogin('admin@legaldocs.com', 'Admin@123456')}
                className="ml-2 px-2 py-1 bg-amber-200 hover:bg-amber-300 rounded text-amber-900 font-medium"
                disabled={isLoading}
              >
                Use
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-amber-600 italic">
            Click "Use" to auto-fill credentials
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;