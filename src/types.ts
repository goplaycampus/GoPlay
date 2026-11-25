export type Language = 'en' | 'bn';

export type SportCategorySlug =
  | 'cricket'
  | 'football'
  | 'badminton-tennis'
  | 'gym-fitness'
  | 'running'
  | 'sportswear'
  | 'swimming-outdoor'
  | 'tech-recovery';

export type AvailabilityStatus = 'In Stock' | 'Pre-order' | 'Out of Stock' | 'Coming Soon';

export type InventoryClass = 'A' | 'B' | 'C' | 'D';

export type StandardOrderStatus =
  | 'Order Received'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Completed'
  | 'Pre-order Pending'
  | 'Supplier Processing'
  | 'Delayed'
  | 'Cancelled'
  | 'Refunded'
  | 'Returned';

export type PreOrderWorkflowStatus =
  | 'Awaiting Confirmation'
  | 'Awaiting Payment'
  | 'Order Confirmed'
  | 'Supplier Processing'
  | 'Sourcing Completed'
  | 'In Transit'
  | 'Received'
  | 'Quality Checked'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Refund Processing'
  | 'Refunded';

export type ProductRequestStatus =
  | 'New Request'
  | 'Reviewing'
  | 'Researching Suppliers'
  | 'Supplier Found'
  | 'Quotation Prepared'
  | 'Quotation Sent'
  | 'Customer Approved'
  | 'Processing'
  | 'Completed'
  | 'Rejected';

export type PaymentMethod = 'Cash on Delivery' | 'Manual Payment Verification';

export type PaymentVerificationStatus =
  | 'Pending Verification'
  | 'COD Upon Delivery'
  | 'Verified'
  | 'Refund Pending'
  | 'Refunded';

export type SupplierStatus = 'Preferred' | 'Backup' | 'Do Not Use';

export type ExpenseCategory =
  | 'Product Purchasing'
  | 'Packaging'
  | 'Delivery'
  | 'Advertising'
  | 'Website Expenses'
  | 'Operational Costs'
  | 'Refunds'
  | 'Other';

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  nameBn: string;
  brand: string;
  category: SportCategorySlug;
  categoryLabel: string;
  model: string;
  description: string;
  descriptionBn: string;
  specifications: ProductSpec[];
  images: string[];
  sizes: string[];
  colors: string[];
  sellingPrice: number;
  discountPrice?: number;
  stockQuantity: number;
  reorderPoint: number;
  inventoryClass: InventoryClass;
  availabilityStatus: AvailabilityStatus;
  deliveryEstimate: string;
  warrantyInfo: string;
  returnEligibility: string;
  countryOfOrigin: string;
  weightDimensions: string;
  featured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isSampleData?: boolean;
  updatedAt: string;
  // Admin-only fields (stripped from public API responses)
  purchaseCost?: number;
  landedCost?: number;
  supplierId?: string;
}

export interface CategoryInfo {
  slug: SportCategorySlug;
  name: string;
  nameBn: string;
  description: string;
  image: string;
  itemFocus: string;
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  image: string;
  unitPrice: number;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  availabilityStatus: AvailabilityStatus;
  deliveryEstimate: string;
}

export interface BangladeshAddress {
  fullName: string;
  phone: string;
  email?: string;
  division: string;
  district: string;
  upazila: string;
  fullAddress: string;
  deliveryInstructions?: string;
}

export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  brand: string;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  unitPrice: number;
  purchaseCostSnapshot?: number;
  availabilityStatus: AvailabilityStatus;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerEmail?: string;
  shippingAddress: BangladeshAddress;
  items: OrderItem[];
  orderType: 'Ready Stock' | 'Pre-order' | 'Mixed';
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentStatus: PaymentVerificationStatus;
  status: StandardOrderStatus;
  preOrderStatus?: PreOrderWorkflowStatus;
  estimatedDeliveryPeriod: string;
  courierName?: string;
  trackingNumber?: string;
  dispatchDate?: string;
  internalNotes?: string;
  refundAmount?: number;
  refundReason?: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotationBreakdown {
  itemCost: number;
  shippingCost: number;
  taxesAndDuties: number;
  serviceFee: number;
  totalQuotedPrice: number;
  validUntil: string;
  estimatedDelivery: string;
  notes?: string;
}

export interface ProductRequest {
  id: string;
  requestNumber: string;
  customerId?: string;
  productName: string;
  brand: string;
  model: string;
  imageUrl?: string;
  uploadedImageDataUrl?: string;
  referenceUrl?: string;
  desiredSpecifications: string;
  preferredSizeColor: string;
  budgetBdt: number;
  customerName: string;
  phone: string;
  email: string;
  additionalNotes?: string;
  status: ProductRequestStatus;
  quotation?: QuotationBreakdown;
  internalAdminNotes?: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface B2BEnquiry {
  id: string;
  enquiryNumber: string;
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
  status: 'New' | 'Reviewing' | 'Quotation Sent' | 'Confirmed' | 'Closed';
  quotedTotalBdt?: number;
  internalNotes?: string;
  createdAt: string;
}

export interface SupplierScorecard {
  authenticityDocs: number;
  priceMargin: number;
  productQuality: number;
  availabilityConsistency: number;
  deliveryReliability: number;
  returnWarranty: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
  categoriesSupplied: SportCategorySlug[];
  wholesaleNotes: string;
  moq: string;
  authenticityDocuments: string;
  deliveryTerms: string;
  returnWarrantyTerms: string;
  scorecard: SupplierScorecard;
  weightedScore: number;
  status: SupplierStatus;
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  orderReference?: string;
  recordedBy: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  value: number;
  minOrderAmount: number;
  active: boolean;
  description: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  approved: boolean;
  createdAt: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  type: 'Restock' | 'Sale' | 'Adjustment' | 'Return';
  quantityChange: number;
  resultingStock: number;
  reference: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  role: 'admin' | 'customer';
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  savedAddresses: BangladeshAddress[];
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  supportPhone: string;
  supportEmail: string;
  whatsappDisplay: string;
  dhakaMetroShipping: number;
  dhakaSuburbShipping: number;
  nationwideShipping: number;
  freeShippingThreshold: number;
  announcementText: string;
  announcementTextBn: string;
  manualPaymentInstructions: string;
}
