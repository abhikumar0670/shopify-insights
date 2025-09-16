'use client';

import { useEffect, useState } from 'react';
import api from '../utils/api';

interface TestResult {
  endpoint: string;
  name: string;
  status: 'success' | 'error';
  data?: unknown;
  error?: unknown;
}

interface User {
  id: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

export default function ApiTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          } catch (error) {
          }
      } else {
      }
    }
  }, []);

  const testEndpoint = async (endpoint: string, name: string) => {
    try {
      // Testing API endpoint
      const response = await api.get(endpoint);
      setResults(prev => [...prev, { endpoint, name, status: 'success', data: response.data }]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const responseData = (error as {response?: {data?: unknown}})?.response?.data;
      setResults(prev => [...prev, { 
        endpoint, 
        name, 
        status: 'error', 
        error: responseData || errorMessage 
      }]);
    }
  };

  const runTests = async () => {
    setResults([]);
    await testEndpoint('/api/tenants', 'Tenants');
    await testEndpoint('/api/dashboard', 'Dashboard');
    await testEndpoint('/api/customers', 'Customers');
    await testEndpoint('/api/orders', 'Orders');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">User Data:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {user ? JSON.stringify(user, null, 2) : 'No user data'}
        </pre>
      </div>

      <button 
        onClick={runTests}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
      >
        Run API Tests
      </button>

      <div>
        <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
        {results.map((result, index) => (
          <div key={index} className={`p-4 mb-2 rounded ${
            result.status === 'success' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <h3 className="font-semibold">
              [{result.status === 'success' ? 'PASS' : 'FAIL'}] {result.name} ({result.endpoint})
            </h3>
            <pre className="text-sm mt-2 overflow-auto">
              {JSON.stringify(result.data || result.error, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}