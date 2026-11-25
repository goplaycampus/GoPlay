import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSalesReportCsv,
  buildSalesReportFilename,
  calculateCartTotals,
  calculateDiscountPct,
  calculateFinancialSummary,
  calculateGrossMarginPct,
  calculateLandedCost,
  calculateSalesReport,
  calculateSupplierWeightedScore,
  computeShopFilterFacets,
  escapeCsvCell,
  filterAndSortShopProducts,
  formatBDT,
  formatSalesPeriodLabel,
  getCartUpsellSuggestions,
  getCatalogPriceBounds,
  getComplementaryProducts,
  normalizeBangladeshPhone,
  parseStoredProductIds,
  RECENTLY_VIEWED_LIMIT,
  recordRecentlyViewedProductId,
  resolveRecentlyViewedProducts,
  validateBangladeshPhone,
} from './commerce';
import type { CartItem, Coupon, Expense, Order, Product } from '../types';

test('Bangladesh phone validation accepts standard 01X and +8801X formats', () => {
  assert.equal(validateBangladeshPhone('01711223344'), true);
  assert.equal(validateBangladeshPhone('+880 1812-345678'), true);
  assert.equal(validateBangladeshPhone('8801911223344'), true);
  assert.equal(validateBangladeshPhone('01211223344'), false);
  assert.equal(validateBangladeshPhone('017112233'), false);
  assert.equal(normalizeBangladeshPhone('01711-223344'), '+8801711223344');
});

test('BDT formatting renders clean tabular currency string', () => {
  assert.equal(formatBDT(1850), '৳1,850');
  assert.equal(formatBDT(150000), '৳150,000');
});

test('Landed cost and gross margin calculations follow Blueprint formula', () => {
  const landed = calculateLandedCost(1200, 80, 120, 40);
  assert.equal(landed, 1440);
  assert.equal(calculateGrossMarginPct(1800, landed), 20.0);
});

test('Supplier weighted scorecard derives Preferred, Backup, and Do Not Use statuses', () => {
  const preferred = calculateSupplierWeightedScore({
    authenticityDocs: 5,
    priceMargin: 4,
    productQuality: 5,
    availabilityConsistency: 4,
    deliveryReliability: 4,
    returnWarranty: 4,
  });
  assert.equal(preferred.score, 4.45);
  assert.equal(preferred.status, 'Preferred');

  const backup = calculateSupplierWeightedScore({
    authenticityDocs: 3,
    priceMargin: 3,
    productQuality: 4,
    availabilityConsistency: 3,
    deliveryReliability: 3,
    returnWarranty: 3,
  });
  assert.equal(backup.status, 'Backup');

  const reject = calculateSupplierWeightedScore({
    authenticityDocs: 2,
    priceMargin: 2,
    productQuality: 2,
    availabilityConsistency: 2,
    deliveryReliability: 2,
    returnWarranty: 2,
  });
  assert.equal(reject.status, 'Do Not Use');
});

test('Cart totals compute discounts, free delivery threshold, and mixed order types', () => {
  const items: CartItem[] = [
    {
      productId: 'p1',
      sku: 'GPL-CRI-BAT-001',
      name: 'Kashmir Willow Bat',
      brand: 'GoPlay Pro',
      image: '',
      unitPrice: 2000,
      quantity: 2,
      selectedSize: 'SH',
      selectedColor: 'Natural',
      availabilityStatus: 'In Stock',
      deliveryEstimate: '2-3 days',
    },
  ];
  const coupon: Coupon = {
    id: 'c1',
    code: 'GOPLAY10',
    discountType: 'percent',
    value: 10,
    minOrderAmount: 1000,
    active: true,
    description: '10% off',
  };

  const result = calculateCartTotals(items, 'Dhaka', 'Dhaka Metro', coupon);
  assert.equal(result.subtotal, 4000);
  assert.equal(result.discountAmount, 400);
  assert.equal(result.deliveryCharge, 0); // 3600 >= 3500 threshold
  assert.equal(result.totalAmount, 3600);
  assert.equal(result.orderType, 'Ready Stock');
  assert.equal(result.couponApplied, true);
});

