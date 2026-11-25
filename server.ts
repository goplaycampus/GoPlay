import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  CATEGORIES,
  DEFAULT_SETTINGS,
  SEED_COUPONS,
  SEED_EXPENSES,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_REQUESTS,
  SEED_REVIEWS,
  SEED_SUPPLIERS,
} from './src/data/catalog.ts';
import type {
  AuditLog,
  B2BEnquiry,
  Coupon,
  Expense,
  InventoryTransaction,
  Order,
  Product,
  ProductRequest,
  Review,
  StoreSettings,
  Supplier,
  UserAccount,
} from './src/types.ts';
import {
  calculateCartTotals,
  calculateLandedCost,
  calculateSupplierWeightedScore,
  generateTrackingCode,
  normalizeBangladeshPhone,
  validateBangladeshPhone,
} from './src/utils/commerce.ts';

interface DatabaseState {
  products: Product[];
  orders: Order[];
  requests: ProductRequest[];
  b2bEnquiries: B2BEnquiry[];
  suppliers: Supplier[];
  expenses: Expense[];
  coupons: Coupon[];
  reviews: Review[];
  inventoryTransactions: InventoryTransaction[];
  auditLogs: AuditLog[];
  settings: StoreSettings;
  users: (UserAccount & { passwordHash: string })[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'goplay-db.json');

function hashPassword(pw: string): string {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function createInitialState(): DatabaseState {
  return {
    products: structuredClone(SEED_PRODUCTS),
    orders: structuredClone(SEED_ORDERS),
    requests: structuredClone(SEED_REQUESTS),
    b2bEnquiries: [],
    suppliers: structuredClone(SEED_SUPPLIERS),
    expenses: structuredClone(SEED_EXPENSES),
    coupons: structuredClone(SEED_COUPONS),
    reviews: structuredClone(SEED_REVIEWS),
    inventoryTransactions: [],
    auditLogs: [
      {
        id: 'aud-init',
        actor: 'System',
        role: 'admin',
        action: 'Initialize Seed Store',
        target: 'Database',
        details: 'Initialized GoPlay Phase 1/2/3 development dataset (32 sample listings)',
        timestamp: new Date().toISOString(),
      },
    ],
    settings: structuredClone(DEFAULT_SETTINGS),
    users: [
      {
        id: 'usr-admin',
        name: 'GoPlay Operations Admin',
        email: 'admin@goplay.com.bd',
        phone: '+8801700000000',
        role: 'admin',
        passwordHash: hashPassword(process.env.ADMIN_DEMO_PASSWORD || 'GoPlayAdmin2026!'),
        savedAddresses: [],
      },
      {
        id: 'usr-cust-1',
        name: 'Arifuzzaman Chowdhury',
        email: 'demo.athlete@example.com',
        phone: '+8801711223344',
        role: 'customer',
        passwordHash: hashPassword('GoPlayUser2026!'),
        savedAddresses: [
          {
            fullName: 'Arifuzzaman Chowdhury',
            phone: '+8801711223344',
            email: 'demo.athlete@example.com',
            division: 'Sylhet',
            district: 'Sylhet',
            upazila: 'Kumargaon',
            fullAddress: 'House 14, Varsity Gate Road, Kumargaon, Sylhet',
          },
        ],
      },
    ],
  };
}

function loadDb(): DatabaseState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw) as DatabaseState;
    }
  } catch (err) {
    console.error('Failed to read DB file, falling back to initial seed:', err);
  }
  const init = createInitialState();
  saveDb(init);
  return init;
}

function saveDb(state: DatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

const db: DatabaseState = loadDb();

// Ephemeral in-memory session tokens
const sessions = new Map<string, { userId: string; role: 'admin' | 'customer'; email: string; name: string }>();

// Simple rate limiter per IP + route
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxHits: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = rateBuckets.get(key);
    if (!entry || entry.resetAt < now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= maxHits) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    }
    entry.count += 1;
    return next();
  };
}

function sanitizePublicProduct(p: Product): Omit<Product, 'purchaseCost' | 'landedCost' | 'supplierId'> {
  const { purchaseCost: _pc, landedCost: _lc, supplierId: _sid, ...publicFields } = p;
  return publicFields;
}

