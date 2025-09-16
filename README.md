# Shopify Insights - Multi-Tenant Analytics Dashboard

A modern, multi-tenant Shopify analytics dashboard built with Next.js and Node.js, providing comprehensive insights for store owners and administrators.

---

## 🚀 Live Demo & Credentials

**Frontend (Dashboard):** https://shopify-insights-eight.vercel.app/  
**Backend API:** https://shopify-insights-production.up.railway.app/

### 🔐 Demo Login Credentials

**📋 [View Complete Login Credentials →](./LOGIN-CREDENTIALS.md)**

*Quick Access Credentials:*

**Admin Access:**
- **Email:** `abhi.admin@shopify-insights.com`

**Store Owner Access:**
- **Shop 1:** `xeno-multi-tenant-demo.myshopify.com`
  - **Email:** `owner@xeno-multi-tenant-demo.myshopify.com`
  - **Password:** `store123`
- **Shop 2:** `xeno-store-two.myshopify.com`
  - **Email:** `owner@xeno-store-two.myshopify.com`
  - **Password:** `store123`

> **Note:** These are demo credentials for evaluation purposes only. Each role provides different access levels to demonstrate the multi-tenant architecture.

---

## 📋 Table of Contents
- [Live Demo & Credentials](#-live-demo--credentials)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Assignment Requirements](#-assignment-requirements)

---

## 🚀 Features

- **Multi-Tenant Architecture**: Support for multiple Shopify stores with secure data separation  
- **Role-Based Access Control**: 
  - **Admin**: View all stores and their analytics
  - **Store Owner**: Access only their store's data
- **Real-Time Analytics**: Revenue tracking, customer analytics, order management, product performance
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **Secure Authentication**: JWT-based authentication with role-based permissions

## 🏗️ Tech Stack

**Frontend:**
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + Recharts for visualization
- Axios for API communication

**Backend:**
- Node.js + Express.js
- Prisma ORM + PostgreSQL
- JWT authentication + bcryptjs

**Deployment:**
- Backend: Railway
- Frontend: Vercel

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend Setup
```bash
cd backend
npm install

# Create .env file with:
# DATABASE_URL="postgresql://username:password@host:port/database"
# JWT_SECRET="your-super-secure-jwt-secret-key"
# PORT=8000

npx prisma generate
npx prisma db push
npm start
```

### Frontend Setup
```bash
cd frontend
npm install

# Create .env.production with:
# NEXT_PUBLIC_API_URL="https://your-backend-url.com"

npm run dev
```

## 🌐 Live Demo

- **Frontend**: https://shopify-insights-eight.vercel.app
- **Backend API**: https://shopify-insights-production.up.railway.app

### Demo Credentials
- **Admin Login**: `abhi.admin@shopify-insights.com` / `admin123`
- **Store Owner**: Enter store domain (e.g., `xeno-multi-tenant-demo.myshopify.com`)

## 📊 Key Features

- **Dashboard Analytics**: Revenue trends, customer insights, order tracking
- **Multi-Store Management**: Secure tenant isolation with role-based access
- **Real-Time Data**: Live webhook integration for up-to-date metrics
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🔧 API Endpoints

- `POST /api/auth/login` - Authentication
- `GET /api/dashboard` - Dashboard metrics  
- `GET /api/customers` - Customer data
- `GET /api/orders` - Order information
- `GET /api/revenue-trend` - Revenue analytics
- `GET /api/tenants` - Multi-tenant management (Admin only)

## 🛡️ Security

- JWT-based authentication
- Role-based access control (Admin/Store Owner)
- Tenant data isolation
- CORS protection
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

**Built with ❤️ for modern e-commerce analytics**