test('Financial summary separates pre-order advances from earned revenue and avoids double-counting inventory purchases', () => {
  const orders: Order[] = [
    {
      id: 'o1',
      orderNumber: 'ORD-GPL-101',
      shippingAddress: {
        fullName: 'Test',
        phone: '+8801711223344',
        division: 'Dhaka',
        district: 'Dhaka Metro',
        upazila: 'Dhanmondi',
        fullAddress: 'House 10',
      },
      items: [
        {
          productId: 'p1',
          sku: 'GPL-CRI-BAT-001',
          name: 'Bat',
          brand: 'Brand',
          quantity: 1,
          selectedSize: 'SH',
          selectedColor: 'Natural',
          unitPrice: 2000,
          purchaseCostSnapshot: 1400,
          availabilityStatus: 'In Stock',
        },
      ],
      orderType: 'Ready Stock',
      subtotal: 2000,
      discountAmount: 0,
      deliveryCharge: 70,
      totalAmount: 2070,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'COD Upon Delivery',
      status: 'Confirmed',
      estimatedDeliveryPeriod: '2-3 days',
      statusHistory: [],
      createdAt: '2026-11-20T10:00:00Z',
      updatedAt: '2026-11-20T10:00:00Z',
    },
    {
      id: 'o2',
      orderNumber: 'ORD-GPL-102',
      shippingAddress: {
        fullName: 'Test 2',
        phone: '+8801811223344',
        division: 'Sylhet',
        district: 'Sylhet',
        upazila: 'Sylhet Sadar',
        fullAddress: 'Kumargaon',
      },
      items: [
        {
          productId: 'p2',
          sku: 'GPL-BAD-RKT-001',
          name: 'Racket',
          brand: 'Brand',
          quantity: 1,
          selectedSize: '4U',
          selectedColor: 'Black',
          unitPrice: 5000,
          purchaseCostSnapshot: 3800,
          availabilityStatus: 'Pre-order',
        },
      ],
      orderType: 'Pre-order',
      subtotal: 5000,
      discountAmount: 0,
      deliveryCharge: 130,
      totalAmount: 5130,
      paymentMethod: 'Manual Payment Verification',
      paymentStatus: 'Verified',
      status: 'Supplier Processing',
      preOrderStatus: 'Supplier Processing',
      estimatedDeliveryPeriod: '10-14 days',
      statusHistory: [],
      createdAt: '2026-11-21T10:00:00Z',
      updatedAt: '2026-11-21T10:00:00Z',
    },
  ];

  const expenses: Expense[] = [
    {
      id: 'e1',
      date: '2026-11-20',
      category: 'Product Purchasing',
      description: 'Batch restock',
      amount: 10000,
      recordedBy: 'Admin',
      createdAt: '2026-11-20T09:00:00Z',
    },
    {
      id: 'e2',
      date: '2026-11-20',
      category: 'Packaging',
      description: 'Boxes & tape',
      amount: 300,
      recordedBy: 'Admin',
      createdAt: '2026-11-20T09:00:00Z',
    },
  ];

  const products: Product[] = [
    {
      id: 'p1',
      sku: 'GPL-CRI-BAT-001',
      name: 'Bat',
      nameBn: 'ব্যাট',
      brand: 'Brand',
      category: 'cricket',
      categoryLabel: 'Cricket',
      model: 'M1',
      description: 'Desc',
      descriptionBn: 'বিবরণ',
      specifications: [],
      images: [],
      sizes: ['SH'],
      colors: ['Natural'],
      sellingPrice: 2000,
      purchaseCost: 1400,
      stockQuantity: 3,
      reorderPoint: 4,
      inventoryClass: 'A',
      availabilityStatus: 'In Stock',
      deliveryEstimate: '2-3 days',
      warrantyInfo: 'None',
      returnEligibility: '7 days',
      countryOfOrigin: 'Pakistan',
      weightDimensions: '1.2 kg',
      updatedAt: '2026-11-20',
    },
  ];

  const summary = calculateFinancialSummary(orders, expenses, products);
  assert.equal(summary.earnedRevenue, 2070);
  assert.equal(summary.heldPreOrderAdvances, 5130);
  assert.equal(summary.estimatedCOGS, 1400);
  assert.equal(summary.operatingExpenses, 300);
  assert.equal(summary.grossProfit, 670);
  assert.equal(summary.estimatedOperatingProfit, 370);
  assert.equal(summary.inventoryCostValue, 4200);
  assert.equal(summary.lowStockCount, 1);
  assert.equal(summary.pendingPreOrdersCount, 1);
});

