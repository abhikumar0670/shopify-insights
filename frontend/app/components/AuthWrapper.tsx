'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  role: 'STORE_OWNER' | 'ADMIN' | 'SUPER_ADMIN';
  firstName?: string;
  lastName?: string;
  tenantId?: number;
  tenant?: {
    id: number;
    shop: string;
  };
}

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      // Only access localStorage on client side
      if (typeof window !== 'undefined') {
        const authenticated = localStorage.getItem('authenticated');
        const userData = localStorage.getItem('userData');
        
        if (authenticated === 'true' && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setIsAuthenticated(true);
            setUser(parsedUser);
          } catch (error) {
                router.push('/auth/login');
          }
        } else {
          router.push('/auth/login');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authenticated');
    localStorage.removeItem('userData');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('storeName');
    router.push('/auth/login');
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'User';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return `${user.role.toLowerCase().replace('_', ' ')} User`;
    }
    
    return user.tenant?.shop || user.email;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect will handle this
  }

  return (
    <div>
      {/* Navigation Bar with Logout */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Shopify Insights
              </h1>
              <span className="ml-3 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                {getUserDisplayName()}
              </span>
              {user?.role && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role.replace('_', ' ')}
                </span>
              )}
              
              {/* Navigation Links for Admins */}
              {user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? (
                <div className="ml-4 flex space-x-2">
                  <Link href="/" className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                    Store View
                  </Link>
                  <Link href="/admin" className="px-3 py-1 text-sm text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors">
                    Admin Panel
                  </Link>
                </div>
              ) : null}
            </div>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium transition duration-200 border border-red-200 hover:border-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}