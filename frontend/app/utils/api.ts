'use client';

import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000, // Increased timeout for production
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable credentials for CORS
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
interface QueueItem {
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
}
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  
  failedQueue = [];
};

// Add JWT authentication headers to all requests (except login)
api.interceptors.request.use((config) => {
  // API request logging
  
  // Skip authentication headers for login and refresh endpoints
  if (config.url?.includes('/api/auth/login') || config.url?.includes('/api/auth/refresh')) {
    // Skipping auth for auth endpoints
    return config;
  }
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    // Auth check performed
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Authorization header added
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          // User details processed
        } catch (error) {
          }
      }
    } else {
    }
  }
  return config;
});

// Handle authentication errors with automatic token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorCode = error.response?.data?.code;
      
      if (errorCode === 'TOKEN_EXPIRED' && typeof window !== 'undefined') {
        // Token expired - try to refresh
        if (isRefreshing) {
          // If already refreshing, wait for it to complete
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            const newToken = localStorage.getItem('authToken');
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
            return Promise.reject(error);
          }).catch((err) => {
            return Promise.reject(err);
          });
        }
        
        originalRequest._retry = true;
        isRefreshing = true;
        
        try {
          const currentToken = localStorage.getItem('authToken');
          if (!currentToken) {
            throw new Error('No token to refresh');
          }
          
            const refreshResponse = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (refreshResponse.data.success && refreshResponse.data.data.token) {
            const newToken = refreshResponse.data.data.token;
            const userData = refreshResponse.data.data.user;
            
            // Update stored auth data
            localStorage.setItem('authToken', newToken);
            localStorage.setItem('userData', JSON.stringify(userData));
            
                // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            processQueue();
            
            return api(originalRequest);
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (refreshError) {
            processQueue(refreshError);
          
          // Clear invalid authentication data
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          localStorage.removeItem('authenticated');
          
          // Redirect to login
          window.location.href = '/auth/login';
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Other auth errors - clear data and redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          localStorage.removeItem('authenticated');
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;