test('Sales report handles empty orders cleanly', () => {
  const report = calculateSalesReport([], []);
  assert.equal(report.totalMatchingOrders, 0);
  assert.equal(report.activeOrderCount, 0);
  assert.equal(report.grossOrderVolume, 0);
  assert.equal(report.averageOrderValue, 0);
  assert.equal(report.cancellationRatePct, 0);
  assert.deepEqual(report.dailySeries, []);
  assert.deepEqual(report.topCategories, []);
  assert.deepEqual(report.topProducts, []);
});

test('Sales report aggregates daily revenue, AOV, top categories (with SKU fallback), divisions, and filters', () => {
  const products: Product[] = [
    {
      id: 'p1',
      sku: 'GPL-CRI-BAT-001',
      name: 'Kashmir Willow Bat',
      nameBn: 'ব্যাট',
      brand: 'GoPlay Pro',
      category: 'cricket',
      categoryLabel: 'Cricket',
      model: 'KW-1',
      description: 'Bat',
      descriptionBn: 'ব্যাট',
      specifications: [],
      images: [],
      sizes: ['SH'],
      colors: ['Natural'],
      sellingPrice: 2500,
      stockQuantity: 10,
      reorderPoint: 3,
      inventoryClass: 'A',
      availabilityStatus: 'In Stock',
      deliveryEstimate: '2-3 days',
      warrantyInfo: 'None',
      returnEligibility: '7 days',
      countryOfOrigin: 'Pakistan',
      weightDimensions: '1.2 kg',
      updatedAt: '2026-11-20',
    },
  ];

  const makeOrder = (overrides: Partial<Order>): Order => ({
    id: 'o-default',
    orderNumber: 'ORD-GPL-000',
    shippingAddress: {
      fullName: 'Customer',
      phone: '+8801711223344',
      division: 'Dhaka',
      district: 'Dhaka Metro',
      upazila: 'Gulshan',
      fullAddress: 'Road 1',
    },
    items: [],
    orderType: 'Ready Stock',
    subtotal: 0,
    discountAmount: 0,
    deliveryCharge: 0,
    totalAmount: 0,
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'COD Upon Delivery',
    status: 'Confirmed',
    estimatedDeliveryPeriod: '2-3 days',
    statusHistory: [],
    createdAt: '2026-11-21T10:00:00Z',
    updatedAt: '2026-11-21T10:00:00Z',
    ...overrides,
  });

  const orders: Order[] = [
    makeOrder({
      id: 'o1',
      orderNumber: 'ORD-GPL-101',
      createdAt: '2026-11-10T09:00:00Z',
      totalAmount: 2500,
      subtotal: 2500,
      items: [
        {
          productId: 'p1',
          sku: 'GPL-CRI-BAT-001',
          name: 'Kashmir Willow Bat',
          brand: 'GoPlay Pro',
          quantity: 1,
          selectedSize: 'SH',
          selectedColor: 'Natural',
          unitPrice: 2500,
          availabilityStatus: 'In Stock',
        },
      ],
    }),
    makeOrder({
      id: 'o2',
      orderNumber: 'ORD-GPL-102',
      createdAt: '2026-11-21T11:00:00Z',
      orderType: 'Pre-order',
      status: 'Supplier Processing',
      paymentMethod: 'Manual Payment Verification',
      paymentStatus: 'Verified',
      shippingAddress: {
        fullName: 'Sylhet Buyer',
        phone: '+8801811223344',
        division: 'Sylhet',
        district: 'Sylhet',
        upazila: 'Sylhet Sadar',
        fullAddress: 'Kumargaon',
      },
      totalAmount: 6000,
      subtotal: 6000,
      items: [
        {
          // Product not in products array -> must fall back to SKU code FTB -> Football
          productId: 'deleted-prod',
          sku: 'GPL-FTB-BOT-009',
          name: 'Pro Match Boots',
          brand: 'Vector',
          quantity: 2,
          selectedSize: '42',
          selectedColor: 'Lime',
          unitPrice: 3000,
          availabilityStatus: 'Pre-order',
        },
      ],
    }),
    makeOrder({
      id: 'o3',
      orderNumber: 'ORD-GPL-103',
      createdAt: '2026-11-21T15:00:00Z',
      totalAmount: 1500,
      subtotal: 1500,
      items: [
        {
          productId: 'p1',
          sku: 'GPL-CRI-BAT-001',
          name: 'Kashmir Willow Bat',
          brand: 'GoPlay Pro',
          quantity: 1,
          selectedSize: 'SH',
          selectedColor: 'Natural',
          unitPrice: 1500,
          availabilityStatus: 'In Stock',
        },
      ],
    }),
    makeOrder({
      id: 'o4',
      orderNumber: 'ORD-GPL-104',
      createdAt: '2026-11-21T18:00:00Z',
      status: 'Cancelled',
      totalAmount: 9000,
      subtotal: 9000,
      items: [
        {
          productId: 'p99',
          sku: 'GPL-BAD-RKT-001',
          name: 'Cancelled Racket',
          brand: 'Yonex',
          quantity: 1,
          selectedSize: '4U',
          selectedColor: 'Black',
          unitPrice: 9000,
          availabilityStatus: 'In Stock',
        },
      ],
    }),
  ];

  const allReport = calculateSalesReport(orders, products, {
    dateRange: 'all',
    orderType: 'all',
    referenceDate: new Date('2026-11-22T00:00:00Z'),
  });

  // 4 total matching, 3 active, 1 cancelled -> 25% cancellation rate
  assert.equal(allReport.totalMatchingOrders, 4);
  assert.equal(allReport.activeOrderCount, 3);
  assert.equal(allReport.cancelledOrRefundedCount, 1);
  assert.equal(allReport.cancellationRatePct, 25);

  // Gross order volume = 2500 + 6000 + 1500 = 10000; AOV = round(10000 / 3) = 3333
  assert.equal(allReport.grossOrderVolume, 10000);
  assert.equal(allReport.earnedRevenue, 4000);
  assert.equal(allReport.heldPreOrderAdvances, 6000);
  assert.equal(allReport.averageOrderValue, 3333);
  assert.equal(allReport.totalUnitsSold, 4);

  // Daily series chronologically sorted: Nov 10 (2500, 1 order), Nov 21 (7500, 2 orders, AOV 3750)
  assert.equal(allReport.dailySeries.length, 2);
  assert.equal(allReport.dailySeries[0].date, '2026-11-10');
  assert.equal(allReport.dailySeries[0].revenue, 2500);
  assert.equal(allReport.dailySeries[1].date, '2026-11-21');
  assert.equal(allReport.dailySeries[1].revenue, 7500);
  assert.equal(allReport.dailySeries[1].orders, 2);
  assert.equal(allReport.dailySeries[1].aov, 3750);

  // Top categories: Football (6000, 60%) > Cricket (4000, 40%)
  assert.equal(allReport.topCategories.length, 2);
  assert.equal(allReport.topCategories[0].categoryLabel, 'Football');
  assert.equal(allReport.topCategories[0].revenue, 6000);
  assert.equal(allReport.topCategories[0].unitsSold, 2);
  assert.equal(allReport.topCategories[0].sharePct, 60);
  assert.equal(allReport.topCategories[1].categoryLabel, 'Cricket');
  assert.equal(allReport.topCategories[1].revenue, 4000);
  assert.equal(allReport.topCategories[1].orderCount, 2);

  // 7-day window ending 2026-11-22 excludes Nov 10 order
  const last7 = calculateSalesReport(orders, products, {
    dateRange: '7d',
    orderType: 'all',
    referenceDate: new Date('2026-11-22T00:00:00Z'),
  });
  assert.equal(last7.activeOrderCount, 2);
  assert.equal(last7.grossOrderVolume, 7500);

  // Order type filter: Ready Stock only
  const readyOnly = calculateSalesReport(orders, products, {
    dateRange: 'all',
    orderType: 'Ready Stock',
    referenceDate: new Date('2026-11-22T00:00:00Z'),
  });
  assert.equal(readyOnly.activeOrderCount, 2);
  assert.equal(readyOnly.grossOrderVolume, 4000);

  // Customer retention & order type breakdown
  // o1 & o3 share +8801711223344 -> 2 unique customers (o1+o3, o2), 1 repeat -> 50%
  assert.equal(allReport.uniqueCustomerCount, 2);
  assert.equal(allReport.repeatCustomerCount, 1);
  assert.equal(allReport.repeatCustomerRatePct, 50);
  assert.equal(allReport.orderTypeBreakdown.length, 2);
  assert.equal(allReport.statusBreakdown.length, 3);

  // Custom date range filter
  const customRange = calculateSalesReport(orders, products, {
    dateRange: 'custom',
    startDate: '2026-11-09',
    endDate: '2026-11-15',
  });
  assert.equal(customRange.activeOrderCount, 1);
  assert.equal(customRange.grossOrderVolume, 2500);
});

