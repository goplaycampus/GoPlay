import type {
  CartItem,
  Coupon,
  Expense,
  Order,
  Product,
  SupplierScorecard,
  SupplierStatus,
} from '../types';

export function formatBDT(amount: number): string {
  const rounded = Math.round(Number.isFinite(amount) ? amount : 0);
  return `৳${rounded.toLocaleString('en-US')}`;
}

export function validateBangladeshPhone(raw: string): boolean {
  const cleaned = raw.replace(/[\s\-()]/g, '');
  return /^(?:\+?880|0)1[3-9]\d{8}$/.test(cleaned);
}

export function normalizeBangladeshPhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-()]/g, '');
  if (/^\+8801[3-9]\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^8801[3-9]\d{8}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  if (/^01[3-9]\d{8}$/.test(cleaned)) {
    return `+88${cleaned}`;
  }
  return raw.trim();
}

export function calculateLandedCost(
  purchaseCost: number,
  inboundTransport = 0,
  importDutyTax = 0,
  packagingCost = 0
): number {
  return Math.max(0, Math.round(purchaseCost + inboundTransport + importDutyTax + packagingCost));
}

export function calculateGrossMarginPct(sellingPrice: number, landedCost: number): number {
  if (sellingPrice <= 0) return 0;
  return Number((((sellingPrice - landedCost) / sellingPrice) * 100).toFixed(1));
}

export function calculateSupplierWeightedScore(scorecard: SupplierScorecard): {
  score: number;
  status: SupplierStatus;
} {
  const clamp = (n: number) => Math.min(5, Math.max(1, n));
  const weighted =
    clamp(scorecard.authenticityDocs) * 0.25 +
    clamp(scorecard.priceMargin) * 0.2 +
    clamp(scorecard.productQuality) * 0.2 +
    clamp(scorecard.availabilityConsistency) * 0.15 +
    clamp(scorecard.deliveryReliability) * 0.1 +
    clamp(scorecard.returnWarranty) * 0.1;

  const score = Number(weighted.toFixed(2));
  const status: SupplierStatus =
    score >= 4.0 ? 'Preferred' : score >= 3.0 ? 'Backup' : 'Do Not Use';
  return { score, status };
}

export function calculateDeliveryCharge(
  division: string,
  district: string,
  subtotal: number,
  hasPreOrderOnly: boolean,
  rates = { dhakaMetro: 70, dhakaSuburb: 100, nationwide: 130, freeThreshold: 3500 }
): number {
  if (subtotal <= 0) return 0;
  if (!hasPreOrderOnly && subtotal >= rates.freeThreshold) return 0;
  if (division === 'Dhaka' && district === 'Dhaka Metro') return rates.dhakaMetro;
  if (division === 'Dhaka') return rates.dhakaSuburb;
  return rates.nationwide;
}

export function calculateCartTotals(
  items: CartItem[],
  division: string,
  district: string,
  coupon?: Coupon | null,
  rates = { dhakaMetro: 70, dhakaSuburb: 100, nationwide: 130, freeThreshold: 3500 }
): {
  subtotal: number;
  discountAmount: number;
  deliveryCharge: number;
  totalAmount: number;
  orderType: 'Ready Stock' | 'Pre-order' | 'Mixed';
  couponApplied: boolean;
} {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const hasReady = items.some((i) => i.availabilityStatus === 'In Stock');
  const hasPre = items.some((i) => i.availabilityStatus === 'Pre-order');
  const orderType: 'Ready Stock' | 'Pre-order' | 'Mixed' =
    hasReady && hasPre ? 'Mixed' : hasPre ? 'Pre-order' : 'Ready Stock';

  let discountAmount = 0;
  let couponApplied = false;
  if (coupon && coupon.active && subtotal >= coupon.minOrderAmount) {
    couponApplied = true;
    discountAmount =
      coupon.discountType === 'percent'
        ? Math.round((subtotal * coupon.value) / 100)
        : Math.min(subtotal, coupon.value);
  }

  const netSubtotal = Math.max(0, subtotal - discountAmount);
  const deliveryCharge = calculateDeliveryCharge(
    division,
    district,
    netSubtotal,
    hasPre && !hasReady,
    rates
  );

  return {
    subtotal,
    discountAmount,
    deliveryCharge,
    totalAmount: netSubtotal + deliveryCharge,
    orderType,
    couponApplied,
  };
}

