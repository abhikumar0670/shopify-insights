'use client';

import { useEffect, useState } from 'react';
import api from '../utils/api';

interface Tenant {
  id: number;
  shop: string;
  createdAt: string;
  _count?: {
    customers: number;
    products: number;
    orders: number;
    users: number;
  };
}

interface User {
  id: number;
  email: string;
  role: 'STORE_OWNER' | 'ADMIN' | 'SUPER_ADMIN';
  tenantId?: number;
  tenant?: {
    id: number;
    shop: string;
  };
}

interface TenantSelectorProps {
  selectedTenantId: number | null;
  onTenantSelect: (tenantId: number | null) => void;
}

export default function TenantSelector({ selectedTenantId, onTenantSelect }: TenantSelectorProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get user data from localStorage
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
          }
      }
    }
  }, []);

  useEffect(() => {
    const fetchTenants = async () => {
      // Only fetch tenants for admin users
      if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/api/tenants');
        
        if (response.data.success) {
          setTenants(response.data.data);
        } else {
          throw new Error('API returned success: false');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const responseError = (error as {response?: {data?: {error?: string}}})?.response?.data?.error;
        setError(`Failed to load stores: ${responseError || errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTenants();
    }
  }, [user]);

  const getStoreName = (shop: string) => {
    // Convert "xeno-multi-tenant-demo.myshopify.com" to "Xeno Multi Tenant Demo"
    return shop.replace('.myshopify.com', '')
               .split('-')
               .map(word => word.charAt(0).toUpperCase() + word.slice(1))
               .join(' ');
  };

  // Hide tenant selector for store owners (they can only see their own data)
  if (user && user.role === 'STORE_OWNER') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-blue-800">
              Store Owner Access
            </p>
            <p className="text-sm text-blue-600">
              Viewing data for: {user.tenant?.shop || 'Your Store'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border p-4 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md border p-4 mb-6">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Store Selection</h2>
          <p className="text-sm text-gray-600">Choose a store to view its insights</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={selectedTenantId || ''}
              onChange={(e) => onTenantSelect(e.target.value ? parseInt(e.target.value) : null)}
              className="appearance-none bg-white px-4 py-2 pr-8 border-2 border-blue-300 rounded-lg font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:border-blue-400 transition-colors min-w-[200px]"
            >
              <option value="">All Stores</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {getStoreName(tenant.shop)}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-600">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
          
          {selectedTenantId && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Selected:</span> {getStoreName(tenants.find(t => t.id === selectedTenantId)?.shop || '')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}