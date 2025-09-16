'use client';

import { useEffect, useState } from 'react';
import api from '../utils/api';

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  totalSpend: number;
  orderCount: number;
  shop: string;
}

interface TopCustomersProps {
  selectedTenantId: number | null;
}

export default function TopCustomers({ selectedTenantId }: TopCustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const url = selectedTenantId 
          ? `/api/top-customers?tenantId=${selectedTenantId}&limit=5`
          : `/api/top-customers?limit=5`;
          
        const response = await api.get(url);
        
        if (response.data.success) {
          // The API now returns customers already sorted with totalSpend calculated
          setCustomers(response.data.data);
        } else {
          throw new Error('Failed to fetch customers data');
        }
      } catch (error) {
        setError('Failed to load customers data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [selectedTenantId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Top 5 Customers by Spend</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
                <div className="h-6 bg-gray-300 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Top 5 Customers by Spend</h2>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Top 5 Customers by Spend</h2>
      
      {customers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No customers found yet.</p>
          <p className="text-sm mt-2">Customers will appear here after orders are processed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer, index) => (
            <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {customer.firstName && customer.lastName 
                      ? `${customer.firstName} ${customer.lastName}`
                      : customer.email
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    {customer.email} • {customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">
                  ₹{customer.totalSpend?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}