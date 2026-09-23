import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product, Supplier, Customer, HistoryLog, Payable, Receivable, SaleRecord, PurchaseRecord, Transaction, Staff, Attendance, Payroll, Roster, AppNotification, UserRole, User, BusinessSettings } from '../types';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

interface GlobalState {
  currentUserRole: UserRole;
  setCurrentUserRole: React.Dispatch<React.SetStateAction<UserRole>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  businessSettings: BusinessSettings;
  setBusinessSettings: React.Dispatch<React.SetStateAction<BusinessSettings>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  historyLogs: HistoryLog[];
  setHistoryLogs: React.Dispatch<React.SetStateAction<HistoryLog[]>>;
  payables: Payable[];
  setPayables: React.Dispatch<React.SetStateAction<Payable[]>>;
  receivables: Receivable[];
  setReceivables: React.Dispatch<React.SetStateAction<Receivable[]>>;
  sales: SaleRecord[];
  setSales: React.Dispatch<React.SetStateAction<SaleRecord[]>>;
  purchases: PurchaseRecord[];
  setPurchases: React.Dispatch<React.SetStateAction<PurchaseRecord[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  attendance: Attendance[];
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
  rosters: Roster[];
  setRosters: React.Dispatch<React.SetStateAction<Roster[]>>;
  payroll: Payroll[];
  setPayroll: React.Dispatch<React.SetStateAction<Payroll[]>>;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
}

const GlobalContext = createContext<GlobalState | undefined>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [currentUserRole, setCurrentUserRole] = useLocalStorage<UserRole>('app_currentUserRole', 'admin');
  
  const [users, setUsers] = useLocalStorage<User[]>('app_users', [
    { id: 'U001', name: 'Admin User', username: 'admin', password: 'password123', role: 'admin', status: 'active', lastLogin: new Date().toISOString() },
    { id: 'U002', name: 'Staff User', username: 'staff', password: 'password123', role: 'staff', status: 'active', lastLogin: new Date().toISOString() }
  ]);
  
  const [businessSettings, setBusinessSettings] = useLocalStorage<BusinessSettings>('app_businessSettings', {
    businessName: 'Nexus Pharmacy',
    ownerName: 'John Doe',
    currency: 'BDT',
    taxPercentage: 10,
    timezone: 'Asia/Dhaka',
    address: '123 Business Rd, Tech City',
    phone: '+1 234 567 8900',
    email: 'contact@nexus.com'
  });
  
  const [products, setProducts] = useLocalStorage<Product[]>('app_products', []);
  const [categories, setCategories] = useLocalStorage<string[]>('app_categories', ['Electronics', 'Clothing', 'Food', 'Furniture', 'Other']);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('app_suppliers', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('app_customers', []);
  
  const [historyLogs, setHistoryLogs] = useLocalStorage<HistoryLog[]>('app_historyLogs', [
    {
      id: 'H001',
      date: new Date().toISOString(),
      module: 'system',
      action: 'System Init',
      description: 'System initialized',
      user: 'Admin',
    }
  ]);
  
  const [payables, setPayables] = useLocalStorage<Payable[]>('app_payables', []);
  const [receivables, setReceivables] = useLocalStorage<Receivable[]>('app_receivables', []);
  const [sales, setSales] = useLocalStorage<SaleRecord[]>('app_sales', []);
  const [purchases, setPurchases] = useLocalStorage<PurchaseRecord[]>('app_purchases', []);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('app_transactions', []);
  const [staff, setStaff] = useLocalStorage<Staff[]>('app_staff', []);
  const [attendance, setAttendance] = useLocalStorage<Attendance[]>('app_attendance', []);
  const [rosters, setRosters] = useLocalStorage<Roster[]>('app_rosters', []);
  const [payroll, setPayroll] = useLocalStorage<Payroll[]>('app_payroll', []);
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>('app_notifications', []);
  useEffect(() => {
    let needsUpdate = false;
    const updatedProducts = products.map(p => {
      if (p.movingAverageCost === undefined || !p.costHistory) {
        needsUpdate = true;
        return {
          ...p,
          movingAverageCost: p.cost,
          costHistory: [{ date: p.lastRestocked || new Date().toISOString(), cost: p.cost, quantity: p.quantity }]
        };
      }
      return p;
    });
    if (needsUpdate) {
      setProducts(updatedProducts);
    }
  }, [products, setProducts]);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        products,
        setProducts,
        categories,
        setCategories,
        suppliers,
        setSuppliers,
        customers,
        setCustomers,
        historyLogs,
        setHistoryLogs,
        payables,
        setPayables,
        receivables,
        setReceivables,
        sales,
        setSales,
        purchases,
        setPurchases,
        transactions,
        setTransactions,
        staff,
        setStaff,
        attendance,
        setAttendance,
        rosters,
        setRosters,
        payroll,
        setPayroll,
        notifications,
        setNotifications,
        addNotification,
        currentUserRole,
        setCurrentUserRole,
        users,
        setUsers,
        businessSettings,
        setBusinessSettings,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobal() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
}
