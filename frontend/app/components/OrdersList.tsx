'use client';

import { useEffect, useState } from 'react';
import api from '../utils/api';

interface Order {
  id: string;
  totalPrice: number;
  createdAt: string;
  shop: string;
  customer: {
    name: string;
    email: string;
  } | null;
}

interface OrdersListProps {
  selectedTenantId: number | null;
}

export default function OrdersList({ selectedTenantId }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const url = selectedTenantId 
          ? `/api/recent-orders?tenantId=${selectedTenantId}&limit=10`
          : `/api/recent-orders?limit=10`;
          
        const response = await api.get(url);
        
        if (response.data.success) {
          let filteredOrders = response.data.data;
          // Orders data loaded
          
          // Apply date filtering if needed
          if (dateFilter !== 'all') {
            const now = new Date();
            const filterDate = new Date();
            
            switch (dateFilter) {
              case '7days':
                filterDate.setDate(now.getDate() - 7);
                break;
              case '30days':
                filterDate.setDate(now.getDate() - 30);
                break;
              case '90days':
                filterDate.setDate(now.getDate() - 90);
                break;
            }
            
            filteredOrders = filteredOrders.filter((order: Order) => 
              new Date(order.createdAt) >= filterDate
            );
          }
            
          setOrders(filteredOrders);
        } else {
          throw new Error('Failed to fetch orders data');
        }
      } catch (error) {
        setError('Failed to load orders data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [dateFilter, selectedTenantId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getStatusBadge = (status: string, type: 'financial' | 'fulfillment') => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    
    if (type === 'financial') {
      switch (status?.toLowerCase()) {
        case 'paid':
          return `${baseClasses} bg-green-100 text-green-800`;
        case 'pending':
          return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case 'refunded':
          return `${baseClasses} bg-red-100 text-red-800`;
        default:
          return `${baseClasses} bg-gray-100 text-gray-800`;
      }
    } else {
      switch (status?.toLowerCase()) {
        case 'fulfilled':
          return `${baseClasses} bg-green-100 text-green-800`;
        case 'partial':
          return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case 'unfulfilled':
          return `${baseClasses} bg-red-100 text-red-800`;
        default:
          return `${baseClasses} bg-gray-100 text-gray-800`;
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
          <div className="h-8 bg-gray-300 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse p-4 border rounded-lg">
              <div className="flex justify-between items-start">
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
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Orders</h2>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Recent Orders</h2>
        <div className="relative">
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="appearance-none bg-white px-4 py-2 pr-8 border-2 border-blue-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm hover:border-blue-400 transition-colors"
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-600">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
      </div>
      
      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No orders found for the selected period.</p>
          <p className="text-sm mt-2">Orders will appear here when they are received from Shopify.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">#{order.id}</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {order.customer ? order.customer.name : 'Guest Order'}
                  </p>
                  <p className="text-sm text-gray-700 mt-1 font-medium">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    ₹{order.totalPrice?.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}