export function calculateFinancialSummary(
  orders: Order[],
  expenses: Expense[],
  products: Product[]
): {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  earnedRevenue: number;
  heldPreOrderAdvances: number;
  estimatedCOGS: number;
  grossProfit: number;
  operatingExpenses: number;
  refundsRecorded: number;
  estimatedOperatingProfit: number;
  inventoryCostValue: number;
  lowStockCount: number;
  pendingPreOrdersCount: number;
} {
  const activeOrders = orders.filter((o) => o.status !== 'Cancelled' && o.status !== 'Refunded');
  const completedOrders = orders.filter(
    (o) => o.status === 'Delivered' || o.status === 'Completed'
  );
  const cancelledOrders = orders.filter(
    (o) => o.status === 'Cancelled' || o.status === 'Refunded'
  );
  const pendingOrders = orders.filter(
    (o) =>
      o.status !== 'Delivered' &&
      o.status !== 'Completed' &&
      o.status !== 'Cancelled' &&
      o.status !== 'Refunded'
  );

  // Blueprint §9.4: Do not treat pre-order advances as earned revenue until fulfilled/delivered.
  const earnedRevenue = activeOrders
    .filter((o) => o.orderType === 'Ready Stock' || o.status === 'Delivered' || o.status === 'Completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const heldPreOrderAdvances = activeOrders
    .filter((o) => o.orderType !== 'Ready Stock' && o.status !== 'Delivered' && o.status !== 'Completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const estimatedCOGS = activeOrders
    .filter((o) => o.orderType === 'Ready Stock' || o.status === 'Delivered' || o.status === 'Completed')
    .reduce((sum, o) => {
      const orderCogs = o.items.reduce(
        (iSum, item) => iSum + (item.purchaseCostSnapshot ?? Math.round(item.unitPrice * 0.75)) * item.quantity,
        0
      );
      return sum + orderCogs;
    }, 0);

  // Blueprint §12: Keep revenue, gross profit, operating expenses and estimated operating profit separate.
  // Exclude 'Product Purchasing' and 'Refunds' from operating expenses so inventory purchases & refunds are not double-counted against COGS.
  const operatingExpenses = expenses
    .filter((e) => e.category !== 'Product Purchasing' && e.category !== 'Refunds')
    .reduce((sum, e) => sum + e.amount, 0);

  const refundsFromOrders = orders.reduce((sum, o) => sum + (o.refundAmount ?? 0), 0);
  const refundsFromExpenses = expenses
    .filter((e) => e.category === 'Refunds')
    .reduce((sum, e) => sum + e.amount, 0);
  const refundsRecorded = Math.max(refundsFromOrders, refundsFromExpenses);

  const grossProfit = earnedRevenue - estimatedCOGS;
  const estimatedOperatingProfit = grossProfit - operatingExpenses;

  const inventoryCostValue = products.reduce(
    (sum, p) => sum + (p.purchaseCost ?? Math.round(p.sellingPrice * 0.72)) * p.stockQuantity,
    0
  );

  const lowStockCount = products.filter(
    (p) => p.availabilityStatus === 'In Stock' && p.stockQuantity <= p.reorderPoint
  ).length;

  const pendingPreOrdersCount = orders.filter(
    (o) =>
      (o.orderType === 'Pre-order' || o.orderType === 'Mixed') &&
      o.status !== 'Delivered' &&
      o.status !== 'Completed' &&
      o.status !== 'Cancelled' &&
      o.status !== 'Refunded'
  ).length;

  return {
    totalOrders: orders.length,
    pendingOrders: pendingOrders.length,
    completedOrders: completedOrders.length,
    cancelledOrders: cancelledOrders.length,
    earnedRevenue,
    heldPreOrderAdvances,
    estimatedCOGS,
    grossProfit,
    operatingExpenses,
    refundsRecorded,
    estimatedOperatingProfit,
    inventoryCostValue,
    lowStockCount,
    pendingPreOrdersCount,
  };
}

export function generateTrackingCode(prefix: 'ORD' | 'REQ' | 'B2B'): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const timePart = Date.now().toString().slice(-3);
  return `${prefix}-GPL-${timePart}${rand}`;
}

export type SalesDateRange = 'all' | '7d' | '30d' | 'custom';
export type SalesOrderTypeFilter = 'all' | 'Ready Stock' | 'Pre-order' | 'Mixed';

export interface SalesReportFilter {
  dateRange?: SalesDateRange;
  startDate?: string;
  endDate?: string;
  orderType?: SalesOrderTypeFilter;
  referenceDate?: Date;
}

export interface DailySalesPoint {
  date: string;
  label: string;
  revenue: number;
  earnedRevenue: number;
  orders: number;
  units: number;
  aov: number;
}

export interface CategorySalesPoint {
  categoryLabel: string;
  unitsSold: number;
  revenue: number;
  orderCount: number;
  sharePct: number;
}

export interface TopProductSalesPoint {
  sku: string;
  name: string;
  brand: string;
  categoryLabel: string;
  unitsSold: number;
  revenue: number;
}

export interface DivisionSalesPoint {
  division: string;
  orders: number;
  revenue: number;
  sharePct: number;
}

export interface PaymentBreakdownPoint {
  method: string;
  orders: number;
  revenue: number;
  sharePct: number;
}

export interface OrderStatusBreakdownPoint {
  status: string;
  orders: number;
  revenue: number;
}

export interface OrderTypeBreakdownPoint {
  orderType: string;
  orders: number;
  revenue: number;
  sharePct: number;
}

export interface SalesReportData {
  totalMatchingOrders: number;
  activeOrderCount: number;
  cancelledOrRefundedCount: number;
  cancellationRatePct: number;
  grossOrderVolume: number;
  earnedRevenue: number;
  heldPreOrderAdvances: number;
  averageOrderValue: number;
  totalUnitsSold: number;
  merchandiseSalesTotal: number;
  uniqueCustomerCount: number;
  repeatCustomerCount: number;
  repeatCustomerRatePct: number;
  dailySeries: DailySalesPoint[];
  topCategories: CategorySalesPoint[];
  topProducts: TopProductSalesPoint[];
  byDivision: DivisionSalesPoint[];
  paymentBreakdown: PaymentBreakdownPoint[];
  statusBreakdown: OrderStatusBreakdownPoint[];
  orderTypeBreakdown: OrderTypeBreakdownPoint[];
}

const SKU_CATEGORY_MAP: Record<string, string> = {
  CRI: 'Cricket',
  FTB: 'Football',
  BAD: 'Badminton & Tennis',
  TEN: 'Badminton & Tennis',
  FIT: 'Gym & Fitness',
  RUN: 'Running',
  SPT: 'Sportswear',
  SWM: 'Swimming & Outdoor',
  TEC: 'Sports Tech & Recovery',
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatUtcDayLabel(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  const monthName = MONTH_SHORT[monthIdx] ?? match[2];
  return `${monthName} ${day}`;
}

function resolveCategoryLabel(
  productId: string,
  sku: string,
  productById: Map<string, Product>,
  productBySku: Map<string, Product>
): string {
  const matched = productById.get(productId) ?? productBySku.get(sku);
  if (matched?.categoryLabel) return matched.categoryLabel;
  const code = sku.split('-')[1]?.toUpperCase();
  if (code && SKU_CATEGORY_MAP[code]) return SKU_CATEGORY_MAP[code];
  return 'Other';
}

export function calculateSalesReport(
  orders: Order[],
  products: Product[],
  filter: SalesReportFilter = {}
): SalesReportData {
  const dateRange = filter.dateRange ?? 'all';
  const orderType = filter.orderType ?? 'all';
  const refDate = filter.referenceDate ?? new Date();

  let cutoffIsoDate: string | null = null;
  if (dateRange === '7d' || dateRange === '30d') {
    const days = dateRange === '7d' ? 7 : 30;
    const refUtcMidnight = Date.UTC(
      refDate.getUTCFullYear(),
      refDate.getUTCMonth(),
      refDate.getUTCDate()
    );
    const cutoffMs = refUtcMidnight - (days - 1) * 86_400_000;
    cutoffIsoDate = new Date(cutoffMs).toISOString().slice(0, 10);
  }

  const filteredOrders = orders.filter((o) => {
    if (orderType !== 'all' && o.orderType !== orderType) return false;
    const orderDay = (o.createdAt || '').slice(0, 10);
    if (cutoffIsoDate) {
      if (!orderDay || orderDay < cutoffIsoDate) return false;
    } else if (dateRange === 'custom') {
      if (filter.startDate && (!orderDay || orderDay < filter.startDate)) return false;
      if (filter.endDate && (!orderDay || orderDay > filter.endDate)) return false;
    }
    return true;
  });

  const activeOrders = filteredOrders.filter(
    (o) => o.status !== 'Cancelled' && o.status !== 'Refunded'
  );
  const cancelledOrRefundedCount = filteredOrders.length - activeOrders.length;
  const cancellationRatePct =
    filteredOrders.length > 0
      ? Number(((cancelledOrRefundedCount / filteredOrders.length) * 100).toFixed(1))
      : 0;

  let grossOrderVolume = 0;
  let earnedRevenue = 0;
  let heldPreOrderAdvances = 0;
  let totalUnitsSold = 0;
  let merchandiseSalesTotal = 0;

  const productById = new Map<string, Product>();
  const productBySku = new Map<string, Product>();
  for (const p of products) {
    productById.set(p.id, p);
    productBySku.set(p.sku, p);
  }

  const dailyMap = new Map<
    string,
    { revenue: number; earnedRevenue: number; orders: number; units: number }
  >();
  const categoryMap = new Map<
    string,
    { unitsSold: number; revenue: number; orderIds: Set<string> }
  >();
  const productMap = new Map<string, TopProductSalesPoint>();
  const divisionMap = new Map<string, { orders: number; revenue: number }>();
  const paymentMap = new Map<string, { orders: number; revenue: number }>();
  const statusMap = new Map<string, { orders: number; revenue: number }>();
  const orderTypeMap = new Map<string, { orders: number; revenue: number }>();
  const customerOrderCounts = new Map<string, number>();

  for (const order of filteredOrders) {
    const stEntry = statusMap.get(order.status) ?? { orders: 0, revenue: 0 };
    stEntry.orders += 1;
    stEntry.revenue += order.totalAmount;
    statusMap.set(order.status, stEntry);
  }

  for (const order of activeOrders) {
    const isEarned =
      order.orderType === 'Ready Stock' ||
      order.status === 'Delivered' ||
      order.status === 'Completed';

    grossOrderVolume += order.totalAmount;
    if (isEarned) {
      earnedRevenue += order.totalAmount;
    } else {
      heldPreOrderAdvances += order.totalAmount;
    }

    const custKey =
      (order.customerEmail || order.shippingAddress?.phone || order.shippingAddress?.fullName || order.id)
        .trim()
        .toLowerCase();
    customerOrderCounts.set(custKey, (customerOrderCounts.get(custKey) ?? 0) + 1);

    const otEntry = orderTypeMap.get(order.orderType) ?? { orders: 0, revenue: 0 };
    otEntry.orders += 1;
    otEntry.revenue += order.totalAmount;
    orderTypeMap.set(order.orderType, otEntry);

    const orderUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);
    totalUnitsSold += orderUnits;

    const dateKey = (order.createdAt || '').slice(0, 10) || 'Unknown';
    const dayEntry = dailyMap.get(dateKey) ?? {
      revenue: 0,
      earnedRevenue: 0,
      orders: 0,
      units: 0,
    };
    dayEntry.revenue += order.totalAmount;
    if (isEarned) dayEntry.earnedRevenue += order.totalAmount;
    dayEntry.orders += 1;
    dayEntry.units += orderUnits;
    dailyMap.set(dateKey, dayEntry);

    const divisionKey = order.shippingAddress?.division || 'Unspecified';
    const divEntry = divisionMap.get(divisionKey) ?? { orders: 0, revenue: 0 };
    divEntry.orders += 1;
    divEntry.revenue += order.totalAmount;
    divisionMap.set(divisionKey, divEntry);

    const paymentKey = order.paymentMethod || 'Other';
    const payEntry = paymentMap.get(paymentKey) ?? { orders: 0, revenue: 0 };
    payEntry.orders += 1;
    payEntry.revenue += order.totalAmount;
    paymentMap.set(paymentKey, payEntry);

    for (const item of order.items) {
      const itemRevenue = item.unitPrice * item.quantity;
      merchandiseSalesTotal += itemRevenue;
      const categoryLabel = resolveCategoryLabel(
        item.productId,
        item.sku,
        productById,
        productBySku
      );

      const catEntry = categoryMap.get(categoryLabel) ?? {
        unitsSold: 0,
        revenue: 0,
        orderIds: new Set<string>(),
      };
      catEntry.unitsSold += item.quantity;
      catEntry.revenue += itemRevenue;
      catEntry.orderIds.add(order.id);
      categoryMap.set(categoryLabel, catEntry);

      const prodKey = item.sku || item.productId;
      const prodEntry = productMap.get(prodKey) ?? {
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        categoryLabel,
        unitsSold: 0,
        revenue: 0,
      };
      prodEntry.unitsSold += item.quantity;
      prodEntry.revenue += itemRevenue;
      productMap.set(prodKey, prodEntry);
    }
  }

  const averageOrderValue =
    activeOrders.length > 0 ? Math.round(grossOrderVolume / activeOrders.length) : 0;

  const uniqueCustomerCount = customerOrderCounts.size;
  const repeatCustomerCount = Array.from(customerOrderCounts.values()).filter((c) => c > 1).length;
  const repeatCustomerRatePct =
    uniqueCustomerCount > 0
      ? Number(((repeatCustomerCount / uniqueCustomerCount) * 100).toFixed(1))
      : 0;

  const dailySeries: DailySalesPoint[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      label: formatUtcDayLabel(date),
      revenue: data.revenue,
      earnedRevenue: data.earnedRevenue,
      orders: data.orders,
      units: data.units,
      aov: data.orders > 0 ? Math.round(data.revenue / data.orders) : 0,
    }));

  const topCategories: CategorySalesPoint[] = Array.from(categoryMap.entries())
    .map(([categoryLabel, data]) => ({
      categoryLabel,
      unitsSold: data.unitsSold,
      revenue: data.revenue,
      orderCount: data.orderIds.size,
      sharePct:
        merchandiseSalesTotal > 0
          ? Number(((data.revenue / merchandiseSalesTotal) * 100).toFixed(1))
          : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold);

  const topProducts: TopProductSalesPoint[] = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold)
    .slice(0, 8);

  const byDivision: DivisionSalesPoint[] = Array.from(divisionMap.entries())
    .map(([division, data]) => ({
      division,
      orders: data.orders,
      revenue: data.revenue,
      sharePct:
        grossOrderVolume > 0 ? Number(((data.revenue / grossOrderVolume) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders);

  const paymentBreakdown: PaymentBreakdownPoint[] = Array.from(paymentMap.entries())
    .map(([method, data]) => ({
      method,
      orders: data.orders,
      revenue: data.revenue,
      sharePct:
        grossOrderVolume > 0 ? Number(((data.revenue / grossOrderVolume) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders);

  const statusBreakdown: OrderStatusBreakdownPoint[] = Array.from(statusMap.entries())
    .map(([status, data]) => ({ status, orders: data.orders, revenue: data.revenue }))
    .sort((a, b) => b.orders - a.orders || b.revenue - a.revenue);

  const orderTypeBreakdown: OrderTypeBreakdownPoint[] = Array.from(orderTypeMap.entries())
    .map(([ot, data]) => ({
      orderType: ot,
      orders: data.orders,
      revenue: data.revenue,
      sharePct:
        grossOrderVolume > 0 ? Number(((data.revenue / grossOrderVolume) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders);

  return {
    totalMatchingOrders: filteredOrders.length,
    activeOrderCount: activeOrders.length,
    cancelledOrRefundedCount,
    cancellationRatePct,
    grossOrderVolume,
    earnedRevenue,
    heldPreOrderAdvances,
    averageOrderValue,
    totalUnitsSold,
    merchandiseSalesTotal,
    uniqueCustomerCount,
    repeatCustomerCount,
    repeatCustomerRatePct,
    dailySeries,
    topCategories,
    topProducts,
    byDivision,
    paymentBreakdown,
    statusBreakdown,
    orderTypeBreakdown,
  };
}

export function calculateDiscountPct(sellingPrice: number, discountPrice?: number): number {
  if (!discountPrice || discountPrice <= 0 || discountPrice >= sellingPrice || sellingPrice <= 0) {
    return 0;
  }
  return Math.round(((sellingPrice - discountPrice) / sellingPrice) * 100);
}

export function getComplementaryProducts(
  target: Product,
  allProducts: Product[],
  limit = 3
): Product[] {
  const candidates = allProducts.filter(
    (p) =>
      p.id !== target.id &&
      (p.availabilityStatus === 'In Stock' || p.availabilityStatus === 'Pre-order')
  );
  const sameCategory = candidates.filter((p) => p.category === target.category);
  const otherInStock = candidates.filter(
    (p) => p.category !== target.category && p.availabilityStatus === 'In Stock'
  );
  return [...sameCategory, ...otherInStock].slice(0, limit);
}

export function getCartUpsellSuggestions(
  cartItems: CartItem[],
  allProducts: Product[],
  limit = 2
): Product[] {
  const inCartIds = new Set(cartItems.map((i) => i.productId));
  return allProducts
    .filter((p) => {
      if (inCartIds.has(p.id)) return false;
      if (p.availabilityStatus !== 'In Stock') return false;
      const price = p.discountPrice ?? p.sellingPrice;
      return price <= 1500;
    })
    .sort((a, b) => {
      const aScore = (a.discountPrice ?? a.sellingPrice) + (a.isBestSeller ? -200 : 0);
      const bScore = (b.discountPrice ?? b.sellingPrice) + (b.isBestSeller ? -200 : 0);
      return aScore - bScore;
    })
    .slice(0, limit);
}

export function formatSalesPeriodLabel(filter: SalesReportFilter): string {
  const dateRange = filter.dateRange ?? 'all';
  if (dateRange === '7d') return 'Weekly (Last 7 Days)';
  if (dateRange === '30d') return 'Monthly (Last 30 Days)';
  if (dateRange === 'custom') {
    const from = filter.startDate?.trim() || 'Start';
    const to = filter.endDate?.trim() || 'Present';
    return `Custom (${from} to ${to})`;
  }
  return 'All Time';
}

export function buildSalesReportFilename(
  dateRange: SalesDateRange,
  extension: 'csv',
  startDate?: string,
  endDate?: string,
  referenceDate: Date = new Date()
): string {
  const stamp = referenceDate.toISOString().slice(0, 10);
  const scope =
    dateRange === '7d'
      ? 'weekly-7d'
      : dateRange === '30d'
      ? 'monthly-30d'
      : dateRange === 'custom'
      ? `custom-${startDate || 'start'}-to-${endDate || stamp}`
      : 'all-time';
  return `goplay-sales-report-${scope}-${stamp}.${extension}`;
}

export function escapeCsvCell(value: string | number): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '0';
  }
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function buildSalesReportCsv(
  report: SalesReportData,
  meta: {
    periodLabel: string;
    orderType: SalesOrderTypeFilter;
    generatedAt?: string;
  }
): string {
  const generatedAt = meta.generatedAt ?? new Date().toISOString();
  const rows: (string | number)[][] = [
    ['GoPlay Bangladesh — Sales Performance Report'],
    ['Generated At (UTC)', generatedAt],
    ['Reporting Period', meta.periodLabel],
    ['Order Type Filter', meta.orderType === 'all' ? 'All Order Types' : meta.orderType],
    [],
    ['Executive Summary KPIs'],
    ['Metric', 'Value'],
    ['Gross Order Volume (BDT)', report.grossOrderVolume],
    ['Earned Revenue (BDT)', report.earnedRevenue],
    ['Held Pre-order Advances (BDT)', report.heldPreOrderAdvances],
    ['Average Order Value (BDT)', report.averageOrderValue],
    ['Active Orders', report.activeOrderCount],
    ['Total Matching Orders', report.totalMatchingOrders],
    ['Cancelled / Refunded Orders', report.cancelledOrRefundedCount],
    ['Cancellation / Refund Rate (%)', report.cancellationRatePct],
    ['Units Sold', report.totalUnitsSold],
    ['Unique Buyers', report.uniqueCustomerCount],
    ['Repeat Buyers', report.repeatCustomerCount],
    ['Repeat Buyer Rate (%)', report.repeatCustomerRatePct],
    [],
    ['Daily Performance'],
    ['Date', 'Active Orders', 'Units Sold', 'Gross Revenue (BDT)', 'Earned Revenue (BDT)', 'AOV (BDT)'],
    ...report.dailySeries.map((d) => [
      d.date,
      d.orders,
      d.units,
      d.revenue,
      d.earnedRevenue,
      d.aov,
    ]),
    [],
    ['Top-Selling Categories'],
    ['Category', 'Orders', 'Units Sold', 'Merchandise Revenue (BDT)', 'Share (%)'],
    ...report.topCategories.map((c) => [
      c.categoryLabel,
      c.orderCount,
      c.unitsSold,
      c.revenue,
      c.sharePct,
    ]),
    [],
    ['Top-Selling Products'],
    ['SKU', 'Product Name', 'Brand', 'Category', 'Units Sold', 'Merchandise Revenue (BDT)'],
    ...report.topProducts.map((p) => [
      p.sku,
      p.name,
      p.brand,
      p.categoryLabel,
      p.unitsSold,
      p.revenue,
    ]),
    [],
    ['Sales by Bangladesh Division'],
    ['Division', 'Orders', 'Share (%)', 'Revenue (BDT)'],
    ...report.byDivision.map((d) => [d.division, d.orders, d.sharePct, d.revenue]),
    [],
    ['Order Model Split'],
    ['Order Type', 'Orders', 'Share (%)', 'Revenue (BDT)'],
    ...report.orderTypeBreakdown.map((ot) => [ot.orderType, ot.orders, ot.sharePct, ot.revenue]),
    [],
    ['Payment Method Split'],
    ['Payment Method', 'Orders', 'Share (%)', 'Revenue (BDT)'],
    ...report.paymentBreakdown.map((pm) => [pm.method, pm.orders, pm.sharePct, pm.revenue]),
    [],
    ['Fulfillment Status Distribution'],
    ['Status', 'Orders', 'Revenue (BDT)'],
    ...report.statusBreakdown.map((st) => [st.status, st.orders, st.revenue]),
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export type ShopSortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc';
export type ShopQuickPreset = 'all' | 'ready' | 'preorder' | 'sale' | 'under-1500';

export interface ShopFilterState {
  categories: string[];
  brands: string[];
  availability: string;
  size: string;
  minPrice: number;
  maxPrice: number;
  quickPreset: ShopQuickPreset;
  searchQuery: string;
  sortBy: ShopSortOption;
}

export function getEffectiveProductPrice(product: Product): number {
  return product.discountPrice && product.discountPrice > 0
    ? product.discountPrice
    : product.sellingPrice;
}

export function getCatalogPriceBounds(products: Product[]): { min: number; max: number } {
  if (products.length === 0) return { min: 0, max: 25000 };
  let maxVal = 0;
  for (const p of products) {
    const price = getEffectiveProductPrice(p);
    if (price > maxVal) maxVal = price;
  }
  const roundedMax = Math.max(5000, Math.ceil(maxVal / 1000) * 1000);
  return { min: 0, max: roundedMax };
}

export function filterAndSortShopProducts(
  products: Product[],
  filter: ShopFilterState
): Product[] {
  const q = filter.searchQuery.trim().toLowerCase();
  const minP = Math.min(filter.minPrice, filter.maxPrice);
  const maxP = Math.max(filter.minPrice, filter.maxPrice);

  const filtered = products.filter((p) => {
    if (filter.categories.length > 0 && !filter.categories.includes(p.category)) {
      return false;
    }
    if (filter.brands.length > 0 && !filter.brands.includes(p.brand)) {
      return false;
    }
    if (filter.availability !== 'all' && p.availabilityStatus !== filter.availability) {
      return false;
    }
    if (filter.size !== 'all' && !p.sizes.includes(filter.size)) {
      return false;
    }
    const price = getEffectiveProductPrice(p);
    if (price < minP || price > maxP) {
      return false;
    }
    if (filter.quickPreset === 'ready' && p.availabilityStatus !== 'In Stock') {
      return false;
    }
    if (filter.quickPreset === 'preorder' && p.availabilityStatus !== 'Pre-order') {
      return false;
    }
    if (
      filter.quickPreset === 'sale' &&
      calculateDiscountPct(p.sellingPrice, p.discountPrice) === 0
    ) {
      return false;
    }
    if (filter.quickPreset === 'under-1500' && price > 1500) {
      return false;
    }
    if (q) {
      const hay =
        `${p.name} ${p.nameBn} ${p.brand} ${p.model} ${p.sku} ${p.categoryLabel}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return filtered.sort((a, b) => {
    const priceA = getEffectiveProductPrice(a);
    const priceB = getEffectiveProductPrice(b);
    if (filter.sortBy === 'price-asc') return priceA - priceB;
    if (filter.sortBy === 'price-desc') return priceB - priceA;
    if (filter.sortBy === 'newest') return b.updatedAt.localeCompare(a.updatedAt);
    return (
      Number(Boolean(b.featured || b.isBestSeller)) -
      Number(Boolean(a.featured || a.isBestSeller))
    );
  });
}

export function computeShopFilterFacets(
  products: Product[],
  filter: ShopFilterState
): {
  categoryCounts: Record<string, number>;
  brandCounts: Record<string, number>;
  brands: string[];
  sizes: string[];
} {
  // Compute category counts ignoring selected categories so users can multi-select freely
  const forCategories = filterAndSortShopProducts(products, {
    ...filter,
    categories: [],
  });
  const categoryCounts: Record<string, number> = {};
  for (const p of forCategories) {
    categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
  }

  // Compute brand counts ignoring selected brands so users can see available brands in current category/price window
  const forBrands = filterAndSortShopProducts(products, {
    ...filter,
    brands: [],
  });
  const brandCounts: Record<string, number> = {};
  for (const p of forBrands) {
    brandCounts[p.brand] = (brandCounts[p.brand] ?? 0) + 1;
  }

  const brands = Array.from(new Set(products.map((p) => p.brand))).sort();
  const sizes = Array.from(new Set(products.flatMap((p) => p.sizes))).slice(0, 14);

  return {
    categoryCounts,
    brandCounts,
    brands,
    sizes,
  };
}

export const RECENTLY_VIEWED_LIMIT = 5;

export function parseStoredProductIds(
  raw: string | null,
  limit = RECENTLY_VIEWED_LIMIT
): string[] {
  if (!raw || limit <= 0) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of parsed) {
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed && !seen.has(trimmed)) {
          seen.add(trimmed);
          result.push(trimmed);
          if (result.length >= limit) break;
        }
      }
    }
    return result;
  } catch {
    return [];
  }
}

export function recordRecentlyViewedProductId(
  existingIds: string[],
  productId: string,
  limit = RECENTLY_VIEWED_LIMIT
): string[] {
  const cleanId = productId.trim();
  if (!cleanId || limit <= 0) return existingIds.slice(0, Math.max(0, limit));
  const deduped = existingIds.filter((id) => id && id !== cleanId);
  return [cleanId, ...deduped].slice(0, limit);
}

export function resolveRecentlyViewedProducts(
  products: Product[],
  ids: string[],
  limit = RECENTLY_VIEWED_LIMIT
): Product[] {
  if (limit <= 0 || ids.length === 0 || products.length === 0) return [];
  const byId = new Map(products.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const resolved: Product[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const match = byId.get(id);
    if (match) {
      seen.add(id);
      resolved.push(match);
      if (resolved.length >= limit) break;
    }
  }
  return resolved;
}
