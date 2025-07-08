import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from 'components/AppIcon';


const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Mock credentials for different user types
  const mockCredentials = [
    { email: 'attorney@legalfirm.com', password: 'Legal@123', role: 'Attorney' },
    { email: 'paralegal@legalfirm.com', password: 'Para@456', role: 'Paralegal' },
    { email: 'researcher@legalfirm.com', password: 'Research@789', role: 'Legal Researcher' },
    { email: 'admin@legalfirm.com', password: 'Admin@2024', role: 'Administrator' }
  ];

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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check credentials
      const validUser = mockCredentials.find(
        cred => cred.email === formData.email && cred.password === formData.password
      );

      if (!validUser) {
        setErrors({ 
          general: 'Invalid email or password. Please check your credentials and try again.' 
        });
        setIsLoading(false);
        return;
      }

      // Show two-factor authentication
      setShowTwoFactor(true);
      setIsLoading(false);
      
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' });
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setErrors({ twoFactor: 'Please enter a valid 6-digit code' });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate 2FA verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock 2FA code validation (accept 123456 or 000000)
      if (twoFactorCode !== '123456' && twoFactorCode !== '000000') {
        setErrors({ twoFactor: 'Invalid verification code. Please try again.' });
        setIsLoading(false);
        return;
      }

      // Store auth token and user info
      localStorage.setItem('authToken', 'mock-jwt-token');
      localStorage.setItem('userEmail', formData.email);
      
      // Redirect to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      setErrors({ twoFactor: 'Verification failed. Please try again.' });
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    // Mock resend functionality
    alert('Verification code sent to your registered mobile number');
  };

  if (showTwoFactor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl shadow-elevation-3 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <Icon name="Shield" size={32} color="white" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Two-Factor Authentication</h1>
              <p className="text-text-secondary">
                Enter the 6-digit code sent to your registered mobile number
              </p>
            </div>

            {/* Two-Factor Form */}
            <form onSubmit={handleTwoFactorSubmit} className="space-y-6">
              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-text-primary mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="twoFactorCode"
                  name="twoFactorCode"
                  value={twoFactorCode}
                  onChange={(e) => {
                    setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (errors.twoFactor) {
                      setErrors(prev => ({ ...prev, twoFactor: '' }));
                    }
                  }}
                  placeholder="000000"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-center text-2xl font-mono tracking-widest ${
                    errors.twoFactor ? 'border-error' : 'border-border-light'
                  }`}
                  maxLength={6}
                />
                {errors.twoFactor && (
                  <p className="mt-2 text-sm text-error flex items-center">
                    <Icon name="AlertCircle" size={16} className="mr-1" />
                    {errors.twoFactor}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || twoFactorCode.length !== 6}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-primary hover:text-blue-700 text-sm font-medium"
                >
                  Resend Code
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowTwoFactor(false);
                  setTwoFactorCode('');
                  setErrors({});
                }}
                className="w-full text-text-secondary hover:text-text-primary text-sm font-medium"
              >
                ← Back to Login
              </button>
            </form>
          </div>

          {/* Mock Credentials Info */}
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 font-medium mb-2">Demo 2FA Code:</p>
            <p className="text-sm text-amber-700">Use <strong>123456</strong> or <strong>000000</strong> to proceed</p>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="text-text-secondary">Sign in to access your legal document analysis platform</p>
          </div>

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
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
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
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors.password ? 'border-error' : 'border-border-light'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
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
                  className="h-4 w-4 text-primary focus:ring-accent border-border-medium rounded"
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

        {/* Mock Credentials Info */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-amber-800 mb-3">Demo Credentials:</h3>
          <div className="space-y-2 text-xs text-amber-700">
            <div><strong>Attorney:</strong> attorney@legalfirm.com / Legal@123</div>
            <div><strong>Paralegal:</strong> paralegal@legalfirm.com / Para@456</div>
            <div><strong>Researcher:</strong> researcher@legalfirm.com / Research@789</div>
            <div><strong>Admin:</strong> admin@legalfirm.com / Admin@2024</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;