import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download, FileText, TrendingUp, TrendingDown, DollarSign, Wallet, PieChart as PieChartIcon, Package, ArrowLeft, BookOpen, History, BarChart3 } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { formatCurrency, cn, isWithinTimeRange, TimeRange } from '../lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CashBox } from '../components/accounting/CashBox';
import { CreditBook } from '../components/accounting/CreditBook';
import { TransactionsList } from '../components/accounting/TransactionsList';
import { FinancialReports } from '../components/accounting/FinancialReports';
import { useLanguage } from '../context/LanguageContext';

export function Accounting() {
  const [activeView, setActiveView] = useState<'main' | 'income_statement' | 'cash_box' | 'credit_book' | 'transactions' | 'financial_reports'>('main');
  const { products, sales, transactions, businessSettings } = useGlobal();
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const filteredSales = useMemo(() => {
    return sales.filter(s => isWithinTimeRange(s.date, timeRange));
  }, [sales, timeRange]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => isWithinTimeRange(t.date, timeRange));
  }, [transactions, timeRange]);

  // --- Calculations ---
  
  // 1. Gross Revenue
  const grossRevenue = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + sale.grandTotal, 0) + 
           filteredTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0); // Include mock sales transactions
  }, [filteredSales, filteredTransactions]);

  // 2. COGS (Cost of Goods Sold)
  const cogs = useMemo(() => {
    let totalCogs = 0;
    // From actual sales records
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        totalCogs += item.cost * item.quantity;
      });
    });
    // Remove mock COGS for mock sales since we removed mock data
    
    return totalCogs;
  }, [filteredSales]);

  // 3. Total Expenses
  const expensesByCategory = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const categories: Record<string, number> = {};
    
    expenses.forEach(exp => {
      const cat = exp.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + exp.amount;
    });
    
    return categories;
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return Object.values(expensesByCategory).reduce((sum: number, val: number) => sum + val, 0);
  }, [expensesByCategory]);

  // 4. Net Income / Profit
  const grossProfit = grossRevenue - cogs;
  const netIncome = grossProfit - totalExpenses;

  // 5. Total Assets
  const stockValue = useMemo(() => {
    return products.reduce((sum, p) => sum + ((p.movingAverageCost || p.cost) * p.quantity), 0);
  }, [products]);
  
    // Calculate liquid cash based on transactions
    const liquidCash = useMemo(() => {
      let balance = 0;
      transactions.forEach(t => {
        if (t.type === 'sale' || t.type === 'income') balance += t.amount;
        else if (t.type === 'purchase' || t.type === 'expense') balance -= t.amount;
        else if (t.type === 'adjustment') balance += t.amount;
      });
      // Add sales that might not be in transactions yet (for mock data consistency)
      const salesNotInTx = sales.reduce((sum: number, sale: any) => sum + sale.paidAmount, 0);
      return balance + salesNotInTx;
    }, [transactions, sales]);
  
  const totalAssets = liquidCash + stockValue;

  // Chart Data dynamically computed from filtered lists
  const chartData = useMemo(() => {
    const dataMap: Record<string, { revenue: number, expenses: number }> = {};
    
    const formatKey = (dateStr: string) => {
      const d = new Date(dateStr);
      if (timeRange === 'today') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (timeRange === 'week' || timeRange === 'month') return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
      return d.toLocaleString('default', { month: 'short' });
    };

    filteredSales.forEach(sale => {
      const key = formatKey(sale.date);
      if (!dataMap[key]) dataMap[key] = { revenue: 0, expenses: 0 };
      dataMap[key].revenue += sale.grandTotal;
    });

    filteredTransactions.forEach(tx => {
      const key = formatKey(tx.date);
      if (!dataMap[key]) dataMap[key] = { revenue: 0, expenses: 0 };
      if (tx.type === 'sale') dataMap[key].revenue += tx.amount;
      if (tx.type === 'expense') dataMap[key].expenses += tx.amount;
    });

    const result = Object.entries(dataMap).map(([name, vals]) => ({
      name,
      revenue: vals.revenue,
      expenses: vals.expenses
    }));

    if (result.length === 0) {
      return [{ name: t('No Data'), revenue: 0, expenses: 0 }];
    }

    return result;
  }, [filteredSales, filteredTransactions, timeRange, t]);

  // Expenses Pie Chart
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name, value
  }));
  
  // Fallback pie data if no expenses
  if (pieData.length === 0) {
    pieData.push({ name: t('No Expenses'), value: 1 });
  }

  // --- Export ---
  const handleDownloadReport = () => {
    const doc = new jsPDF();
    
    // Business Header
    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text(businessSettings.businessName, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    if (businessSettings.ownerName) {
      doc.text(`${t('Owner')}: ${businessSettings.ownerName}`, 14, 28);
      doc.text(businessSettings.phone, 14, 33);
      doc.text(businessSettings.address, 14, 38);
    } else {
      doc.text(businessSettings.phone, 14, 28);
      doc.text(businessSettings.address, 14, 33);
    }
    
    // Report Title
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(t('Income Statement'), 14, 50);
    doc.setFontSize(10);
    doc.text(`${t('Date Generated')}: ${new Date().toLocaleDateString()}`, 14, 57);
    doc.text(`${t('Time Range')}: ${t(timeRange.charAt(0).toUpperCase() + timeRange.slice(1))}`, 14, 62);
    
    let currentY = 75;

    // Income Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t('Income'), 14, currentY);
    doc.setFont('helvetica', 'normal');
    
    autoTable(doc, {
      startY: currentY + 5,
      body: [
        [t('Sales Revenue'), formatCurrency(grossRevenue)],
        [t('Cost of Goods Sold (COGS)'), `-${formatCurrency(cogs)}`],
      ],
      foot: [
        [t('Gross Profit'), formatCurrency(grossProfit)]
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      footStyles: { fontStyle: 'bold', textColor: [15, 23, 42] },
      columnStyles: { 1: { halign: 'right' } }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Expenses Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(t('Operating Expenses'), 14, currentY);
    doc.setFont('helvetica', 'normal');

    const expenseRows = Object.entries(expensesByCategory).map(([cat, amt]) => [
      cat, `-${formatCurrency(amt as number)}`
    ]);

    if (expenseRows.length === 0) {
      expenseRows.push([t('No expenses recorded.'), '']);
    }

    autoTable(doc, {
      startY: currentY + 5,
      body: expenseRows,
      foot: [
        [t('Total Expenses'), `-${formatCurrency(totalExpenses)}`]
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      footStyles: { fontStyle: 'bold', textColor: [15, 23, 42] },
      columnStyles: { 1: { halign: 'right' } }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Net Profit Section
    autoTable(doc, {
      startY: currentY,
      body: [
        [t('Net Profit'), formatCurrency(netIncome)]
      ],
      theme: 'plain',
      styles: { fontSize: 12, cellPadding: 3, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' } }
    });

    doc.save(`income-statement-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (activeView === 'cash_box') {
    return <CashBox onBack={() => setActiveView('main')} />;
  }

  if (activeView === 'credit_book') {
    return <CreditBook onBack={() => setActiveView('main')} />;
  }

  if (activeView === 'transactions') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setActiveView('main')} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('Back to Accounting')}
        </Button>
        <TransactionsList />
      </div>
    );
  }

  if (activeView === 'financial_reports') {
    return <FinancialReports onBack={() => setActiveView('main')} />;
  }

  if (activeView === 'main') {
    return (
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('Accounting')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('Manage your finances, expenses, and reports.')}</p>
        </div>

        {/* Glassmorphism Cash Box */}
        <div 
          className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-emerald-500/90 to-teal-600/90 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 text-white cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => setActiveView('cash_box')}
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-black/10 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-emerald-100 font-medium">{t('Daily Cash Box')}</p>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{formatCurrency(liquidCash)}</h2>
            <div className="mt-6 flex items-center gap-2 text-sm text-emerald-100">
              <span>{t('Click to open Cash Box Ledger & Adjustments')}</span>
            </div>
          </div>
        </div>


        {/* Quick Access Grid */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">{t('Quick Access')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-28 flex flex-col items-center justify-center gap-3 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 shadow-sm transition-all"
              onClick={() => setActiveView('income_statement')}
            >
              <div className="rounded-full bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <FileText className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Income Statement')}</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-28 flex flex-col items-center justify-center gap-3 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 shadow-sm transition-all"
              onClick={() => setActiveView('credit_book')}
            >
              <div className="rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Credit Book')}</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-28 flex flex-col items-center justify-center gap-3 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 hover:border-amber-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 shadow-sm transition-all"
              onClick={() => setActiveView('transactions')}
            >
              <div className="rounded-full bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <History className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Transactions')}</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-28 flex flex-col items-center justify-center gap-3 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 hover:border-purple-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 shadow-sm transition-all"
              onClick={() => setActiveView('financial_reports')}
            >
              <div className="rounded-full bg-purple-100 p-3 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <BarChart3 className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Financial Reports')}</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setActiveView('main')} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('Income Statement')}</h1>
            <p className="text-slate-500 dark:text-slate-400">{t('Detailed overview of business financial health.')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 shadow-sm"
          >
            <option value="today">{t('Today')}</option>
            <option value="week">{t('This Week')}</option>
            <option value="month">{t('This Month')}</option>
            <option value="year">{t('This Year')}</option>
            <option value="all">{t('All Time')}</option>
          </select>
          <Button onClick={handleDownloadReport}>
            <Download className="mr-2 h-4 w-4" />
            {t('Download Report')}
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <Card className="col-span-2 sm:col-span-1 lg:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{t('Gross Revenue')}</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1 break-words">{formatCurrency(grossRevenue)}</p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <DollarSign className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{t('COGS')}</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1 break-words">{formatCurrency(cogs)}</p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Package className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{t('Total Expenses')}</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1 break-words">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{t('Net Income')}</p>
                <p className={cn("text-lg sm:text-2xl font-bold mt-1 break-words", netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                  {formatCurrency(netIncome)}
                </p>
              </div>
              <div className={cn("h-8 w-8 sm:h-12 sm:w-12 rounded-full flex items-center justify-center", netIncome >= 0 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400")}>
                {netIncome >= 0 ? <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6" /> : <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{t('Total Assets')}</p>
                <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1 break-words">{formatCurrency(totalAssets)}</p>
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Wallet className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income Statement */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('Income Statement')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Income */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50 uppercase tracking-wider mb-3">{t('Income')}</h4>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">{t('Sales Revenue')}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{formatCurrency(grossRevenue)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">{t('Cost of Sales (COGS)')}</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">-{formatCurrency(cogs)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-900 dark:text-slate-50">{t('Gross Profit')}</span>
                  <span className="text-slate-900 dark:text-slate-50">{formatCurrency(grossProfit)}</span>
                </div>
              </div>

              {/* Operating Expenses */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50 uppercase tracking-wider mb-3">{t('Operating Expenses')}</h4>
                {Object.entries(expensesByCategory).length > 0 ? (
                  Object.entries(expensesByCategory).map(([category, amount]) => (
                    <div key={category} className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600 dark:text-slate-400">{category}</span>
                      <span className="font-medium text-rose-600 dark:text-rose-400">-{formatCurrency(amount as number)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500 italic mb-2">{t('No expenses recorded.')}</div>
                )}
                
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-900 dark:text-slate-50">{t('Total Expenses')}</span>
                  <span className="text-rose-600 dark:text-rose-400">-{formatCurrency(totalExpenses)}</span>
                </div>
              </div>

              {/* Net Profit */}
              <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-50">{t('Net Profit')}</span>
                  <span className={cn("text-lg font-bold", netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {formatCurrency(netIncome)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('Revenue vs Expenses')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `৳${value/1000}k`} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [formatCurrency(value), undefined]}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" dataKey="revenue" name={t('Revenue')} stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="expenses" name={t('Expenses')} stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('Expenses by Category')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