test('Discount percentage, complementary products, and cart upsell helpers behave accurately', () => {
  assert.equal(calculateDiscountPct(3650, 3390), 7);
  assert.equal(calculateDiscountPct(1000, 1000), 0);
  assert.equal(calculateDiscountPct(1000, undefined), 0);

  const makeProd = (id: string, cat: Product['category'], price: number, status: Product['availabilityStatus'] = 'In Stock'): Product => ({
    id,
    sku: `GPL-${id}`,
    name: `Item ${id}`,
    nameBn: `Item ${id}`,
    brand: 'GoPlay',
    category: cat,
    categoryLabel: cat,
    model: 'M1',
    description: 'D',
    descriptionBn: 'D',
    specifications: [],
    images: [],
    sizes: ['Standard'],
    colors: ['Black'],
    sellingPrice: price,
    stockQuantity: status === 'In Stock' ? 5 : 0,
    reorderPoint: 2,
    inventoryClass: 'A',
    availabilityStatus: status,
    deliveryEstimate: '2-3 days',
    warrantyInfo: 'None',
    returnEligibility: '7 days',
    countryOfOrigin: 'BD',
    weightDimensions: '0.2 kg',
    updatedAt: '2026-11-20',
  });

  const p1 = makeProd('1', 'cricket', 3000);
  const p2 = makeProd('2', 'cricket', 390);
  const p3 = makeProd('3', 'football', 1200);
  const p4 = makeProd('4', 'running', 2500);
  const p5 = makeProd('5', 'cricket', 500, 'Out of Stock');

  const related = getComplementaryProducts(p1, [p1, p2, p3, p4, p5], 3);
  assert.equal(related.length, 3);
  assert.equal(related[0].id, '2'); // same category prioritized, out-of-stock excluded

  const upsells = getCartUpsellSuggestions(
    [
      {
        productId: '1',
        sku: p1.sku,
        name: p1.name,
        brand: p1.brand,
        image: '',
        unitPrice: 3000,
        quantity: 1,
        selectedSize: 'Standard',
        selectedColor: 'Black',
        availabilityStatus: 'In Stock',
        deliveryEstimate: '2-3 days',
      },
    ],
    [p1, p2, p3, p4, p5],
    2
  );
  assert.deepEqual(upsells.map((u) => u.id), ['2', '3']);
});

