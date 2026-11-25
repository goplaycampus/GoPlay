import type {
  AuditLog,
  B2BEnquiry,
  CategoryInfo,
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
} from '../types';

const TOKEN_KEY = 'goplay_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  getCatalog: () =>
    apiFetch<{
      categories: CategoryInfo[];
      products: Product[];
      settings: StoreSettings;
      reviews: Review[];
    }>('/api/catalog'),

  validateCoupon: (code: string, subtotal: number) =>
    apiFetch<{ coupon: Coupon }>('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    }),

  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: UserAccount }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: { name: string; email: string; phone: string; password: string }) =>
    apiFetch<{ token: string; user: UserAccount }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () =>
    apiFetch<{ user: UserAccount; orders: Order[]; requests: ProductRequest[] }>('/api/auth/me'),

  addAddress: (address: UserAccount['savedAddresses'][number]) =>
    apiFetch<{ user: UserAccount }>('/api/auth/address', {
      method: 'POST',
      body: JSON.stringify({ address }),
    }),

  createOrder: (payload: {
    shippingAddress: Order['shippingAddress'];
    items: {
      productId: string;
      quantity: number;
      selectedSize: string;
      selectedColor: string;
    }[];
    paymentMethod: Order['paymentMethod'];
    paymentReference?: string;
    couponCode?: string;
  }) =>
    apiFetch<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  trackOrder: (orderNumber: string) =>
    apiFetch<{ order: Order }>(`/api/track/order/${encodeURIComponent(orderNumber)}`),

  createProductRequest: (payload: {
    productName: string;
    brand: string;
    model: string;
    referenceUrl?: string;
    uploadedImageDataUrl?: string;
    desiredSpecifications: string;
    preferredSizeColor: string;
    budgetBdt: number;
    customerName: string;
    phone: string;
    email: string;
    additionalNotes?: string;
  }) =>
    apiFetch<{ request: ProductRequest }>('/api/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  trackProductRequest: (requestNumber: string, phone?: string) =>
    apiFetch<{ request: ProductRequest & { requiresVerification?: boolean } }>(
      `/api/track/request/${encodeURIComponent(requestNumber)}${
        phone ? `?phone=${encodeURIComponent(phone)}` : ''
      }`
    ),

  approveRequestQuotation: (requestNumber: string, phone: string) =>
    apiFetch<{ request: ProductRequest }>(`/api/requests/${encodeURIComponent(requestNumber)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  createB2BEnquiry: (payload: {
    organizationName: string;
    organizationType: string;
    contactPerson: string;
    phone: string;
    email: string;
    requiredProducts: string;
    estimatedQuantity: number;
    budgetBdt: number;
    deliveryLocation: string;
    additionalRequirements?: string;
  }) =>
    apiFetch<{ enquiry: B2BEnquiry }>('/api/b2b', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitReview: (payload: {
    productId: string;
    customerName: string;
    rating: number;
    comment: string;
  }) =>
    apiFetch<{ review: Review }>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin endpoints
  adminOverview: () =>
    apiFetch<{
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
      customers: UserAccount[];
    }>('/api/admin/overview'),

  adminCreateProduct: (product: Partial<Product> & { inboundCost?: number }) =>
    apiFetch<{ product: Product }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),

  adminUpdateProduct: (id: string, updates: Partial<Product>) =>
    apiFetch<{ product: Product }>(`/api/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  adminDeleteProduct: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/products/${id}`, {
      method: 'DELETE',
    }),

  adminUpdateOrder: (id: string, updates: Partial<Order>) =>
    apiFetch<{ order: Order }>(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  adminUpdateRequest: (id: string, updates: Partial<ProductRequest>) =>
    apiFetch<{ request: ProductRequest }>(`/api/admin/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  adminUpdateB2B: (id: string, updates: Partial<B2BEnquiry>) =>
    apiFetch<{ enquiry: B2BEnquiry }>(`/api/admin/b2b/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  adminCreateSupplier: (supplier: Partial<Supplier>) =>
    apiFetch<{ supplier: Supplier }>('/api/admin/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    }),

  adminCreateExpense: (expense: Partial<Expense>) =>
    apiFetch<{ expense: Expense }>('/api/admin/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    }),

  adminCreateCoupon: (coupon: Partial<Coupon>) =>
    apiFetch<{ coupon: Coupon }>('/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(coupon),
    }),

  adminUpdateSettings: (settings: Partial<StoreSettings>) =>
    apiFetch<{ settings: StoreSettings }>('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
};
