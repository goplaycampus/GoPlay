import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Box,
  Building2,
  ClipboardList,
  FileText,
  Layers,
  PackageCheck,
  Plus,
  Receipt,
  RefreshCw,
  Settings,
  Shield,
  ShoppingCart,
  Tag,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import { SalesReportsTab } from './SalesReportsTab';
import { BLUEPRINT_LAUNCH_BUDGET, CATEGORIES } from '../data/catalog';
import { api } from '../services/api';
import type {
  AuditLog,
  B2BEnquiry,
  Coupon,
  Expense,
  ExpenseCategory,
  InventoryTransaction,
  Order,
  PreOrderWorkflowStatus,
  Product,
  ProductRequest,
  ProductRequestStatus,
  Review,
  SportCategorySlug,
  StandardOrderStatus,
  StoreSettings,
  Supplier,
  UserAccount,
} from '../types';
import {
  calculateFinancialSummary,
  calculateGrossMarginPct,
  calculateLandedCost,
  formatBDT,
} from '../utils/commerce';
import type { AppPage } from './Header';

type AdminTab =
  | 'overview'
  | 'products'
  | 'inventory'
  | 'orders'
  | 'requests'
  | 'b2b'
  | 'suppliers'
  | 'sales-reports'
  | 'expenses'
  | 'coupons'
  | 'customers'
  | 'settings'
  | 'audit';

interface AdminDashboardProps {
  user: UserAccount | null;
  onNavigate: (page: AppPage) => void;
  onCatalogRefresh: () => void;
}

const ORDER_STATUSES: StandardOrderStatus[] = [
  'Order Received',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Delivered',
  'Completed',
  'Pre-order Pending',
  'Supplier Processing',
  'Delayed',
  'Cancelled',
  'Refunded',
  'Returned',
];

const PREORDER_STATUSES: PreOrderWorkflowStatus[] = [
  'Awaiting Confirmation',
  'Awaiting Payment',
  'Order Confirmed',
  'Supplier Processing',
  'Sourcing Completed',
  'In Transit',
  'Received',
  'Quality Checked',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Refund Processing',
  'Refunded',
];

const REQUEST_STATUSES: ProductRequestStatus[] = [
  'New Request',
  'Reviewing',
  'Researching Suppliers',
  'Supplier Found',
  'Quotation Prepared',
  'Quotation Sent',
  'Customer Approved',
  'Processing',
  'Completed',
  'Rejected',
];

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Product Purchasing',
  'Packaging',
  'Delivery',
  'Advertising',
  'Website Expenses',
  'Operational Costs',
  'Refunds',
  'Other',
];