test('Sales report period labels, filenames, CSV escaping, and multi-section CSV export', () => {
  assert.equal(formatSalesPeriodLabel({ dateRange: '7d' }), 'Weekly (Last 7 Days)');
  assert.equal(formatSalesPeriodLabel({ dateRange: '30d' }), 'Monthly (Last 30 Days)');
  assert.equal(
    formatSalesPeriodLabel({ dateRange: 'custom', startDate: '2026-11-01', endDate: '2026-11-15' }),
    'Custom (2026-11-01 to 2026-11-15)'
  );
  assert.equal(formatSalesPeriodLabel({ dateRange: 'all' }), 'All Time');

  const ref = new Date('2026-11-24T12:00:00Z');
  assert.equal(
    buildSalesReportFilename('7d', 'csv', undefined, undefined, ref),
    'goplay-sales-report-weekly-7d-2026-11-24.csv'
  );
  assert.equal(
    buildSalesReportFilename('30d', 'csv', undefined, undefined, ref),
    'goplay-sales-report-monthly-30d-2026-11-24.csv'
  );

  // CSV escaping handles commas, quotes, and formula-injection prefixes
  assert.equal(escapeCsvCell('Bat, Pro "Edition"'), '"Bat, Pro ""Edition"""');
  assert.equal(escapeCsvCell('=SUM(A1:A2)'), "'=SUM(A1:A2)");
  assert.equal(escapeCsvCell(3780), '3780');

  const report = calculateSalesReport(
    [
      {
        id: 'o1',
        orderNumber: 'ORD-GPL-501',
        shippingAddress: {
          fullName: 'Ariyan, Dhaka',
          phone: '+8801711223344',
          division: 'Dhaka',
          district: 'Dhaka Metro',
          upazila: 'Banani',
          fullAddress: 'Road 11',
        },
        items: [
          {
            productId: 'p1',
            sku: 'GPL-CRI-BAT-001',
            name: 'Kashmir Willow "Pro" Bat',
            brand: 'GoPlay Select',
            quantity: 2,
            selectedSize: 'SH',
            selectedColor: 'Natural',
            unitPrice: 1800,
            availabilityStatus: 'In Stock',
          },
        ],
        orderType: 'Ready Stock',
        subtotal: 3600,
        discountAmount: 0,
        deliveryCharge: 0,
        totalAmount: 3600,
        paymentMethod: 'Cash on Delivery',
        paymentStatus: 'COD Upon Delivery',
        status: 'Delivered',
        estimatedDeliveryPeriod: '2-3 days',
        statusHistory: [],
        createdAt: '2026-11-21T10:00:00Z',
        updatedAt: '2026-11-21T10:00:00Z',
      },
    ],
    []
  );

  const csv = buildSalesReportCsv(report, {
    periodLabel: 'Weekly (Last 7 Days)',
    orderType: 'all',
    generatedAt: '2026-11-24T12:00:00.000Z',
  });

  assert.match(csv, /GoPlay Bangladesh — Sales Performance Report/);
  assert.match(csv, /Reporting Period,Weekly \(Last 7 Days\)/);
  assert.match(csv, /Gross Order Volume \(BDT\),3600/);
  assert.match(csv, /Daily Performance/);
  assert.match(csv, /2026-11-21,1,2,3600,3600,3600/);
  assert.match(csv, /Top-Selling Categories/);
  assert.match(csv, /Cricket,1,2,3600,100/);
  assert.match(csv, /Top-Selling Products/);
  assert.match(csv, /"Kashmir Willow ""Pro"" Bat"/);
  assert.match(csv, /Sales by Bangladesh Division/);
  assert.match(csv, /Order Model Split/);
  assert.match(csv, /Payment Method Split/);
  assert.match(csv, /Fulfillment Status Distribution/);
});

