'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../utils/api';

export default function LoginPage() {
  const [storeUrl, setStoreUrl] = useState('');
  const [email, setEmail] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loginType, setLoginType] = useState<'store' | 'admin'>('store');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let requestData;
      
      if (loginType === 'store') {
        // Store owner login
        if (!storeUrl.includes('.myshopify.com') && !storeUrl.includes('shopify.com')) {
          throw new Error('Please enter a valid Shopify store URL (e.g., your-store.myshopify.com)');
        }
        
        // Clean up the store URL format
        const cleanStoreUrl = storeUrl.replace(/\/admin$/, '').replace(/\/$/, '');
        
        requestData = {
          shop: cleanStoreUrl,
          email: email || undefined, // Let backend generate consistent email if not provided
          accessToken: accessToken || 'demo-token-' + Date.now(),
          role: 'STORE_OWNER'
        };
      } else {
        // Admin login
        if (!email) {
          throw new Error('Email is required for admin login');
        }
        
        requestData = {
          email: email,
          role: 'ADMIN'
        };
      }

      const response = await api.post('/api/auth/login', requestData);

      if (response.data.success && response.data.data.user && response.data.data.token) {
        const user = response.data.data.user;
        const token = response.data.data.token;
        
        // Store JWT token and user data in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('authenticated', 'true');
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('userRole', user.role);
        
        if (user.tenant) {
          localStorage.setItem('tenantId', user.tenantId.toString());
          localStorage.setItem('storeName', user.tenant.shop);
        }
        
        // Redirect based on role
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        throw new Error('Login failed - invalid response');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      const responseError = (err as {response?: {data?: {error?: string}}})?.response?.data?.error;
      setError(responseError || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    // Quick demo login without backend validation
    localStorage.setItem('authenticated', 'true');
    localStorage.setItem('tenantId', 'demo');
    localStorage.setItem('storeName', 'Demo Store');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Shopify Insights
          </h1>
          <p className="text-gray-600">
            Connect your store to view analytics
          </p>
        </div>

        {/* Login Type Selector */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setLoginType('store')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginType === 'store'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Store Owner
            </button>
            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginType === 'admin'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {loginType === 'store' && (
            <div>
              <label htmlFor="storeUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Store URL
              </label>
              <input
                type="text"
                id="storeUrl"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder="your-store.myshopify.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                required={loginType === 'store'}
                autoComplete="url"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email {loginType === 'admin' && <span className="text-red-500">*</span>}
              {loginType === 'store' && <span className="text-gray-500 text-xs ml-1">(Optional)</span>}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={loginType === 'admin' ? 'admin@company.com' : 'owner@your-store.com'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              required={loginType === 'admin'}
              autoComplete="email"
            />
          </div>

          {loginType === 'store' && (
            <div>
              <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-2">
                Access Token
                <span className="text-gray-500 text-xs ml-1">(Optional for demo)</span>
              </label>
              <input
                type="password"
                id="accessToken"
                name="accessToken"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Enter access token (optional)"
                autoComplete="new-password"
                style={{ color: '#111827' } as React.CSSProperties}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white [&::-webkit-textfield-decoration-container]:opacity-100"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? 'Signing in...' : (loginType === 'admin' ? 'Admin Login' : 'Connect Store')}
          </button>
        </form>

        {/* Demo Credentials Link */}
        <div className="mt-4 text-center">
          <a
            href="https://github.com/abhikumar0670/shopify-insights/blob/main/LOGIN-CREDENTIALS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            View Login Credentials
          </a>
          <p className="text-xs text-gray-500 mt-1">Complete demo credentials with instructions</p>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            className="mt-4 w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
          >
            Continue with Demo Data
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By connecting your store, you agree to our data processing policies.
            <br />
            Your store data is processed securely and never shared.
          </p>
        </div>
      </div>
    </div>
  );
}