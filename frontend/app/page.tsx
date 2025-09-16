'use client';

import { useState, useEffect } from 'react';
import DashboardSummary from './components/DashboardSummary';
import TopCustomers from './components/TopCustomers';
import OrdersList from './components/OrdersList';
import TenantSelector from './components/TenantSelector';
import RevenueTrend from './components/RevenueTrend';
import AuthWrapper from './components/AuthWrapper';

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

export default function Home() {
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Get user data and auto-select tenant for store owners
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Auto-select tenant for store owners
          if (parsedUser.role === 'STORE_OWNER' && parsedUser.tenantId) {
                setSelectedTenantId(parsedUser.tenantId);
          }
        } catch (error) {
          }
      }
    }
  }, []);
  return (
    <AuthWrapper>
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-8xl mx-auto px-6 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900">Store Dashboard</h1>
              <p className="mt-4 text-lg text-gray-600">Your store insights and analytics</p>
              
              {/* Admin Link */}
              <div className="mt-4">
                <a 
                  href="/admin" 
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>

      {/* Dashboard Content */}
      <div className="max-w-8xl mx-auto px-6 py-8">
        {/* Tenant Selector */}
        <TenantSelector 
          selectedTenantId={selectedTenantId}
          onTenantSelect={setSelectedTenantId}
        />

        {/* Key Metrics Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Key Metrics</h2>
          <DashboardSummary selectedTenantId={selectedTenantId} />
        </div>

        {/* Revenue Trend Chart */}
        <div className="mb-8">
          <RevenueTrend selectedTenantId={selectedTenantId} />
        </div>

        {/* Two Column Layout for Details */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Top Customers */}
          <div>
            <TopCustomers selectedTenantId={selectedTenantId} />
          </div>

          {/* Recent Orders */}
          <div>
            <OrdersList selectedTenantId={selectedTenantId} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Shopify Data Ingestion & Insights Service</p>
          <p className="mt-1">Built for enterprise retailers • Multi-tenant architecture</p>
        </div>
      </div>
    </main>
    </AuthWrapper>
  );
}