test('ShopPage filter engine handles multi-category, min-max price range, multi-brand, and facet counts', () => {
  const makeProd = (
    id: string,
    category: Product['category'],
    brand: string,
    sellingPrice: number,
    discountPrice?: number
  ): Product => ({
    id,
    sku: `GPL-${id}`,
    name: `Gear ${id}`,
    nameBn: `গিয়ার ${id}`,
    brand,
    category,
    categoryLabel: category,
    model: 'M1',
    description: 'Desc',
    descriptionBn: 'বিবরণ',
    specifications: [],
    images: [],
    sizes: ['Standard'],
    colors: ['Black'],
    sellingPrice,
    discountPrice,
    stockQuantity: 5,
    reorderPoint: 2,
    inventoryClass: 'A',
    availabilityStatus: 'In Stock',
    deliveryEstimate: '2-3 days',
    warrantyInfo: 'None',
    returnEligibility: '7 days',
    countryOfOrigin: 'BD',
    weightDimensions: '0.5 kg',
    updatedAt: '2026-11-20',
  });

  const catalog = [
    makeProd('1', 'cricket', 'GoPlay Select', 3650, 3390),
    makeProd('2', 'cricket', 'Strikeline', 1890),
    makeProd('3', 'football', 'Veloce Pitch', 2150, 1950),
    makeProd('4', 'running', 'GoPlay Select', 950),
  ];

  const bounds = getCatalogPriceBounds(catalog);
  assert.equal(bounds.min, 0);
  assert.equal(bounds.max, 5000);

  const baseFilter = {
    categories: [] as string[],
    brands: [] as string[],
    availability: 'all',
    size: 'all',
    minPrice: 0,
    maxPrice: 5000,
    quickPreset: 'all' as const,
    searchQuery: '',
    sortBy: 'price-asc' as const,
  };

  // Multi-category + price range (effective price uses discountPrice 3390 & 1950)
  const multiCat = filterAndSortShopProducts(catalog, {
    ...baseFilter,
    categories: ['cricket', 'football'],
    minPrice: 1800,
    maxPrice: 2500,
  });
  assert.deepEqual(
    multiCat.map((p) => p.id),
    ['2', '3']
  );

  // Multi-brand filter
  const multiBrand = filterAndSortShopProducts(catalog, {
    ...baseFilter,
    brands: ['GoPlay Select', 'Veloce Pitch'],
  });
  assert.deepEqual(
    multiBrand.map((p) => p.id),
    ['4', '3', '1']
  );

  // Facets show brand counts scoped to selected category & price window
  const facetsAllBrands = computeShopFilterFacets(catalog, {
    ...baseFilter,
    categories: ['cricket'],
  });
  assert.equal(facetsAllBrands.categoryCounts.cricket, 2);
  assert.equal(facetsAllBrands.categoryCounts.football, 1);

  const facets = computeShopFilterFacets(catalog, {
    ...baseFilter,
    categories: ['cricket'],
    brands: ['Strikeline'],
  });
  assert.equal(facets.categoryCounts.cricket, 1);
  assert.equal(facets.categoryCounts.football, undefined);
  assert.equal(facets.brandCounts['GoPlay Select'], 1);
  assert.equal(facets.brandCounts['Strikeline'], 1);
  assert.equal(facets.brandCounts['Veloce Pitch'], undefined);
});

