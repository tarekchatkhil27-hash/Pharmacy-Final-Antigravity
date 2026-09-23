export interface ProductBatch {
  id: string;
  batchNumber: string;
  quantity: number;
  cost: number;
  addedBy: string;
  date: string;
  supplierId?: string;
}

export interface Product {
  id: string;
  name: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  sku: string;
  brand?: string;
  category: string;
  size?: string;
  color?: string;
  design?: string;
  price: number;
  cost: number;
  movingAverageCost?: number;
  costHistory?: { date: string; cost: number; quantity: number }[];
  quantity: number;
  unit: string;
  minThreshold: number;
  batchNumber?: string;
  addedBy?: string;
  supplierId?: string;
  lastRestocked: string;
  batches?: ProductBatch[];
}

export interface Supplier {
  id: string;
  name: string;
  mobile: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address?: string;
}

export interface HistoryLog {
  id: string;
  date: string;
  module: 'inventory' | 'sales' | 'accounting' | 'hr' | 'system';
  action: string;
  description: string;
  user: string;
}

export interface Payable {
  id: string;
  date: string;
  supplierId?: string;
  supplierName: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'pending' | 'partial' | 'paid';
  relatedEntityId?: string;
}

export interface Receivable {
  id: string;
  date: string;
  customerId?: string;
  customerName: string;
  customerMobile?: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'pending' | 'partial' | 'paid';
  relatedEntityId?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  cost: number;
  quantity: number;
  discount: number;
  discountType: 'percent' | 'flat';
}

export interface SaleRecord {
  id: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentOption: 'full' | 'partial';
  paymentMethod: string;
  paidAmount: number;
  customerId?: string;
  customerName?: string;
  customerMobile?: string;
  customerAddress?: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
  discount: number;
  discountType: 'percent' | 'flat';
}

export interface PurchaseRecord {
  id: string;
  poNumber: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  shipping: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paymentOption: 'full' | 'partial';
  paymentMethod: string;
  paidAmount: number;
  supplierId?: string;
  supplierName: string;
  supplierMobile?: string;
  addedBy?: string;
  batchNumber?: string;
}

export type TransactionType = 'sale' | 'purchase' | 'expense' | 'adjustment' | 'income';

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string; // In a real app, this would be hashed and not sent to client
  role: UserRole;
  status: 'active' | 'inactive';
  lastLogin?: string;
}

export interface BusinessSettings {
  businessName: string;
  ownerName: string;
  currency: string;
  taxPercentage: number;
  timezone: string;
  address: string;
  phone: string;
  email: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  description: string;
  category?: string;
  referenceId?: string; // e.g., order ID or invoice ID
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  paymentMethod?: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  revenueTrend: number; // percentage
  totalExpenses: number;
  expenseTrend: number;
  netProfit: number;
  profitTrend: number;
  totalStockValue: number;
  stockValueTrend: number;
  lowStockCount: number;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  expenses: number;
}

export interface Staff {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  joinDate: string;
  salary: number;
  status: 'active' | 'inactive';
  photoUrl?: string;
  shift: 'Morning' | 'Evening' | 'Night' | 'Flexible';
}

export interface Attendance {
  id: string;
  staffId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
}

export interface Roster {
  id: string;
  staffId: string;
  date: string;
  shift: 'Morning' | 'Evening' | 'Night' | 'Flexible' | 'Off';
}

export interface Payroll {
  id: string;
  staffId: string;
  month: string; // e.g. '2026-04'
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: 'paid' | 'pending';
  paymentDate?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  module?: 'inventory' | 'sales' | 'accounting' | 'hr' | 'system';
}

export interface Medicine {
  'Product Name': string;
  'Generic Name': string;
  'Strength': string;
  'Dosage Form': string;
  'Brand Name': string;
}
