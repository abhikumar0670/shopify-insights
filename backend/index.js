const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8000;

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://shopify-insights-eight.vercel.app',
        'https://shopify-insights-production.up.railway.app',
        /^https:\/\/shopify-insights-.*\.vercel\.app$/,
        /^https:\/\/.*-abhishek-kumars-projects-.*\.vercel\.app$/
      ]
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-Topic', 'X-Shopify-Shop-Domain'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// JWT Authentication middleware
const authenticateUser = async (req, res, next) => {
  const authHeader = req.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token required' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Role-based access control
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Tenant filtering based on user role
const getTenantFilter = (user, requestedTenantId = null) => {
  switch (user.role) {
    case 'STORE_OWNER':
      if (!user.tenantId) {
        throw new Error('Store owner must be associated with a tenant');
      }
      return { tenantId: user.tenantId };
    case 'ADMIN':
    case 'SUPER_ADMIN':
      if (requestedTenantId && requestedTenantId !== 'null') {
        return { tenantId: parseInt(requestedTenantId) };
      }
      return {};
    default:
      throw new Error('Invalid user role');
  }
};

// Health check route
app.get('/', (req, res) => {
  res.send('Server is running and healthy!');
});

// Database connection with Railway environment variable

// User authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  // Add CORS headers explicitly for this endpoint
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  
  const { email, password, shop, accessToken, role = 'STORE_OWNER' } = req.body;
  
  if (!email && !shop) {
    return res.status(400).json({ 
      error: 'Email or shop domain is required',
      success: false 
    });
  }
  
  try {
    let user;
    let tenant = null;
    
    if (shop) {
      // Store owner login
      tenant = await prisma.tenant.upsert({
        where: { shop },
        update: { accessToken },
        create: { 
          shop, 
          accessToken: accessToken || 'temp-token',
          createdAt: new Date()
        }
      });
      
      let userEmail = email || `owner@${shop.replace(/\/(admin)?$/, '')}`;
      
      user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: { tenant: true }
      });
      
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            lastLogin: new Date(),
            tenantId: tenant.id
          },
          include: { tenant: true }
        });
      } else {
        const tenantUser = await prisma.user.findFirst({
          where: { 
            tenantId: tenant.id,
            role: 'STORE_OWNER'
          },
          include: { tenant: true }
        });
        
        if (tenantUser) {
          user = await prisma.user.update({
            where: { id: tenantUser.id },
            data: { 
              lastLogin: new Date(),
              email: userEmail
            },
            include: { tenant: true }
          });
        } else {
          user = await prisma.user.create({
            data: {
              email: userEmail,
              role: 'STORE_OWNER',
              tenantId: tenant.id,
              firstName: 'Store',
              lastName: 'Owner',
              createdAt: new Date(),
              lastLogin: new Date()
            },
            include: { tenant: true }
          });
        }
      }
    } else {
      // Admin login
      user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'Admin user not found' });
      }

      // Verify password for admin users
      if (password && user.passwordHash) {
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      }
      
      user = await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
        include: { tenant: true }
      });
    }
    
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
    
    const response = { 
      success: true, 
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          tenantId: user.tenantId,
          tenant: user.tenant
        },
        token: token
      }
    };
    res.json(response);
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Webhook endpoint for Shopify orders
app.post('/api/webhooks/orders/create', async (req, res) => {
  const shopDomain = req.get('X-Shopify-Shop-Domain');
  const orderData = req.body;

  if (!shopDomain) {
    return res.status(400).send('Missing shop domain header');
  }

  try {
    let tenant = await prisma.tenant.findUnique({
      where: { shop: shopDomain },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          shop: shopDomain,
          accessToken: 'webhook-auto-created',
          createdAt: new Date()
        }
      });
    }

    if (orderData.customer && orderData.customer.id) {
      await prisma.customer.upsert({
        where: { id: orderData.customer.id.toString() },
        update: {
          email: orderData.customer.email,
          firstName: orderData.customer.first_name,
          lastName: orderData.customer.last_name,
        },
        create: {
          id: orderData.customer.id.toString(),
          email: orderData.customer.email,
          firstName: orderData.customer.first_name,
          lastName: orderData.customer.last_name,
          tenantId: tenant.id,
        },
      });
    }

    await prisma.order.create({
      data: {
        id: orderData.id.toString(),
        totalPrice: parseFloat(orderData.total_price),
        createdAt: new Date(orderData.created_at),
        tenantId: tenant.id,
        customerId: orderData.customer?.id?.toString() || null
      },
    });

    res.status(200).send('Webhook received successfully');
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

// Get all tenants endpoint (Admin only)
app.get('/api/tenants', authenticateUser, requireRole(['ADMIN']), async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        shop: true,
        createdAt: true,
        _count: {
          select: {
            customers: true,
            products: true,
            orders: true,
            users: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    res.json({ success: true, data: tenants });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// API Endpoints for dashboard
app.get('/api/customers', authenticateUser, async (req, res) => {
  try {
    const { tenantId } = req.query;
    const whereClause = getTenantFilter(req.user, tenantId);
    
    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            shop: true
          }
        },
        orders: {
          select: {
            id: true,
            totalPrice: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ 
      success: true, 
      data: customers
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.get('/api/orders', authenticateUser, async (req, res) => {
  try {
    const { tenantId } = req.query;
    const whereClause = getTenantFilter(req.user, tenantId);
    
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            shop: true
          }
        },
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ 
      success: true, 
      data: orders
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/products', authenticateUser, async (req, res) => {
  try {
    const { tenantId } = req.query;
    const whereClause = getTenantFilter(req.user, tenantId);
    
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            shop: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ 
      success: true, 
      data: products
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/dashboard', authenticateUser, async (req, res) => {
  try {
    const { tenantId } = req.query;
    const whereClause = getTenantFilter(req.user, tenantId);
    
    const [customerCount, orderCount, productCount, totalRevenue] = await Promise.all([
      prisma.customer.count({ where: whereClause }),
      prisma.order.count({ where: whereClause }),
      prisma.product.count({ where: whereClause }),
      prisma.order.aggregate({ where: whereClause, _sum: { totalPrice: true } })
    ]);

    res.json({
      success: true,
      data: {
        customers: customerCount,
        orders: orderCount,
        products: productCount,
        totalRevenue: totalRevenue._sum.totalPrice || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

app.get('/api/revenue-trend', authenticateUser, async (req, res) => {
  try {
    const { tenantId, days = '30' } = req.query;
    const daysNum = parseInt(days);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const tenantFilter = getTenantFilter(req.user, tenantId);
    
    const whereClause = {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      ...tenantFilter
    };

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        totalPrice: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const dailyData = {};
    
    for (let i = 0; i < daysNum; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (daysNum - 1 - i));
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = { revenue: 0, orders: 0 };
    }

    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].revenue += parseFloat(order.totalPrice);
        dailyData[dateKey].orders += 1;
      }
    });

    const trendData = Object.entries(dailyData).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue),
      orders: data.orders
    }));

    res.json({
      success: true,
      data: trendData
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch revenue trend data' });
  }
});

app.get('/api/top-customers', authenticateUser, async (req, res) => {
  try {
    const { tenantId, limit = '5' } = req.query;
    const limitNum = parseInt(limit);
    
    const tenantFilter = getTenantFilter(req.user, tenantId);
    
    const customers = await prisma.customer.findMany({
      where: tenantFilter,
      include: {
        orders: {
          select: {
            totalPrice: true
          }
        },
        tenant: {
          select: {
            shop: true
          }
        }
      }
    });
    
    const customersWithSpend = customers.map(customer => {
      const totalSpend = customer.orders.reduce((sum, order) => sum + parseFloat(order.totalPrice), 0);
      return {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        totalSpend: Math.round(totalSpend * 100) / 100,
        orderCount: customer.orders.length,
        shop: customer.tenant.shop
      };
    }).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, limitNum);
    
    res.json({
      success: true,
      data: customersWithSpend
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch top customers data' });
  }
});

app.get('/api/recent-orders', authenticateUser, async (req, res) => {
  try {
    const { tenantId, limit = '10' } = req.query;
    const limitNum = parseInt(limit);
    
    const tenantFilter = getTenantFilter(req.user, tenantId);
    
    const orders = await prisma.order.findMany({
      where: tenantFilter,
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        tenant: {
          select: {
            shop: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limitNum
    });
    
    const formattedOrders = orders.map(order => ({
      id: order.id,
      totalPrice: Math.round(parseFloat(order.totalPrice) * 100) / 100,
      createdAt: order.createdAt,
      customer: order.customer ? {
        name: `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.email,
        email: order.customer.email
      } : null,
      shop: order.tenant.shop
    }));
    
    res.json({
      success: true,
      data: formattedOrders
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent orders data' });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Database initialization
async function initializeDatabase() {
  try {
    const adminExists = await prisma.user.findUnique({
      where: { email: 'abhi.admin@shopify-insights.com' }
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          email: 'abhi.admin@shopify-insights.com',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          firstName: 'Admin',
          lastName: 'User',
          isActive: true
        }
      });

      const tenant1 = await prisma.tenant.create({
        data: {
          shop: 'xeno-multi-tenant-demo.myshopify.com',
          accessToken: 'production-token-1'
        }
      });

      const tenant2 = await prisma.tenant.create({
        data: {
          shop: 'xeno-store-two.myshopify.com',
          accessToken: 'production-token-2'
        }
      });

      const storeOwner1Password = await bcrypt.hash('store123', 10);
      await prisma.user.create({
        data: {
          email: 'owner@xeno-multi-tenant-demo.myshopify.com',
          passwordHash: storeOwner1Password,
          role: 'STORE_OWNER',
          firstName: 'Xeno Multi',
          lastName: 'Tenant Demo',
          tenantId: tenant1.id,
          isActive: true
        }
      });

      const storeOwner2Password = await bcrypt.hash('store123', 10);
      await prisma.user.create({
        data: {
          email: 'owner@xeno-store-two.myshopify.com',
          passwordHash: storeOwner2Password,
          role: 'STORE_OWNER',
          firstName: 'Xeno Store',
          lastName: 'Two',
          tenantId: tenant2.id,
          isActive: true
        }
      });

      // Create sample data
      const customers1 = [];
      for (let i = 1; i <= 8; i++) {
        const customer = await prisma.customer.create({
          data: {
            id: `xeno_demo_cust_${i}`,
            email: `customer${i}@xeno-demo.com`,
            firstName: `Demo Customer`,
            lastName: `${i}`,
            tenantId: tenant1.id
          }
        });
        customers1.push(customer);
      }

      const customers2 = [];
      for (let i = 1; i <= 6; i++) {
        const customer = await prisma.customer.create({
          data: {
            id: `xeno_store2_cust_${i}`,
            email: `customer${i}@xeno-store-two.com`,
            firstName: `Store2 Customer`,
            lastName: `${i}`,
            tenantId: tenant2.id
          }
        });
        customers2.push(customer);
      }

      await prisma.product.createMany({
        data: [
          { id: 'xeno_demo_prod_1', title: 'Premium Analytics Dashboard', vendor: 'Xeno Solutions', price: 299.99, tenantId: tenant1.id },
          { id: 'xeno_demo_prod_2', title: 'Customer Insights Pro', vendor: 'Xeno Solutions', price: 199.99, tenantId: tenant1.id },
          { id: 'xeno_demo_prod_3', title: 'Multi-Tenant Manager', vendor: 'Xeno Solutions', price: 399.99, tenantId: tenant1.id },
          { id: 'xeno_store2_prod_1', title: 'Enterprise Solution', vendor: 'Store Two Enterprises', price: 599.99, tenantId: tenant2.id },
          { id: 'xeno_store2_prod_2', title: 'Data Integration Suite', vendor: 'Store Two Enterprises', price: 449.99, tenantId: tenant2.id }
        ]
      });

      for (let i = 1; i <= 12; i++) {
        await prisma.order.create({
          data: {
            id: `xeno_demo_order_${i}`,
            totalPrice: Math.floor(Math.random() * 500) + 100,
            customerId: customers1[i % customers1.length].id,
            tenantId: tenant1.id,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000)
          }
        });
      }

      for (let i = 1; i <= 8; i++) {
        await prisma.order.create({
          data: {
            id: `xeno_store2_order_${i}`,
            totalPrice: Math.floor(Math.random() * 800) + 200,
            customerId: customers2[i % customers2.length].id,
            tenantId: tenant2.id,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 45) * 24 * 60 * 60 * 1000)
          }
        });
      }
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await initializeDatabase();
});