test('Recently viewed helpers deduplicate, cap at 5, resolve products, and safely parse localStorage', () => {
  assert.equal(RECENTLY_VIEWED_LIMIT, 5);

  let history: string[] = [];
  for (const id of ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']) {
    history = recordRecentlyViewedProductId(history, id);
  }
  // Most recent first, strictly capped at 5
  assert.deepEqual(history, ['p6', 'p5', 'p4', 'p3', 'p2']);

  // Clicking an existing item promotes it to slot 1 without duplicating
  history = recordRecentlyViewedProductId(history, 'p3');
  assert.deepEqual(history, ['p3', 'p6', 'p5', 'p4', 'p2']);

  // Malformed or dirty localStorage payloads are sanitized cleanly
  assert.deepEqual(parseStoredProductIds('not-json'), []);
  assert.deepEqual(parseStoredProductIds('{"bad":true}'), []);
  assert.deepEqual(
    parseStoredProductIds(JSON.stringify(['p3', 42, 'p3', '  ', 'p1', 'p2', 'p4', 'p5', 'p6'])),
    ['p3', 'p1', 'p2', 'p4', 'p5']
  );

  // Catalog resolution skips missing/stale IDs and preserves clicked order
  const makeStub = (id: string): Product => ({
    id,
    sku: `SKU-${id}`,
    name: `Item ${id}`,
    nameBn: '',
    brand: 'GoPlay',
    category: 'cricket',
    categoryLabel: 'Cricket',
    model: id,
    description: '',
    descriptionBn: '',
    specifications: [],
    images: [''],
    sizes: ['Std'],
    colors: ['Black'],
    sellingPrice: 1000,
    stockQuantity: 5,
    reorderPoint: 2,
    inventoryClass: 'A',
    availabilityStatus: 'In Stock',
    deliveryEstimate: '2-3 days',
    warrantyInfo: 'None',
    returnEligibility: '7 days',
    countryOfOrigin: 'BD',
    weightDimensions: '0.5 kg',
    updatedAt: '2026-11-25',
  });

  const catalog = [makeStub('p1'), makeStub('p2'), makeStub('p3'), makeStub('p5'), makeStub('p6')];
  const resolved = resolveRecentlyViewedProducts(catalog, ['p3', 'missing-id', 'p6', 'p5', 'p2', 'p1']);
  assert.deepEqual(
    resolved.map((p) => p.id),
    ['p3', 'p6', 'p5', 'p2', 'p1']
  );
});



