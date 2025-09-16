'use client'; // This is required for components that use hooks in Next.js App Router

import { useEffect, useState } from 'react';
import api from '../utils/api';

interface DashboardData {
  customers: number;
  orders: number;
  products: number;
  totalRevenue: number;
}

interface DashboardSummaryProps {
  selectedTenantId: number | null;
}

export default function DashboardSummary({ selectedTenantId }: DashboardSummaryProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = selectedTenantId 
          ? `/api/dashboard?tenantId=${selectedTenantId}`
          : '/api/dashboard';
          
        const response = await api.get(url);
        
        if (response.data.success) {
          setData(response.data.data);
        } else {
          throw new Error('Failed to fetch dashboard data');
        }
      } catch (error) {
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTenantId]); // The empty array means this effect runs once when the component mounts

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="p-6 bg-white rounded-lg shadow-md border animate-pulse">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-8 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="p-6 bg-white rounded-lg shadow-md border">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Revenue</h3>
        <p className="text-3xl font-bold text-green-600 mt-2">
          ₹{data?.totalRevenue?.toFixed(2) || '0.00'}
        </p>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow-md border">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Orders</h3>
        <p className="text-3xl font-bold text-blue-600 mt-2">
          {data?.orders || 0}
        </p>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow-md border">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Customers</h3>
        <p className="text-3xl font-bold text-purple-600 mt-2">
          {data?.customers || 0}
        </p>
      </div>
      
      <div className="p-6 bg-white rounded-lg shadow-md border">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Products</h3>
        <p className="text-3xl font-bold text-orange-600 mt-2">
          {data?.products || 0}
        </p>
      </div>
    </div>
  );
}