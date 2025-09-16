const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Use Railway database URL
const prisma = new PrismaClient({
  datasourceUrl: "postgresql://postgres:uPOXKYfkYpksKsdQFXcSbpBHpptIAltY@tramway.proxy.rlwy.net:45547/railway"
});

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Create Admin User
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'abhi.admin@shopify-insights.com' },
      update: {},
      create: {
        email: 'abhi.admin@shopify-insights.com',
        passwordHash: hashedAdminPassword,
        role: 'ADMIN',
        firstName: 'Abhi',
        lastName: 'Admin'
      }
    });
    console.log('✅ Admin user created:', adminUser.email);

    // Create TechStore Tenant
    const techStoreTenant = await prisma.tenant.upsert({
      where: { shop: 'techstore.myshopify.com' },
      update: {},
      create: {
        shop: 'techstore.myshopify.com',
        accessToken: 'sample_access_token_tech'
      }
    });
    console.log('✅ TechStore tenant created:', techStoreTenant.shop);

    // Create Store Owner for TechStore
    const hashedStorePassword = await bcrypt.hash('storeowner123', 10);
    const storeOwnerUser = await prisma.user.upsert({
      where: { email: 'john.doe@techstore.com' },
      update: {},
      create: {
        email: 'john.doe@techstore.com',
        passwordHash: hashedStorePassword,
        role: 'STORE_OWNER',
        firstName: 'John',
        lastName: 'Doe',
        tenantId: techStoreTenant.id
      }
    });
    console.log('✅ Store owner created:', storeOwnerUser.email);

    // Create Fashion Hub Tenant
    const fashionTenant = await prisma.tenant.upsert({
      where: { shop: 'fashionhub.myshopify.com' },
      update: {},
      create: {
        shop: 'fashionhub.myshopify.com',
        accessToken: 'sample_access_token_fashion'
      }
    });
    console.log('✅ Fashion Hub tenant created:', fashionTenant.shop);

    // Create Store Owner for Fashion Hub
    const fashionOwnerUser = await prisma.user.upsert({
      where: { email: 'sarah.wilson@fashionhub.com' },
      update: {},
      create: {
        email: 'sarah.wilson@fashionhub.com',
        passwordHash: hashedStorePassword,
        role: 'STORE_OWNER',
        firstName: 'Sarah',
        lastName: 'Wilson',
        tenantId: fashionTenant.id
      }
    });
    console.log('✅ Fashion Hub owner created:', fashionOwnerUser.email);

    // Add some sample customers for TechStore
    const customer1 = await prisma.customer.upsert({
      where: { id: 'cust_001' },
      update: {},
      create: {
        id: 'cust_001',
        email: 'alice.smith@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
        tenantId: techStoreTenant.id
      }
    });

    const customer2 = await prisma.customer.upsert({
      where: { id: 'cust_002' },
      update: {},
      create: {
        id: 'cust_002',
        email: 'bob.johnson@example.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        tenantId: techStoreTenant.id
      }
    });

    console.log('✅ Sample customers created');

    // Add some sample products
    const product1 = await prisma.product.upsert({
      where: { id: 'prod_001' },
      update: {},
      create: {
        id: 'prod_001',
        title: 'Wireless Headphones',
        price: 199.99,
        vendor: 'TechBrand',
        tenantId: techStoreTenant.id
      }
    });

    const product2 = await prisma.product.upsert({
      where: { id: 'prod_002' },
      update: {},
      create: {
        id: 'prod_002',
        title: 'Smartphone Case',
        price: 29.99,
        vendor: 'AccessoryPlus',
        tenantId: techStoreTenant.id
      }
    });

    console.log('✅ Sample products created');

    // Add some sample orders
    const order1 = await prisma.order.upsert({
      where: { id: 'order_001' },
      update: {},
      create: {
        id: 'order_001',
        totalPrice: 199.99,
        customerId: customer1.id,
        tenantId: techStoreTenant.id,
        createdAt: new Date('2024-09-10')
      }
    });

    const order2 = await prisma.order.upsert({
      where: { id: 'order_002' },
      update: {},
      create: {
        id: 'order_002',
        totalPrice: 29.99,
        customerId: customer2.id,
        tenantId: techStoreTenant.id,
        createdAt: new Date('2024-09-12')
      }
    });

    console.log('✅ Sample orders created');
    console.log('🎉 Database seeding completed successfully!');
    
    console.log('\n📋 Login Credentials:');
    console.log('Admin: abhi.admin@shopify-insights.com / admin123');
    console.log('Store Owner (TechStore): john.doe@techstore.com / storeowner123');
    console.log('Store Owner (Fashion Hub): sarah.wilson@fashionhub.com / storeowner123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();