export function AdminDashboard({ user, onNavigate, onCatalogRefresh }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [b2bEnquiries, setB2bEnquiries] = useState<B2BEnquiry[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [customers, setCustomers] = useState<UserAccount[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Add Product Form State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newSku, setNewSku] = useState('GPL-CRI-NEW-001');
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('GoPlay Select');
  const [newCategory, setNewCategory] = useState<SportCategorySlug>('cricket');
  const [newCost, setNewCost] = useState('1200');
  const [newInbound, setNewInbound] = useState('80');
  const [newPrice, setNewPrice] = useState('1750');
  const [newStock, setNewStock] = useState('10');
  const [newStatus, setNewStatus] = useState<'In Stock' | 'Pre-order'>('In Stock');

  // Request Quotation Editor State
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [reqStatus, setReqStatus] = useState<ProductRequestStatus>('Quotation Prepared');
  const [qItemCost, setQItemCost] = useState('0');
  const [qShipping, setQShipping] = useState('0');
  const [qTax, setQTax] = useState('0');
  const [qFee, setQFee] = useState('0');
  const [qValidUntil, setQValidUntil] = useState('2026-12-10');
  const [qEstDelivery, setQEstDelivery] = useState('10–14 business days');
  const [reqAdminNotes, setReqAdminNotes] = useState('');

  // Order Editor State
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [ordStatus, setOrdStatus] = useState<StandardOrderStatus>('Confirmed');
  const [ordPreStatus, setOrdPreStatus] = useState<PreOrderWorkflowStatus>('Order Confirmed');
  const [ordPaymentStatus, setOrdPaymentStatus] = useState<Order['paymentStatus']>('Verified');
  const [ordCourier, setOrdCourier] = useState('');
  const [ordTracking, setOrdTracking] = useState('');
  const [ordInternalNotes, setOrdInternalNotes] = useState('');
  const [ordRefundAmount, setOrdRefundAmount] = useState('0');

  // Expense Form State
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Packaging');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');

  // Supplier Form State
  const [supName, setSupName] = useState('');
  const [supPerson, setSupPerson] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supLocation, setSupLocation] = useState('');
  const [supAuthScore, setSupAuthScore] = useState(4);
  const [supMarginScore, setSupMarginScore] = useState(4);
  const [supQualityScore, setSupQualityScore] = useState(4);

  // Coupon Form State
  const [cpnCode, setCpnCode] = useState('');
  const [cpnValue, setCpnValue] = useState('150');
  const [cpnMin, setCpnMin] = useState('2000');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.adminOverview();
      setProducts(data.products);
      setOrders(data.orders);
      setRequests(data.requests);
      setB2bEnquiries(data.b2bEnquiries);
      setSuppliers(data.suppliers);
      setExpenses(data.expenses);
      setCoupons(data.coupons);
      setReviews(data.reviews);
      setInventoryTransactions(data.inventoryTransactions);
      setAuditLogs(data.auditLogs);
      setCustomers(data.customers);
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin authentication required.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadOverview();
    } else {
      setLoading(false);
    }
  }, [user, loadOverview]);

  const summary = useMemo(
    () => calculateFinancialSummary(orders, expenses, products),
    [orders, expenses, products]
  );

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <Shield className="w-10 h-10 text-[#111111] mx-auto" />
        <h1 className="font-display text-2xl font-extrabold text-[#111111]">
          Administrator Authorization Required
        </h1>
        <p className="text-sm text-[#525252]">
          Supplier pricing, purchase costs, customer orders, and financial controls are restricted to verified administrators.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('account')}
          className="px-6 py-3 rounded-md bg-[#111111] text-white text-sm font-semibold"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminCreateProduct({
        sku: newSku,
        name: newName,
        brand: newBrand,
        category: newCategory,
        purchaseCost: Number(newCost),
        inboundCost: Number(newInbound),
        sellingPrice: Number(newPrice),
        stockQuantity: newStatus === 'Pre-order' ? 0 : Number(newStock),
        availabilityStatus: newStatus,
      });
      setShowAddProduct(false);
      setNewName('');
      setStatusBanner(`Created product ${newSku}`);
      await loadOverview();
      onCatalogRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    }
  };

  const handleQuickStockChange = async (product: Product, delta: number) => {
    const nextQty = Math.max(0, product.stockQuantity + delta);
    await api.adminUpdateProduct(product.id, {
      stockQuantity: nextQty,
      availabilityStatus:
        product.availabilityStatus === 'Pre-order'
          ? 'Pre-order'
          : nextQty > 0
          ? 'In Stock'
          : 'Out of Stock',
    });
    setStatusBanner(`Updated stock for ${product.sku} to ${nextQty}`);
    await loadOverview();
    onCatalogRefresh();
  };

  const openOrderEditor = (o: Order) => {
    setEditingOrderId(o.id);
    setOrdStatus(o.status);
    setOrdPreStatus(o.preOrderStatus || 'Order Confirmed');
    setOrdPaymentStatus(o.paymentStatus);
    setOrdCourier(o.courierName || '');
    setOrdTracking(o.trackingNumber || '');
    setOrdInternalNotes(o.internalNotes || '');
    setOrdRefundAmount(String(o.refundAmount || 0));
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrderId) return;
    await api.adminUpdateOrder(editingOrderId, {
      status: ordStatus,
      preOrderStatus: ordPreStatus,
      paymentStatus: ordPaymentStatus,
      courierName: ordCourier,
      trackingNumber: ordTracking,
      internalNotes: ordInternalNotes,
      refundAmount: Number(ordRefundAmount || 0),
    });
    setEditingOrderId(null);
    setStatusBanner('Order updated and logged to audit trail.');
    await loadOverview();
  };

  const openRequestEditor = (r: ProductRequest) => {
    setEditingRequestId(r.id);
    setReqStatus(r.status);
    setQItemCost(String(r.quotation?.itemCost ?? Math.round(r.budgetBdt * 0.78)));
    setQShipping(String(r.quotation?.shippingCost ?? 1200));
    setQTax(String(r.quotation?.taxesAndDuties ?? 800));
    setQFee(String(r.quotation?.serviceFee ?? 750));
    setQValidUntil(r.quotation?.validUntil || '2026-12-10');
    setQEstDelivery(r.quotation?.estimatedDelivery || '10–14 business days');
    setReqAdminNotes(r.internalAdminNotes || '');
  };

  const handleSaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequestId) return;
    const itemCost = Number(qItemCost || 0);
    const shippingCost = Number(qShipping || 0);
    const taxesAndDuties = Number(qTax || 0);
    const serviceFee = Number(qFee || 0);
    await api.adminUpdateRequest(editingRequestId, {
      status: reqStatus,
      internalAdminNotes: reqAdminNotes,
      quotation: {
        itemCost,
        shippingCost,
        taxesAndDuties,
        serviceFee,
        totalQuotedPrice: itemCost + shippingCost + taxesAndDuties + serviceFee,
        validUntil: qValidUntil,
        estimatedDelivery: qEstDelivery,
      },
    });
    setEditingRequestId(null);
    setStatusBanner('Product request & quotation updated.');
    await loadOverview();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.adminCreateExpense({
      category: expCategory,
      description: expDesc,
      amount: Number(expAmount),
    });
    setExpDesc('');
    setExpAmount('');
    setStatusBanner('Expense logged.');
    await loadOverview();
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.adminCreateSupplier({
      name: supName,
      contactPerson: supPerson,
      phone: supPhone,
      location: supLocation,
      scorecard: {
        authenticityDocs: supAuthScore,
        priceMargin: supMarginScore,
        productQuality: supQualityScore,
        availabilityConsistency: 4,
        deliveryReliability: 4,
        returnWarranty: 4,
      },
    });
    setSupName('');
    setSupPerson('');
    setSupPhone('');
    setSupLocation('');
    setStatusBanner('Supplier added with weighted scorecard.');
    await loadOverview();
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.adminCreateCoupon({
      code: cpnCode,
      discountType: 'fixed',
      value: Number(cpnValue),
      minOrderAmount: Number(cpnMin),
      description: `৳${cpnValue} off orders ৳${cpnMin}+`,
    });
    setCpnCode('');
    setStatusBanner('Coupon created.');
    await loadOverview();
  };

  const sidebarItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview & KPIs', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'sales-reports', label: 'Sales Reports', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'products', label: 'Products', icon: <Box className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory & Logs', icon: <Layers className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders & Pre-orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'requests', label: 'Product Requests', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'b2b', label: 'B2B Enquiries', icon: <Building2 className="w-4 h-4" /> },
    { id: 'suppliers', label: 'Suppliers & Scores', icon: <Truck className="w-4 h-4" /> },
    { id: 'expenses', label: 'Expenses & Budget', icon: <Receipt className="w-4 h-4" /> },
    { id: 'coupons', label: 'Coupons', icon: <Tag className="w-4 h-4" /> },
    { id: 'customers', label: 'Customers & Reviews', icon: <Users className="w-4 h-4" /> },
    { id: 'settings', label: 'Store Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Logs', icon: <Activity className="w-4 h-4" /> },
  ];

  const previewLanded = calculateLandedCost(Number(newCost || 0), Number(newInbound || 0));
  const previewMargin = calculateGrossMarginPct(Number(newPrice || 0), previewLanded);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 print:p-0 print:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E5E5E5] print:hidden">
        <div>
          <p className="text-xs font-semibold text-[#525252]">
            GoPlay Operations · Business Control Centre
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#111111]">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadOverview}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-[#D4D4D4] text-xs font-semibold text-[#111111] hover:bg-[#F4F4F4]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="px-4 py-2 rounded-md bg-[#111111] text-white text-xs font-semibold"
          >
            View Storefront
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="mt-4 p-3 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] text-xs font-semibold text-[#166534] flex justify-between print:hidden">
          <span>{statusBanner}</span>
          <button type="button" onClick={() => setStatusBanner(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-4 p-3 rounded-md bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] print:hidden">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:mt-0 print:block">
        {/* Sidebar */}
        <aside className="lg:col-span-3 border border-[#E5E5E5] rounded-lg p-2 bg-[#FAFAFA] space-y-1 print:hidden">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-semibold text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-[#111111] text-white'
                  : 'text-[#292929] hover:bg-[#E5E5E5]'
              }`}
            >
              <span className={activeTab === item.id ? 'text-[#B7F500]' : 'text-[#525252]'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Main Viewport */}
        <div className="lg:col-span-9 space-y-6 print:w-full">
          {loading ? (
            <div className="p-12 border border-[#E5E5E5] rounded-lg text-center text-sm text-[#525252]">
              Loading live stored records...
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 border border-[#E5E5E5] rounded-lg bg-white">
                      <p className="text-xs text-[#525252]">Total Orders</p>
                      <p className="font-mono-num text-2xl font-bold text-[#111111] mt-1">
                        {summary.totalOrders}
                      </p>
                      <p className="text-[11px] text-[#525252] mt-1">
                        {summary.pendingOrders} pending · {summary.completedOrders} completed
                      </p>
                    </div>
                    <div className="p-4 border border-[#E5E5E5] rounded-lg bg-white">
                      <p className="text-xs text-[#525252]">Earned Revenue</p>
                      <p className="font-mono-num text-2xl font-bold text-[#111111] mt-1">
                        {formatBDT(summary.earnedRevenue)}
                      </p>
                      <p className="text-[11px] text-[#525252] mt-1">
                        Pre-order held: {formatBDT(summary.heldPreOrderAdvances)}
                      </p>
                    </div>
                    <div className="p-4 border border-[#E5E5E5] rounded-lg bg-white">
                      <p className="text-xs text-[#525252]">Inventory Cost Value</p>
                      <p className="font-mono-num text-2xl font-bold text-[#111111] mt-1">
                        {formatBDT(summary.inventoryCostValue)}
                      </p>
                      <p className="text-[11px] text-[#92400E] mt-1">
                        {summary.lowStockCount} low-stock SKU(s)
                      </p>
                    </div>
                    <div className="p-4 border border-[#E5E5E5] rounded-lg bg-white">
                      <p className="text-xs text-[#525252]">Active Requests / Pre-orders</p>
                      <p className="font-mono-num text-2xl font-bold text-[#111111] mt-1">
                        {requests.length} / {summary.pendingPreOrdersCount}
                      </p>
                      <p className="text-[11px] text-[#525252] mt-1">
                        Cancelled: {summary.cancelledOrders} · Refunds: {formatBDT(summary.refundsRecorded)}
                      </p>
                    </div>
                  </div>

                  <div className="border border-[#E5E5E5] rounded-lg p-5 bg-white space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-display text-base font-bold text-[#111111]">
                        Recent Stored Orders
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActiveTab('sales-reports')}
                        className="text-xs font-semibold text-[#111111] hover:underline decoration-[#B7F500] decoration-2 underline-offset-4"
                      >
                        View Full Sales Reports →
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="border-b border-[#E5E5E5] text-[#525252]">
                          <tr>
                            <th className="py-2 pr-3">Order ID</th>
                            <th className="py-2 pr-3">Customer</th>
                            <th className="py-2 pr-3">Type</th>
                            <th className="py-2 pr-3">Status</th>
                            <th className="py-2 text-right">Total (BDT)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F4F4F4]">
                          {orders.slice(0, 6).map((o) => (
                            <tr key={o.id}>
                              <td className="py-2.5 pr-3 font-mono-num font-bold">{o.orderNumber}</td>
                              <td className="py-2.5 pr-3">{o.shippingAddress.fullName}</td>
                              <td className="py-2.5 pr-3">{o.orderType}</td>
                              <td className="py-2.5 pr-3">{o.status}</td>
                              <td className="py-2.5 text-right font-mono-num font-semibold">
                                {formatBDT(o.totalAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* PRODUCTS */}
              {activeTab === 'products' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold text-[#111111]">
                      Product Catalogue ({products.length})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowAddProduct((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#B7F500] text-[#111111] text-xs font-bold"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </button>
                  </div>

                  {showAddProduct && (
                    <form
                      onSubmit={handleCreateProduct}
                      className="border border-[#E5E5E5] rounded-lg p-5 bg-[#FAFAFA] space-y-4"
                    >
                      <h3 className="font-display text-sm font-bold text-[#111111]">
                        New Product + Landed Cost Calculator
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          required
                          value={newSku}
                          onChange={(e) => setNewSku(e.target.value)}
                          placeholder="SKU (GPL-CAT-XXX)"
                          className="border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs font-mono-num"
                        />
                        <input
                          required
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="Product Name"
                          className="sm:col-span-2 border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs"
                        />
                        <input
                          value={newBrand}
                          onChange={(e) => setNewBrand(e.target.value)}
                          placeholder="Brand"
                          className="border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs"
                        />
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value as SportCategorySlug)}
                          className="border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.slug} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as 'In Stock' | 'Pre-order')}
                          className="border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs"
                        >
                          <option value="In Stock">In Stock</option>
                          <option value="Pre-order">Pre-order</option>
                        </select>
                        <input
                          type="number"
                          value={newCost}
                          onChange={(e) => setNewCost(e.target.value)}
                          placeholder="Purchase Cost (BDT)"
                          className="border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs font-mono-num"
                        />
                        <input
                          type="number"
                          value={newInbound}
                          onChange={(e) => setNewInbound(e.target.value)}
                          placeholder="Inbound/Pkg Cost"
                          className="border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs font-mono-num"
                        />
                        <input
                          type="number"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          placeholder="Selling Price (BDT)"
                          className="border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs font-mono-num"
                        />
                        <input
                          type="number"
                          value={newStock}
                          onChange={(e) => setNewStock(e.target.value)}
                          placeholder="Stock Qty"
                          className="border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs font-mono-num"
                        />
                        <div className="sm:col-span-2 flex items-center text-xs text-[#292929] font-mono-num">
                          Landed Cost: {formatBDT(previewLanded)} · Gross Margin: {previewMargin}%
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded bg-[#111111] text-white text-xs font-semibold"
                      >
                        Save Product
                      </button>
                    </form>
                  )}

                  <div className="border border-[#E5E5E5] rounded-lg bg-white overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5] text-[#525252]">
                        <tr>
                          <th className="p-3">SKU</th>
                          <th className="p-3">Product</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Cost</th>
                          <th className="p-3 text-right">Price</th>
                          <th className="p-3 text-right">Stock</th>
                          <th className="p-3 text-right">Adjust</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F4F4F4]">
                        {products.map((p) => (
                          <tr key={p.id}>
                            <td className="p-3 font-mono-num whitespace-nowrap">{p.sku}</td>
                            <td className="p-3 font-medium text-[#111111]">{p.name}</td>
                            <td className="p-3 whitespace-nowrap">{p.availabilityStatus}</td>
                            <td className="p-3 text-right font-mono-num">
                              {formatBDT(p.purchaseCost ?? 0)}
                            </td>
                            <td className="p-3 text-right font-mono-num font-semibold">
                              {formatBDT(p.discountPrice ?? p.sellingPrice)}
                            </td>
                            <td className="p-3 text-right font-mono-num">{p.stockQuantity}</td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleQuickStockChange(p, -1)}
                                className="px-2 py-0.5 border border-[#D4D4D4] rounded mr-1"
                              >
                                −
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickStockChange(p, 1)}
                                className="px-2 py-0.5 border border-[#D4D4D4] rounded"
                              >
                                +
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* INVENTORY TRANSACTIONS */}
              {activeTab === 'inventory' && (
                <div className="border border-[#E5E5E5] rounded-lg p-5 bg-white space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#111111] flex items-center gap-2">
                    <PackageCheck className="w-5 h-5" /> Inventory Movement Ledger ({inventoryTransactions.length})
                  </h2>
                  {inventoryTransactions.length === 0 ? (
                    <p className="text-xs text-[#525252]">
                      Stock movements from orders and admin stock adjustments will appear here automatically.
                    </p>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="border-b border-[#E5E5E5] text-[#525252]">
                        <tr>
                          <th className="py-2">SKU</th>
                          <th className="py-2">Type</th>
                          <th className="py-2 text-right">Change</th>
                          <th className="py-2 text-right">Resulting Stock</th>
                          <th className="py-2">Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F4F4F4]">
                        {inventoryTransactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className="py-2 font-mono-num">{tx.sku}</td>
                            <td className="py-2">{tx.type}</td>
                            <td className="py-2 text-right font-mono-num">
                              {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                            </td>
                            <td className="py-2 text-right font-mono-num">{tx.resultingStock}</td>
                            <td className="py-2">{tx.reference}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ORDERS & PRE-ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-5">
                  <h2 className="font-display text-lg font-bold text-[#111111]">
                    Orders &amp; Pre-Orders ({orders.length})
                  </h2>

                  {editingOrderId && (
                    <form
                      onSubmit={handleSaveOrder}
                      className="border border-[#111111] rounded-lg p-5 bg-[#FAFAFA] space-y-4"
                    >
                      <h3 className="font-display text-sm font-bold text-[#111111]">
                        Manage Order Fulfillment, Courier &amp; Refunds
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Order Status</label>
                          <select
                            value={ordStatus}
                            onChange={(e) => setOrdStatus(e.target.value as StandardOrderStatus)}
                            className="w-full border border-[#D4D4D4] bg-white rounded px-2.5 py-2 text-xs"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Pre-order Status</label>
                          <select
                            value={ordPreStatus}
                            onChange={(e) => setOrdPreStatus(e.target.value as PreOrderWorkflowStatus)}
                            className="w-full border border-[#D4D4D4] bg-white rounded px-2.5 py-2 text-xs"
                          >
                            {PREORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Payment Status</label>
                          <select
                            value={ordPaymentStatus}
                            onChange={(e) =>
                              setOrdPaymentStatus(e.target.value as Order['paymentStatus'])
                            }
                            className="w-full border border-[#D4D4D4] bg-white rounded px-2.5 py-2 text-xs"
                          >
                            <option value="COD Upon Delivery">COD Upon Delivery</option>
                            <option value="Pending Verification">Pending Verification</option>
                            <option value="Verified">Verified</option>
                            <option value="Refund Pending">Refund Pending</option>
                            <option value="Refunded">Refunded</option>
                          </select>
                        </div>
                        <input
                          value={ordCourier}
                          onChange={(e) => setOrdCourier(e.target.value)}
                          placeholder="Courier Name (e.g. Steadfast / Pathao)"
                          className="border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs"
                        />
                        <input
                          value={ordTracking}
                          onChange={(e) => setOrdTracking(e.target.value)}
                          placeholder="Courier Tracking Number"
                          className="border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs font-mono-num"
                        />
                        <input
                          type="number"
                          value={ordRefundAmount}
                          onChange={(e) => setOrdRefundAmount(e.target.value)}
                          placeholder="Refund Amount (BDT)"
                          className="border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs font-mono-num"
                        />
                        <input
                          value={ordInternalNotes}
                          onChange={(e) => setOrdInternalNotes(e.target.value)}
                          placeholder="Internal admin notes (hidden from customer)"
                          className="sm:col-span-3 border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded bg-[#B7F500] text-[#111111] text-xs font-bold"
                        >
                          Save Order Update
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingOrderId(null)}
                          className="px-4 py-2 rounded border border-[#D4D4D4] text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="border border-[#E5E5E5] rounded-lg bg-white divide-y divide-[#E5E5E5]">
                    {orders.map((o) => (
                      <div key={o.id} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <p className="font-mono-num font-bold text-sm text-[#111111]">
                            {o.orderNumber} · {o.orderType}
                          </p>
                          <p className="text-[#292929]">
                            {o.shippingAddress.fullName} ({o.shippingAddress.phone}) · {o.shippingAddress.district}
                          </p>
                          <p className="text-[#525252]">
                            Status: <strong>{o.status}</strong> · Payment: {o.paymentMethod} ({o.paymentStatus})
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono-num text-sm font-bold">{formatBDT(o.totalAmount)}</span>
                          <button
                            type="button"
                            onClick={() => openOrderEditor(o)}
                            className="px-3 py-1.5 rounded bg-[#111111] text-white font-semibold"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PRODUCT REQUESTS */}
              {activeTab === 'requests' && (
                <div className="space-y-5">
                  <h2 className="font-display text-lg font-bold text-[#111111]">
                    Special Product Sourcing Requests ({requests.length})
                  </h2>

                  {editingRequestId && (
                    <form
                      onSubmit={handleSaveRequest}
                      className="border border-[#111111] rounded-lg p-5 bg-[#FAFAFA] space-y-4"
                    >
                      <h3 className="font-display text-sm font-bold text-[#111111]">
                        Update Sourcing Status &amp; Prepare Itemized BDT Quotation
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Request Status</label>
                          <select
                            value={reqStatus}
                            onChange={(e) => setReqStatus(e.target.value as ProductRequestStatus)}
                            className="w-full border border-[#D4D4D4] bg-white rounded px-2.5 py-2 text-xs"
                          >
                            {REQUEST_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Item Cost (BDT)</label>
                          <input
                            type="number"
                            value={qItemCost}
                            onChange={(e) => setQItemCost(e.target.value)}
                            className="w-full border border-[#D4D4D4] bg-white rounded px-2.5 py-2 text-xs font-mono-num"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Shipping (BDT)</label>
                          <input
                            type="number"
                            value={qShipping}
                            onChange={(e) => setQShipping(e.target.value)}
                            className="w-full border border-[#D4D4D4] bg-white rounded px-2.5 py-2 text-xs font-mono-num"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Taxes &amp; Duties (BDT)</label>
                          <input
                            type="number"
                            value={qTax}
                            onChange={(e) => setQTax(e.target.value)}
                            className="w-full border border-[#D4D4D4] bg-white rounded px-2.5 py-2 text-xs font-mono-num"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Service Fee (BDT)</label>
                          <input
                            type="number"
                            value={qFee}
                            onChange={(e) => setQFee(e.target.value)}
                            className="w-full border border-[#D4D4D4] bg-white rounded px-2.5 py-2 text-xs font-mono-num"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Quotation Valid Until</label>
                          <input
                            type="date"
                            value={qValidUntil}
                            onChange={(e) => setQValidUntil(e.target.value)}
                            className="w-full border border-[#D4D4D4] bg-white rounded px-2.5 py-2 text-xs"
                          />
                        </div>
                        <input
                          value={qEstDelivery}
                          onChange={(e) => setQEstDelivery(e.target.value)}
                          placeholder="Estimated Delivery Period"
                          className="sm:col-span-3 border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs"
                        />
                        <textarea
                          rows={2}
                          value={reqAdminNotes}
                          onChange={(e) => setReqAdminNotes(e.target.value)}
                          placeholder="Internal admin supplier notes (never visible to customers)"
                          className="sm:col-span-3 border border-[#D4D4D4] bg-white rounded px-3 py-2 text-xs"
                        />
                      </div>
                      <p className="text-xs font-mono-num font-bold">
                        Total Quoted Price:{' '}
                        {formatBDT(
                          Number(qItemCost || 0) +
                            Number(qShipping || 0) +
                            Number(qTax || 0) +
                            Number(qFee || 0)
                        )}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded bg-[#B7F500] text-[#111111] text-xs font-bold"
                        >
                          Save Request &amp; Quote
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRequestId(null)}
                          className="px-4 py-2 rounded border border-[#D4D4D4] text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="border border-[#E5E5E5] rounded-lg bg-white divide-y divide-[#E5E5E5]">
                    {requests.map((r) => (
                      <div key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <p className="font-mono-num font-bold text-sm text-[#111111]">
                            {r.requestNumber} · {r.productName}
                          </p>
                          <p className="text-[#292929]">
                            Customer: {r.customerName} ({r.phone}) · Budget: {formatBDT(r.budgetBdt)}
                          </p>
                          <p className="text-[#525252]">
                            Status: <strong>{r.status}</strong>
                            {r.quotation ? ` · Quoted ${formatBDT(r.quotation.totalQuotedPrice)}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openRequestEditor(r)}
                          className="px-3 py-1.5 rounded bg-[#111111] text-white font-semibold"
                        >
                          Review &amp; Quote
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* B2B ENQUIRIES */}
              {activeTab === 'b2b' && (
                <div className="border border-[#E5E5E5] rounded-lg p-5 bg-white space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#111111]">
                    B2B &amp; Institutional Enquiries ({b2bEnquiries.length})
                  </h2>
                  {b2bEnquiries.length === 0 ? (
                    <p className="text-xs text-[#525252]">
                      No institutional enquiries submitted yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#E5E5E5]">
                      {b2bEnquiries.map((b) => (
                        <div key={b.id} className="py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
                          <div>
                            <p className="font-bold text-sm text-[#111111]">
                              {b.enquiryNumber} · {b.organizationName} ({b.organizationType})
                            </p>
                            <p className="text-[#525252]">
                              {b.contactPerson} ({b.phone}) · Qty: {b.estimatedQuantity} · {b.requiredProducts}
                            </p>
                          </div>
                          <select
                            aria-label={`Status for ${b.enquiryNumber}`}
                            value={b.status}
                            onChange={async (e) => {
                              await api.adminUpdateB2B(b.id, {
                                status: e.target.value as B2BEnquiry['status'],
                              });
                              loadOverview();
                            }}
                            className="border border-[#D4D4D4] rounded px-2.5 py-1.5 bg-white"
                          >
                            <option value="New">New</option>
                            <option value="Reviewing">Reviewing</option>
                            <option value="Quotation Sent">Quotation Sent</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUPPLIERS */}
              {activeTab === 'suppliers' && (
                <div className="space-y-5">
                  <form
                    onSubmit={handleAddSupplier}
                    className="border border-[#E5E5E5] rounded-lg p-5 bg-[#FAFAFA] space-y-3"
                  >
                    <h2 className="font-display text-base font-bold text-[#111111]">
                      Add Verified Supplier &amp; Scorecard (Blueprint §6.3)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <input
                        required
                        value={supName}
                        onChange={(e) => setSupName(e.target.value)}
                        placeholder="Supplier Business Name"
                        className="border border-[#D4D4D4] bg-white rounded px-3 py-2"
                      />
                      <input
                        required
                        value={supPerson}
                        onChange={(e) => setSupPerson(e.target.value)}
                        placeholder="Contact Person"
                        className="border border-[#D4D4D4] bg-white rounded px-3 py-2"
                      />
                      <input
                        value={supPhone}
                        onChange={(e) => setSupPhone(e.target.value)}
                        placeholder="Phone"
                        className="border border-[#D4D4D4] bg-white rounded px-3 py-2"
                      />
                      <input
                        value={supLocation}
                        onChange={(e) => setSupLocation(e.target.value)}
                        placeholder="Location"
                        className="border border-[#D4D4D4] bg-white rounded px-3 py-2"
                      />
                      <label className="flex items-center gap-2">
                        <span>Authenticity (1-5):</span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={supAuthScore}
                          onChange={(e) => setSupAuthScore(Number(e.target.value))}
                          className="w-14 border border-[#D4D4D4] bg-white rounded px-2 py-1"
                        />
                      </label>
                      <label className="flex items-center gap-2">
                        <span>Margin (1-5):</span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={supMarginScore}
                          onChange={(e) => setSupMarginScore(Number(e.target.value))}
                          className="w-14 border border-[#D4D4D4] bg-white rounded px-2 py-1"
                        />
                      </label>
                      <label className="flex items-center gap-2">
                        <span>Quality (1-5):</span>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={supQualityScore}
                          onChange={(e) => setSupQualityScore(Number(e.target.value))}
                          className="w-14 border border-[#D4D4D4] bg-white rounded px-2 py-1"
                        />
                      </label>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded bg-[#111111] text-white font-semibold"
                      >
                        Add Supplier
                      </button>
                    </div>
                  </form>

                  <div className="border border-[#E5E5E5] rounded-lg bg-white divide-y divide-[#E5E5E5]">
                    {suppliers.map((s) => (
                      <div key={s.id} className="p-4 flex flex-wrap justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-sm text-[#111111]">{s.name}</p>
                          <p className="text-[#525252]">
                            {s.contactPerson} · {s.phone} · {s.location}
                          </p>
                          <p className="text-[#525252] mt-1">
                            MOQ: {s.moq || 'N/A'} · Terms: {s.deliveryTerms || 'Standard'}
                          </p>
                        </div>
                        <div className="text-right font-mono-num">
                          <p className="font-bold text-sm">{s.weightedScore} / 5.0</p>
                          <p className="font-semibold text-[#111111]">{s.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SALES REPORTS */}
              {activeTab === 'sales-reports' && (
                <SalesReportsTab orders={orders} products={products} />
              )}

              {/* EXPENSES & BUDGET */}
              {activeTab === 'expenses' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 border border-[#E5E5E5] rounded-lg bg-white">
                      <p className="text-xs text-[#525252]">Earned Revenue</p>
                      <p className="font-mono-num text-xl font-bold">{formatBDT(summary.earnedRevenue)}</p>
                    </div>
                    <div className="p-4 border border-[#E5E5E5] rounded-lg bg-white">
                      <p className="text-xs text-[#525252]">Gross Profit (Earned − COGS)</p>
                      <p className="font-mono-num text-xl font-bold">{formatBDT(summary.grossProfit)}</p>
                    </div>
                    <div className="p-4 border border-[#E5E5E5] rounded-lg bg-white">
                      <p className="text-xs text-[#525252]">Operating Expenses</p>
                      <p className="font-mono-num text-xl font-bold">{formatBDT(summary.operatingExpenses)}</p>
                    </div>
                    <div className="p-4 border border-[#E5E5E5] rounded-lg bg-white">
                      <p className="text-xs text-[#525252]">Est. Operating Profit</p>
                      <p className="font-mono-num text-xl font-bold">
                        {formatBDT(summary.estimatedOperatingProfit)}
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={handleAddExpense}
                    className="border border-[#E5E5E5] rounded-lg p-5 bg-[#FAFAFA] grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
                  >
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                      className="border border-[#D4D4D4] bg-white rounded px-3 py-2"
                    >
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      value={expDesc}
                      onChange={(e) => setExpDesc(e.target.value)}
                      placeholder="Expense description"
                      className="sm:col-span-2 border border-[#D4D4D4] bg-white rounded px-3 py-2"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        min={1}
                        value={expAmount}
                        onChange={(e) => setExpAmount(e.target.value)}
                        placeholder="BDT"
                        className="w-full border border-[#D4D4D4] bg-white rounded px-3 py-2 font-mono-num"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded bg-[#111111] text-white font-semibold whitespace-nowrap"
                      >
                        Record
                      </button>
                    </div>
                  </form>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="border border-[#E5E5E5] rounded-lg p-5 bg-white space-y-3">
                      <h3 className="font-display text-sm font-bold text-[#111111]">
                        Recorded Business Expenses ({expenses.length})
                      </h3>
                      <div className="divide-y divide-[#F4F4F4] text-xs">
                        {expenses.map((ex) => (
                          <div key={ex.id} className="py-2 flex justify-between gap-3">
                            <div>
                              <p className="font-semibold text-[#111111]">{ex.description}</p>
                              <p className="text-[#525252]">
                                {ex.date} · {ex.category}
                              </p>
                            </div>
                            <span className="font-mono-num font-bold">{formatBDT(ex.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border border-[#E5E5E5] rounded-lg p-5 bg-white space-y-3">
                      <h3 className="font-display text-sm font-bold text-[#111111]">
                        Blueprint §9.1 Base Launch Budget Plan (৳150,000)
                      </h3>
                      <div className="divide-y divide-[#F4F4F4] text-xs">
                        {BLUEPRINT_LAUNCH_BUDGET.map((row) => (
                          <div key={row.category} className="py-2 flex justify-between">
                            <span className="text-[#292929]">{row.category}</span>
                            <span className="font-mono-num font-semibold">{formatBDT(row.plannedBdt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* COUPONS */}
              {activeTab === 'coupons' && (
                <div className="space-y-5">
                  <form
                    onSubmit={handleAddCoupon}
                    className="border border-[#E5E5E5] rounded-lg p-5 bg-[#FAFAFA] grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
                  >
                    <input
                      required
                      value={cpnCode}
                      onChange={(e) => setCpnCode(e.target.value)}
                      placeholder="Coupon Code (e.g. SYLHET150)"
                      className="border border-[#D4D4D4] bg-white rounded px-3 py-2 uppercase font-mono-num"
                    />
                    <input
                      type="number"
                      required
                      value={cpnValue}
                      onChange={(e) => setCpnValue(e.target.value)}
                      placeholder="Fixed BDT Discount"
                      className="border border-[#D4D4D4] bg-white rounded px-3 py-2 font-mono-num"
                    />
                    <input
                      type="number"
                      required
                      value={cpnMin}
                      onChange={(e) => setCpnMin(e.target.value)}
                      placeholder="Min Order BDT"
                      className="border border-[#D4D4D4] bg-white rounded px-3 py-2 font-mono-num"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded bg-[#111111] text-white font-semibold"
                    >
                      Create Coupon
                    </button>
                  </form>

                  <div className="border border-[#E5E5E5] rounded-lg bg-white divide-y divide-[#E5E5E5]">
                    {coupons.map((c) => (
                      <div key={c.id} className="p-4 flex justify-between text-xs">
                        <div>
                          <p className="font-mono-num font-bold text-sm">{c.code}</p>
                          <p className="text-[#525252]">{c.description}</p>
                        </div>
                        <span className="font-mono-num font-semibold">
                          {c.discountType === 'percent' ? `${c.value}%` : formatBDT(c.value)} (Min {formatBDT(c.minOrderAmount)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CUSTOMERS & REVIEWS */}
              {activeTab === 'customers' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="border border-[#E5E5E5] rounded-lg p-5 bg-white space-y-3">
                    <h2 className="font-display text-base font-bold text-[#111111]">
                      Registered Customers ({customers.length})
                    </h2>
                    <div className="divide-y divide-[#F4F4F4] text-xs">
                      {customers.map((c) => (
                        <div key={c.id} className="py-2.5">
                          <p className="font-bold text-[#111111]">{c.name}</p>
                          <p className="text-[#525252] font-mono-num">
                            {c.email} · {c.phone}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border border-[#E5E5E5] rounded-lg p-5 bg-white space-y-3">
                    <h2 className="font-display text-base font-bold text-[#111111]">
                      Genuine Product Reviews ({reviews.length})
                    </h2>
                    {reviews.length === 0 ? (
                      <p className="text-xs text-[#525252]">No customer reviews submitted yet.</p>
                    ) : (
                      <div className="divide-y divide-[#F4F4F4] text-xs">
                        {reviews.map((r) => (
                          <div key={r.id} className="py-2.5">
                            <p className="font-bold text-[#111111]">
                              {r.productName} ({r.rating}/5)
                            </p>
                            <p className="text-[#525252]">
                              {r.customerName}: {r.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SETTINGS */}
              {activeTab === 'settings' && settings && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await api.adminUpdateSettings(settings);
                    setStatusBanner('Store settings updated.');
                    onCatalogRefresh();
                  }}
                  className="border border-[#E5E5E5] rounded-lg p-6 bg-white space-y-4 text-xs"
                >
                  <h2 className="font-display text-lg font-bold text-[#111111]">
                    Storefront &amp; Delivery Rate Settings
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1">Announcement Bar (English)</label>
                      <input
                        value={settings.announcementText}
                        onChange={(e) =>
                          setSettings({ ...settings, announcementText: e.target.value })
                        }
                        className="w-full border border-[#D4D4D4] rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Free Shipping Threshold (BDT)</label>
                      <input
                        type="number"
                        value={settings.freeShippingThreshold}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            freeShippingThreshold: Number(e.target.value),
                          })
                        }
                        className="w-full border border-[#D4D4D4] rounded px-3 py-2 font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Dhaka Metro Shipping (BDT)</label>
                      <input
                        type="number"
                        value={settings.dhakaMetroShipping}
                        onChange={(e) =>
                          setSettings({ ...settings, dhakaMetroShipping: Number(e.target.value) })
                        }
                        className="w-full border border-[#D4D4D4] rounded px-3 py-2 font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Nationwide Shipping (BDT)</label>
                      <input
                        type="number"
                        value={settings.nationwideShipping}
                        onChange={(e) =>
                          setSettings({ ...settings, nationwideShipping: Number(e.target.value) })
                        }
                        className="w-full border border-[#D4D4D4] rounded px-3 py-2 font-mono-num"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded bg-[#B7F500] text-[#111111] font-bold"
                  >
                    Save Store Settings
                  </button>
                </form>
              )}

              {/* AUDIT LOGS */}
              {activeTab === 'audit' && (
                <div className="border border-[#E5E5E5] rounded-lg p-5 bg-white space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#111111] flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Admin Action Audit Logs ({auditLogs.length})
                  </h2>
                  <div className="divide-y divide-[#F4F4F4] text-xs">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="py-2.5 flex flex-wrap justify-between gap-2">
                        <div>
                          <span className="font-bold text-[#111111]">{log.action}</span> ·{' '}
                          <span className="font-mono-num">{log.target}</span> — {log.details}
                        </div>
                        <span className="text-[#525252] font-mono-num">
                          {log.actor} · {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
