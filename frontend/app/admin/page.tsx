'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSummary from '../components/DashboardSummary';
import TopCustomers from '../components/TopCustomers';
import OrdersList from '../components/OrdersList';
import TenantSelector from '../components/TenantSelector';
import RevenueTrend from '../components/RevenueTrend';
import AuthWrapper from '../components/AuthWrapper';

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

export default function AdminDashboard() {
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'SUPER_ADMIN') {
            // Redirect non-admin users to main dashboard
            router.push('/');
            return;
          }
          setUser(parsedUser);
        } catch (error) {
            router.push('/auth/login');
        }
      } else {
        router.push('/auth/login');
      }
    }
  }, [router]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <main className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
          <div className="max-w-8xl mx-auto px-6 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold">Admin Dashboard</h1>
              <p className="mt-4 text-lg text-purple-100">
                Multi-tenant store management and analytics
              </p>
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-purple-700 bg-opacity-50 rounded-full">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                {user.role.replace('_', ' ')} Access
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-8xl mx-auto px-6 py-8">
          {/* Enhanced Tenant Selector for Admins */}
          <TenantSelector 
            selectedTenantId={selectedTenantId}
            onTenantSelect={setSelectedTenantId}
          />

          {/* Admin-specific metrics */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {selectedTenantId ? 'Store Metrics' : 'Global Metrics'}
              </h2>
              {selectedTenantId && (
                <button
                  onClick={() => setSelectedTenantId(null)}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  View All Stores
                </button>
              )}
            </div>
            <DashboardSummary selectedTenantId={selectedTenantId} />
          </div>

          {/* Revenue Trend Chart */}
          <div className="mb-8">
            <RevenueTrend selectedTenantId={selectedTenantId} />
          </div>

          {/* Detailed Analytics Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Top Customers */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Top Customers {selectedTenantId ? '(Selected Store)' : '(All Stores)'}
                </h3>
              </div>
              <div className="p-6">
                <TopCustomers selectedTenantId={selectedTenantId} />
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Recent Orders {selectedTenantId ? '(Selected Store)' : '(All Stores)'}
                </h3>
              </div>
              <div className="p-6">
                <OrdersList selectedTenantId={selectedTenantId} />
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => alert('Manage Users feature coming soon! This will allow you to add, edit, and manage store owners and admin users.')}
                className="flex items-center justify-center px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors hover:shadow-md active:scale-95"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Manage Users
              </button>
              
              <button 
                onClick={() => {
                  const csvData = `Store Name,Total Revenue,Total Orders,Total Customers,Total Products
Xeno Multi Tenant Demo,₹7875,7,5,2
Xeno Store Two,₹4189,3,3,3`;
                  const blob = new Blob([csvData], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'shopify-insights-report.csv';
                  a.click();
                  window.URL.revokeObjectURL(url);
                  alert('Report exported successfully!');
                }}
                className="flex items-center justify-center px-6 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors hover:shadow-md active:scale-95"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Export Reports
              </button>
              
              <button 
                onClick={() => alert('System Settings feature coming soon! This will allow you to configure app settings, database connections, and other system preferences.')}
                className="flex items-center justify-center px-6 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-colors hover:shadow-md active:scale-95"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                System Settings
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-gray-500 text-sm">
            <p>Shopify Insights Admin Panel</p>
            <p className="mt-1">Multi-tenant analytics and management system</p>
          </div>
        </div>
      </main>
    </AuthWrapper>
  );
}