function sanitizePublicOrder(o: Order): Omit<Order, 'internalNotes'> {
  const { internalNotes: _in, ...rest } = o;
  return {
    ...rest,
    items: rest.items.map(({ purchaseCostSnapshot: _pcs, ...item }) => item),
  };
}

function sanitizePublicRequest(r: ProductRequest): Omit<ProductRequest, 'internalAdminNotes'> {
  const { internalAdminNotes: _ian, ...rest } = r;
  return rest;
}

function getSession(req: Request) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  return sessions.get(token) ?? null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  (req as Request & { session?: typeof session }).session = session;
  return next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = getSession(req);
  if (!session || session.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  (req as Request & { session?: typeof session }).session = session;
  return next();
}

function appendAudit(actor: string, role: 'admin' | 'customer', action: string, target: string, details: string) {
  db.auditLogs.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actor,
    role,
    action,
    target,
    details,
    timestamp: new Date().toISOString(),
  });
  if (db.auditLogs.length > 250) {
    db.auditLogs = db.auditLogs.slice(0, 250);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // Public bootstrap data
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, brand: 'GoPlay' });
  });

  app.get('/api/catalog', (_req, res) => {
    res.json({
      categories: CATEGORIES,
      products: db.products.map(sanitizePublicProduct),
      settings: db.settings,
      reviews: db.reviews.filter((r) => r.approved),
    });
  });

  app.post('/api/coupons/validate', (req, res) => {
    const code = String(req.body?.code || '').trim().toUpperCase();
    const subtotal = Number(req.body?.subtotal || 0);
    const coupon = db.coupons.find((c) => c.code === code && c.active);
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or inactive coupon code' });
    }
    if (subtotal < coupon.minOrderAmount) {
      return res
        .status(400)
        .json({ error: `Minimum order of ৳${coupon.minOrderAmount.toLocaleString()} required for ${coupon.code}` });
    }
    return res.json({ coupon });
  });

  // Authentication (Customer & Admin)
  app.post('/api/auth/login', rateLimit(20, 60_000), (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, { userId: user.id, role: user.role, email: user.email, name: user.name });
    const { passwordHash: _ph, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  });

  app.post('/api/auth/register', rateLimit(10, 60_000), (req, res) => {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const password = String(req.body?.password || '');

    if (!name || !email || !validateBangladeshPhone(phone) || password.length < 6) {
      return res.status(400).json({
        error: 'Provide valid name, email, Bangladesh phone number (01XXXXXXXXX), and password (6+ chars).',
      });
    }
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const newUser: UserAccount & { passwordHash: string } = {
      id: `usr-${Date.now()}`,
      name,
      email,
      phone: normalizeBangladeshPhone(phone),
      role: 'customer',
      passwordHash: hashPassword(password),
      savedAddresses: [],
    };
    db.users.push(newUser);
    saveDb(db);

    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, { userId: newUser.id, role: 'customer', email: newUser.email, name: newUser.name });
    const { passwordHash: _ph, ...safeUser } = newUser;
    return res.status(201).json({ token, user: safeUser });
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    const session = (req as Request & { session?: { userId: string } }).session!;
    const user = db.users.find((u) => u.id === session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { passwordHash: _ph, ...safeUser } = user;

    const myOrders = db.orders
      .filter((o) => o.customerId === user.id || o.customerEmail?.toLowerCase() === user.email.toLowerCase())
      .map(sanitizePublicOrder);
    const myRequests = db.requests
      .filter((r) => r.customerId === user.id || r.email.toLowerCase() === user.email.toLowerCase())
      .map(sanitizePublicRequest);

    return res.json({ user: safeUser, orders: myOrders, requests: myRequests });
  });

  app.post('/api/auth/address', requireAuth, (req, res) => {
    const session = (req as Request & { session?: { userId: string } }).session!;
    const user = db.users.find((u) => u.id === session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const addr = req.body?.address;
    if (!addr?.fullName || !validateBangladeshPhone(addr?.phone || '') || !addr?.division || !addr?.fullAddress) {
      return res.status(400).json({ error: 'Valid Bangladesh address and phone number are required' });
    }
    user.savedAddresses.unshift({
      ...addr,
      phone: normalizeBangladeshPhone(addr.phone),
    });
    saveDb(db);
    const { passwordHash: _ph, ...safeUser } = user;
    return res.json({ user: safeUser });
  });

  // Customer Order Checkout
  app.post('/api/orders', rateLimit(15, 60_000), (req, res) => {
    const { shippingAddress, items, paymentMethod, paymentReference, couponCode } = req.body || {};
    if (
      !shippingAddress?.fullName ||
      !validateBangladeshPhone(shippingAddress?.phone || '') ||
      !shippingAddress?.division ||
      !shippingAddress?.district ||
      !shippingAddress?.upazila ||
      !shippingAddress?.fullAddress
    ) {
      return res.status(400).json({ error: 'Complete Bangladesh delivery address and valid 11-digit phone required.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart cannot be empty.' });
    }

    const session = getSession(req);
    const verifiedItems: Order['items'] = [];
    const cartItemsForCalc = [];

    for (const rawItem of items) {
      const product = db.products.find((p) => p.id === rawItem.productId);
      if (!product) {
        return res.status(400).json({ error: `Product not found: ${rawItem.productId}` });
      }
      if (product.availabilityStatus === 'Out of Stock' || product.availabilityStatus === 'Coming Soon') {
        return res.status(400).json({ error: `${product.name} is currently ${product.availabilityStatus}.` });
      }
      const qty = Math.max(1, Math.floor(Number(rawItem.quantity || 1)));
      if (product.availabilityStatus === 'In Stock' && product.stockQuantity < qty) {
        return res.status(400).json({
          error: `Only ${product.stockQuantity} unit(s) available in ready stock for ${product.name}.`,
        });
      }
      const unitPrice = product.discountPrice ?? product.sellingPrice;
      verifiedItems.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        quantity: qty,
        selectedSize: String(rawItem.selectedSize || product.sizes[0] || 'Standard'),
        selectedColor: String(rawItem.selectedColor || product.colors[0] || 'Default'),
        unitPrice,
        purchaseCostSnapshot: product.purchaseCost ?? Math.round(unitPrice * 0.72),
        availabilityStatus: product.availabilityStatus,
      });
      cartItemsForCalc.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        image: product.images[0] || '',
        unitPrice,
        quantity: qty,
        selectedSize: String(rawItem.selectedSize || 'Standard'),
        selectedColor: String(rawItem.selectedColor || 'Default'),
        availabilityStatus: product.availabilityStatus,
        deliveryEstimate: product.deliveryEstimate,
      });
    }

    const coupon = couponCode
      ? db.coupons.find((c) => c.code === String(couponCode).trim().toUpperCase() && c.active) ?? null
      : null;

    const totals = calculateCartTotals(
      cartItemsForCalc,
      shippingAddress.division,
      shippingAddress.district,
      coupon,
      {
        dhakaMetro: db.settings.dhakaMetroShipping,
        dhakaSuburb: db.settings.dhakaSuburbShipping,
        nationwide: db.settings.nationwideShipping,
        freeThreshold: db.settings.freeShippingThreshold,
      }
    );

    const method = paymentMethod === 'Manual Payment Verification' ? 'Manual Payment Verification' : 'Cash on Delivery';
    if (method === 'Manual Payment Verification' && !String(paymentReference || '').trim()) {
      return res.status(400).json({ error: 'Please provide your payment transaction reference for manual verification.' });
    }

    // Deduct stock for In Stock items & log inventory transaction
    const orderNumber = generateTrackingCode('ORD');
    const now = new Date().toISOString();
    for (const item of verifiedItems) {
      const prod = db.products.find((p) => p.id === item.productId);
      if (prod && prod.availabilityStatus === 'In Stock') {
        prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
        if (prod.stockQuantity === 0) {
          prod.availabilityStatus = 'Out of Stock';
        }
        prod.updatedAt = now;
        db.inventoryTransactions.unshift({
          id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: prod.id,
          sku: prod.sku,
          productName: prod.name,
          type: 'Sale',
          quantityChange: -item.quantity,
          resultingStock: prod.stockQuantity,
          reference: orderNumber,
          createdAt: now,
        });
      }
    }

    const isPreOrder = totals.orderType !== 'Ready Stock';
    const order: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerId: session?.userId,
      customerEmail: shippingAddress.email?.trim() || session?.email,
      shippingAddress: {
        ...shippingAddress,
        phone: normalizeBangladeshPhone(shippingAddress.phone),
      },
      items: verifiedItems,
      orderType: totals.orderType,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      couponCode: totals.couponApplied ? coupon?.code : undefined,
      deliveryCharge: totals.deliveryCharge,
      totalAmount: totals.totalAmount,
      paymentMethod: method,
      paymentReference: paymentReference ? String(paymentReference).trim() : undefined,
      paymentStatus: method === 'Cash on Delivery' ? 'COD Upon Delivery' : 'Pending Verification',
      status: isPreOrder ? 'Pre-order Pending' : 'Order Received',
      preOrderStatus: isPreOrder ? 'Awaiting Confirmation' : undefined,
      estimatedDeliveryPeriod: isPreOrder
        ? '10–14 business days (supplier-dependent estimate)'
        : shippingAddress.division === 'Dhaka'
        ? '2–3 business days'
        : '3–5 business days',
      statusHistory: [
        {
          status: isPreOrder ? 'Pre-order Pending' : 'Order Received',
          timestamp: now,
          note: `Order created via ${method}`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    db.orders.unshift(order);
    saveDb(db);
    return res.status(201).json({ order: sanitizePublicOrder(order) });
  });

  // Public Order Tracking (requires Order Number + last 4 digits of phone OR exact phone for privacy, or just orderNumber + optional phone check)
  app.get('/api/track/order/:orderNumber', (req, res) => {
    const orderNumber = String(req.params.orderNumber || '').trim().toUpperCase();
    const order = db.orders.find((o) => o.orderNumber.toUpperCase() === orderNumber);
    if (!order) {
      return res.status(404).json({ error: `No order found with ID ${orderNumber}` });
    }
    // Mask full street address when unauthenticated; show division/district & status timeline
    const pub = sanitizePublicOrder(order);
    return res.json({
      order: {
        ...pub,
        shippingAddress: {
          fullName: pub.shippingAddress.fullName,
          phone: `••••••${pub.shippingAddress.phone.slice(-4)}`,
          division: pub.shippingAddress.division,
          district: pub.shippingAddress.district,
          upazila: pub.shippingAddress.upazila,
          fullAddress: 'Protected for customer privacy',
        },
      },
    });
  });

  // Product Sourcing Requests (Public submit + private tracking)
  app.post('/api/requests', rateLimit(10, 60_000), (req, res) => {
    const body = req.body || {};
    if (!body.productName || !body.customerName || !validateBangladeshPhone(body.phone || '') || !body.email) {
      return res.status(400).json({
        error: 'Product name, your name, valid Bangladesh phone number, and email are required.',
      });
    }
    let uploadedImageDataUrl: string | undefined;
    if (body.uploadedImageDataUrl) {
      const dataUrl = String(body.uploadedImageDataUrl);
      if (!/^data:image\/(png|jpeg|jpg|webp);base64,/.test(dataUrl) || dataUrl.length > 2_800_000) {
        return res.status(400).json({ error: 'Uploaded image must be PNG, JPG, or WebP under 2MB.' });
      }
      uploadedImageDataUrl = dataUrl;
    }

    const session = getSession(req);
    const now = new Date().toISOString();
    const requestNumber = generateTrackingCode('REQ');
    const record: ProductRequest = {
      id: `req-${Date.now()}`,
      requestNumber,
      customerId: session?.userId,
      productName: String(body.productName).trim(),
      brand: String(body.brand || 'Not specified').trim(),
      model: String(body.model || 'Not specified').trim(),
      referenceUrl: body.referenceUrl ? String(body.referenceUrl).trim() : undefined,
      uploadedImageDataUrl,
      desiredSpecifications: String(body.desiredSpecifications || '').trim(),
      preferredSizeColor: String(body.preferredSizeColor || 'Any').trim(),
      budgetBdt: Math.max(0, Number(body.budgetBdt || 0)),
      customerName: String(body.customerName).trim(),
      phone: normalizeBangladeshPhone(body.phone),
      email: String(body.email).trim(),
      additionalNotes: body.additionalNotes ? String(body.additionalNotes).trim() : undefined,
      status: 'New Request',
      statusHistory: [{ status: 'New Request', timestamp: now, note: 'Submitted by customer' }],
      createdAt: now,
      updatedAt: now,
    };

    db.requests.unshift(record);
    saveDb(db);
    return res.status(201).json({ request: sanitizePublicRequest(record) });
  });

  // Track Product Request privately by Request ID + optional phone verification
  app.get('/api/track/request/:requestNumber', (req, res) => {
    const requestNumber = String(req.params.requestNumber || '').trim().toUpperCase();
    const phoneQuery = String(req.query.phone || '').trim();
    const found = db.requests.find((r) => r.requestNumber.toUpperCase() === requestNumber);
    if (!found) {
      return res.status(404).json({ error: `No product request found with ID ${requestNumber}` });
    }
    const session = getSession(req);
    const isOwner =
      (session && (session.role === 'admin' || session.userId === found.customerId || session.email === found.email)) ||
      (phoneQuery && normalizeBangladeshPhone(phoneQuery) === found.phone);

    const pub = sanitizePublicRequest(found);
    if (!isOwner) {
      // Protect private customer contact details unless verified by phone or session
      return res.json({
        request: {
          ...pub,
          customerName: pub.customerName.split(' ')[0] + ' •••',
          phone: `••••••${pub.phone.slice(-4)}`,
          email: 'Protected — enter your phone number to verify ownership',
          requiresVerification: true,
        },
      });
    }
    return res.json({ request: pub, requiresVerification: false });
  });

  // Customer approves quotation on their request
  app.post('/api/requests/:requestNumber/approve', (req, res) => {
    const requestNumber = String(req.params.requestNumber || '').trim().toUpperCase();
    const phone = String(req.body?.phone || '').trim();
    const found = db.requests.find((r) => r.requestNumber.toUpperCase() === requestNumber);
    if (!found) return res.status(404).json({ error: 'Request not found' });
    const session = getSession(req);
    const authorized =
      (session && (session.userId === found.customerId || session.email === found.email)) ||
      (phone && normalizeBangladeshPhone(phone) === found.phone);
    if (!authorized) {
      return res.status(403).json({ error: 'Verify your phone number to approve this quotation.' });
    }
    if (!found.quotation) {
      return res.status(400).json({ error: 'Quotation has not been prepared yet.' });
    }
    const now = new Date().toISOString();
    found.status = 'Customer Approved';
    found.updatedAt = now;
    found.statusHistory.push({
      status: 'Customer Approved',
      timestamp: now,
      note: 'Customer approved itemized BDT quotation',
    });
    saveDb(db);
    return res.json({ request: sanitizePublicRequest(found) });
  });

  // B2B / Institutional Enquiries
  app.post('/api/b2b', rateLimit(10, 60_000), (req, res) => {
    const b = req.body || {};
    if (!b.organizationName || !b.contactPerson || !validateBangladeshPhone(b.phone || '') || !b.requiredProducts) {
      return res.status(400).json({
        error: 'Organization name, contact person, valid Bangladesh phone, and product requirements are required.',
      });
    }
    const enquiry: B2BEnquiry = {
      id: `b2b-${Date.now()}`,
      enquiryNumber: generateTrackingCode('B2B'),
      organizationName: String(b.organizationName).trim(),
      organizationType: String(b.organizationType || 'Club / Academy').trim(),
      contactPerson: String(b.contactPerson).trim(),
      phone: normalizeBangladeshPhone(b.phone),
      email: String(b.email || '').trim(),
      requiredProducts: String(b.requiredProducts).trim(),
      estimatedQuantity: Math.max(1, Number(b.estimatedQuantity || 1)),
      budgetBdt: Math.max(0, Number(b.budgetBdt || 0)),
      deliveryLocation: String(b.deliveryLocation || '').trim(),
      additionalRequirements: b.additionalRequirements ? String(b.additionalRequirements).trim() : undefined,
      status: 'New',
      createdAt: new Date().toISOString(),
    };
    db.b2bEnquiries.unshift(enquiry);
    saveDb(db);
    return res.status(201).json({ enquiry });
  });

  // Reviews (genuine user-submitted only; no fake pre-seeded reviews)
  app.post('/api/reviews', rateLimit(10, 60_000), (req, res) => {
    const { productId, customerName, rating, comment } = req.body || {};
    const product = db.products.find((p) => p.id === productId);
    if (!product || !customerName?.trim() || !comment?.trim()) {
      return res.status(400).json({ error: 'Valid product, name, and review comment are required.' });
    }
    const review: Review = {
      id: `rev-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      customerName: String(customerName).trim(),
      rating: Math.min(5, Math.max(1, Math.round(Number(rating || 5)))),
      comment: String(comment).trim(),
      verifiedPurchase: false,
      approved: true,
      createdAt: new Date().toISOString(),
    };
    db.reviews.unshift(review);
    saveDb(db);
    return res.status(201).json({ review });
  });

  // ==========================================
  // ADMIN BUSINESS CONTROL CENTRE ENDPOINTS
  // ==========================================
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    return res.json({
      products: db.products,
      orders: db.orders,
      requests: db.requests,
      b2bEnquiries: db.b2bEnquiries,
      suppliers: db.suppliers,
      expenses: db.expenses,
      coupons: db.coupons,
      reviews: db.reviews,
      inventoryTransactions: db.inventoryTransactions,
      auditLogs: db.auditLogs,
      settings: db.settings,
      customers: db.users
        .filter((u) => u.role === 'customer')
        .map(({ passwordHash: _ph, ...u }) => u),
    });
  });

  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const session = (req as Request & { session?: { name: string } }).session!;
    const p = req.body;
    if (!p?.name || !p?.sku || !p?.category) {
      return res.status(400).json({ error: 'Product name, SKU, and category are required.' });
    }
    const categoryMeta = CATEGORIES.find((c) => c.slug === p.category);
    const now = new Date().toISOString();
    const purchaseCost = Number(p.purchaseCost || 0);
    const landedCost = calculateLandedCost(purchaseCost, Number(p.inboundCost || 0), 0, 0);
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sku: String(p.sku).trim().toUpperCase(),
      name: String(p.name).trim(),
      nameBn: String(p.nameBn || p.name).trim(),
      brand: String(p.brand || 'GoPlay Select').trim(),
      category: p.category,
      categoryLabel: categoryMeta?.name || 'Cricket',
      model: String(p.model || 'Standard').trim(),
      description: String(p.description || '').trim(),
      descriptionBn: String(p.descriptionBn || p.description || '').trim(),
      specifications: Array.isArray(p.specifications) ? p.specifications : [],
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [categoryMeta?.image || '/src/assets/images/cat_cricket_gear_1795583285401.jpg'],
      sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['Standard'],
      colors: Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : ['Black'],
      purchaseCost,
      landedCost,
      sellingPrice: Number(p.sellingPrice || 0),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : undefined,
      stockQuantity: Math.max(0, Number(p.stockQuantity || 0)),
      reorderPoint: Math.max(0, Number(p.reorderPoint || 3)),
      inventoryClass: p.inventoryClass || 'A',
      availabilityStatus: p.availabilityStatus || 'In Stock',
      deliveryEstimate: String(p.deliveryEstimate || '2–3 business days'),
      warrantyInfo: String(p.warrantyInfo || 'Pre-dispatch inspection'),
      returnEligibility: String(p.returnEligibility || '7-day unused return'),
      countryOfOrigin: String(p.countryOfOrigin || 'Bangladesh'),
      weightDimensions: String(p.weightDimensions || '0.5 kg'),
      featured: Boolean(p.featured),
      isNewArrival: Boolean(p.isNewArrival),
      isBestSeller: Boolean(p.isBestSeller),
      supplierId: p.supplierId || undefined,
      updatedAt: now,
    };
    db.products.unshift(newProduct);
    appendAudit(session.name, 'admin', 'Create Product', newProduct.sku, `Added ${newProduct.name}`);
    saveDb(db);
    return res.status(201).json({ product: newProduct });
  });

  app.patch('/api/admin/products/:id', requireAdmin, (req, res) => {
    const session = (req as Request & { session?: { name: string } }).session!;
    const idx = db.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    const prev = db.products[idx];
    const updates = req.body || {};
    const nextStock =
      updates.stockQuantity !== undefined ? Math.max(0, Number(updates.stockQuantity)) : prev.stockQuantity;
    const updated: Product = {
      ...prev,
      ...updates,
      stockQuantity: nextStock,
      updatedAt: new Date().toISOString(),
    };
    db.products[idx] = updated;
    if (nextStock !== prev.stockQuantity) {
      db.inventoryTransactions.unshift({
        id: `inv-${Date.now()}`,
        productId: updated.id,
        sku: updated.sku,
        productName: updated.name,
        type: nextStock > prev.stockQuantity ? 'Restock' : 'Adjustment',
        quantityChange: nextStock - prev.stockQuantity,
        resultingStock: nextStock,
        reference: 'Admin Stock Update',
        createdAt: new Date().toISOString(),
      });
    }
    appendAudit(session.name, 'admin', 'Update Product', updated.sku, `Updated stock/price/status`);
    saveDb(db);
    return res.json({ product: updated });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const session = (req as Request & { session?: { name: string } }).session!;
    const idx = db.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    const [removed] = db.products.splice(idx, 1);
    appendAudit(session.name, 'admin', 'Delete Product', removed.sku, `Removed ${removed.name}`);
    saveDb(db);
    return res.json({ ok: true });
  });

  app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
    const session = (req as Request & { session?: { name: string } }).session!;
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const {
      status,
      preOrderStatus,
      paymentStatus,
      courierName,
      trackingNumber,
      dispatchDate,
      internalNotes,
      refundAmount,
      refundReason,
      estimatedDeliveryPeriod,
    } = req.body || {};

    const now = new Date().toISOString();
    if (status && status !== order.status) {
      order.status = status;
      order.statusHistory.push({
        status,
        timestamp: now,
        note: courierName ? `Courier: ${courierName}` : undefined,
        updatedBy: session.name,
      });
    }
    if (preOrderStatus !== undefined) order.preOrderStatus = preOrderStatus;
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
    if (courierName !== undefined) order.courierName = courierName;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (dispatchDate !== undefined) order.dispatchDate = dispatchDate;
    if (internalNotes !== undefined) order.internalNotes = internalNotes;
    if (estimatedDeliveryPeriod !== undefined) order.estimatedDeliveryPeriod = estimatedDeliveryPeriod;
    if (refundAmount !== undefined) order.refundAmount = Number(refundAmount);
    if (refundReason !== undefined) order.refundReason = refundReason;
    order.updatedAt = now;

    appendAudit(session.name, 'admin', 'Update Order', order.orderNumber, `Status: ${order.status}`);
    saveDb(db);
    return res.json({ order });
  });

  app.patch('/api/admin/requests/:id', requireAdmin, (req, res) => {
    const session = (req as Request & { session?: { name: string } }).session!;
    const request = db.requests.find((r) => r.id === req.params.id);
    if (!request) return res.status(404).json({ error: 'Product request not found' });

    const { status, quotation, internalAdminNotes } = req.body || {};
    const now = new Date().toISOString();
    if (status && status !== request.status) {
      request.status = status;
      request.statusHistory.push({
        status,
        timestamp: now,
        updatedBy: session.name,
      });
    }
    if (quotation) {
      const itemCost = Number(quotation.itemCost || 0);
      const shippingCost = Number(quotation.shippingCost || 0);
      const taxesAndDuties = Number(quotation.taxesAndDuties || 0);
      const serviceFee = Number(quotation.serviceFee || 0);
      request.quotation = {
        itemCost,
        shippingCost,
        taxesAndDuties,
        serviceFee,
        totalQuotedPrice: itemCost + shippingCost + taxesAndDuties + serviceFee,
        validUntil: String(quotation.validUntil || ''),
        estimatedDelivery: String(quotation.estimatedDelivery || ''),
        notes: quotation.notes ? String(quotation.notes) : undefined,
      };
    }
    if (internalAdminNotes !== undefined) {
      request.internalAdminNotes = internalAdminNotes;
    }
    request.updatedAt = now;

    appendAudit(session.name, 'admin', 'Update Request', request.requestNumber, `Status: ${request.status}`);
    saveDb(db);
    return res.json({ request });
  });

  app.patch('/api/admin/b2b/:id', requireAdmin, (req, res) => {
    const session = (req as Request & { session?: { name: string } }).session!;
    const enq = db.b2bEnquiries.find((b) => b.id === req.params.id);
    if (!enq) return res.status(404).json({ error: 'Enquiry not found' });
    Object.assign(enq, req.body);
    appendAudit(session.name, 'admin', 'Update B2B Enquiry', enq.enquiryNumber, `Status: ${enq.status}`);
    saveDb(db);
    return res.json({ enquiry: enq });
  });

  app.post('/api/admin/suppliers', requireAdmin, (req, res) => {
    const session = (req as Request & { session?: { name: string } }).session!;
    const s = req.body || {};
    if (!s.name || !s.contactPerson) {
      return res.status(400).json({ error: 'Supplier name and contact person are required.' });
    }
    const scorecard = s.scorecard || {
      authenticityDocs: 4,
      priceMargin: 4,
      productQuality: 4,
      availabilityConsistency: 4,
      deliveryReliability: 4,
      returnWarranty: 4,
    };
    const { score, status } = calculateSupplierWeightedScore(scorecard);
    const supplier: Supplier = {
      id: `sup-${Date.now()}`,
      name: String(s.name).trim(),
      contactPerson: String(s.contactPerson).trim(),
      phone: String(s.phone || '').trim(),
      email: String(s.email || '').trim(),
      location: String(s.location || '').trim(),
      categoriesSupplied: Array.isArray(s.categoriesSupplied) ? s.categoriesSupplied : ['cricket'],
      wholesaleNotes: String(s.wholesaleNotes || '').trim(),
      moq: String(s.moq || '').trim(),
      authenticityDocuments: String(s.authenticityDocuments || '').trim(),
      deliveryTerms: String(s.deliveryTerms || '').trim(),
      returnWarrantyTerms: String(s.returnWarrantyTerms || '').trim(),
      scorecard,
      weightedScore: score,
      status,
      createdAt: new Date().toISOString(),
    };
    db.suppliers.unshift(supplier);
    appendAudit(session.name, 'admin', 'Add Supplier', supplier.name, `Score: ${score} (${status})`);
    saveDb(db);
    return res.status(201).json({ supplier });
  });

  app.post('/api/admin/expenses', requireAdmin, (req, res) => {
    const session = (req as Request & { session?: { name: string } }).session!;
    const e = req.body || {};
    if (!e.category || !e.description || !e.amount) {
      return res.status(400).json({ error: 'Category, description, and amount are required.' });
    }
    const expense: Expense = {
      id: `exp-${Date.now()}`,
      date: String(e.date || new Date().toISOString().slice(0, 10)),
      category: e.category,
      description: String(e.description).trim(),
      amount: Math.max(0, Number(e.amount)),
      orderReference: e.orderReference ? String(e.orderReference).trim() : undefined,
      recordedBy: session.name,
      createdAt: new Date().toISOString(),
    };
    db.expenses.unshift(expense);
    appendAudit(session.name, 'admin', 'Record Expense', expense.category, `৳${expense.amount}`);
    saveDb(db);
    return res.status(201).json({ expense });
  });

  app.post('/api/admin/coupons', requireAdmin, (req, res) => {
    const session = (req as Request & { session?: { name: string } }).session!;
    const c = req.body || {};
    if (!c.code || !c.value) return res.status(400).json({ error: 'Code and value required.' });
    const coupon: Coupon = {
      id: `cpn-${Date.now()}`,
      code: String(c.code).trim().toUpperCase(),
      discountType: c.discountType === 'percent' ? 'percent' : 'fixed',
      value: Number(c.value),
      minOrderAmount: Number(c.minOrderAmount || 0),
      active: true,
      description: String(c.description || '').trim(),
    };
    db.coupons.unshift(coupon);
    appendAudit(session.name, 'admin', 'Create Coupon', coupon.code, coupon.description);
    saveDb(db);
    return res.status(201).json({ coupon });
  });

  app.patch('/api/admin/settings', requireAdmin, (req, res) => {
    const session = (req as Request & { session?: { name: string } }).session!;
    db.settings = { ...db.settings, ...(req.body || {}) };
    appendAudit(session.name, 'admin', 'Update Settings', 'StoreSettings', 'Updated shipping/store policies');
    saveDb(db);
    return res.json({ settings: db.settings });
  });

  // Vite dev middleware or static dist serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`GoPlay server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start GoPlay server:', err);
  process.exit(1);
});
