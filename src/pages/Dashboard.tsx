import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PackageX, 
  Wallet,
  Download,
  AlertCircle,
  CreditCard,
  Smartphone,
  Building2,
  Coins,
  History
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency, formatDate, cn, isWithinTimeRange, TimeRange } from '../lib/utils';
import { RevenueCounter } from '../components/accounting/RevenueCounter';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';

export function Dashboard() {
  const { products, sales, transactions, businessSettings } = useGlobal();
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const filteredSales = useMemo(() => {
    return sales.filter(s => isWithinTimeRange(s.date, timeRange));
  }, [sales, timeRange]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => isWithinTimeRange(t.date, timeRange));
  }, [transactions, timeRange]);

  // Calculations
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + sale.grandTotal, 0) + 
           filteredTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
  }, [filteredSales, filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const cogs = useMemo(() => {
    let totalCogs = 0;
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        totalCogs += item.cost * item.quantity;
      });
    });
    // Remove mock COGS for mock sales since we removed mock data
    return totalCogs;
  }, [filteredSales]);

  const netProfit = totalRevenue - cogs - totalExpenses;

  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => sum + ((p.movingAverageCost || p.cost) * p.quantity), 0);
  }, [products]);

  const lowStockProducts = products.filter(p => p.quantity <= p.minThreshold);

  // Mock chart data for now, ideally this would be generated from filteredSales/filteredTransactions grouped by date
  const chartData = [
    { date: 'Mon', revenue: totalRevenue * 0.1, expenses: totalExpenses * 0.1 },
    { date: 'Tue', revenue: totalRevenue * 0.15, expenses: totalExpenses * 0.12 },
    { date: 'Wed', revenue: totalRevenue * 0.2, expenses: totalExpenses * 0.18 },
    { date: 'Thu', revenue: totalRevenue * 0.1, expenses: totalExpenses * 0.15 },
    { date: 'Fri', revenue: totalRevenue * 0.25, expenses: totalExpenses * 0.2 },
    { date: 'Sat', revenue: totalRevenue * 0.15, expenses: totalExpenses * 0.1 },
    { date: 'Sun', revenue: totalRevenue * 0.05, expenses: totalExpenses * 0.15 },
  ];

  const handleDownloadPDF = () => {
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
    doc.text(t('Low Stock Report'), 14, 50);
    doc.setFontSize(10);
    doc.text(`${t('Date')}: ${formatDate(new Date().toISOString())}`, 14, 57);
    
    // Group by brand
    const groupedByBrand = lowStockProducts.reduce((acc, product) => {
      const brand = product.brand || t('No Brand');
      if (!acc[brand]) {
        acc[brand] = [];
      }
      acc[brand].push(product);
      return acc;
    }, {} as Record<string, typeof lowStockProducts>);

    let currentY = 65;

    (Object.entries(groupedByBrand) as [string, typeof lowStockProducts][]).forEach(([brand, products], index) => {
      // Add brand header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${t('Brand')}: ${brand}`, 14, currentY);
      doc.setFont('helvetica', 'normal');

      const tableData = products.map(p => [
        p.sku,
        p.name,
        p.quantity.toString(),
        p.minThreshold.toString(),
        p.supplierId || 'N/A'
      ]);

      autoTable(doc, {
        startY: currentY + 2,
        head: [[t('SKU'), t('Product Name'), t('Current Qty'), t('Min Threshold'), t('Supplier ID')]],
        body: tableData,
        margin: { left: 14 },
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Check if we need a new page
      if (currentY > 270 && index < Object.entries(groupedByBrand).length - 1) {
        doc.addPage();
        currentY = 20;
      }
    });

    doc.save(`low-stock-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('Dashboard')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('Overview of your inventory and financial metrics.')}</p>
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
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-5">
        <MetricCard 
          title={t('Total Revenue')} 
          value={formatCurrency(totalRevenue)} 
          trend={0} 
          icon={DollarSign} 
          timeRange={timeRange}
          colorClass="bg-gradient-to-b from-emerald-400 to-emerald-600"
        />
        <MetricCard 
          title={t('Total Expenses')} 
          value={formatCurrency(totalExpenses)} 
          trend={0} 
          icon={Wallet} 
          timeRange={timeRange}
          colorClass="bg-gradient-to-b from-orange-400 to-orange-600"
        />
        <MetricCard 
          title={t('Net Profit')} 
          value={formatCurrency(netProfit)} 
          trend={0} 
          icon={TrendingUp} 
          timeRange={timeRange}
          colorClass="bg-gradient-to-b from-indigo-400 to-indigo-600"
        />
        <MetricCard 
          title={t('Total Stock Value')} 
          value={formatCurrency(totalStockValue)} 
          trend={0} 
          icon={PackageX} 
          timeRange={timeRange}
          colorClass="bg-gradient-to-b from-blue-400 to-blue-600"
        />
        <MetricCard 
          title={t('Low Stock Items')} 
          value={lowStockProducts.length.toString()} 
          trend={0} 
          icon={AlertCircle} 
          trendText={t('Needs attention')}
          isAlert
          className="col-span-3 sm:col-span-2 md:col-span-1"
          colorClass="bg-gradient-to-b from-red-400 to-red-600"
        />
      </div>

      {/* Revenue Counter Card */}
      <RevenueCounter />

      <div className="grid gap-6 md:grid-cols-7">
        {/* Chart */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>{t('Revenue vs Expenses')}</CardTitle>
            <CardDescription>{t('Financial performance')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#64748b" strokeOpacity={0.1} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `৳${value}`} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: '1px solid rgba(255,255,255,0.2)', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                      backgroundColor: 'rgba(255, 255, 255, 0.65)', 
                      backdropFilter: 'blur(16px)',
                      color: '#0f172a'
                    }}
                    itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('Low Stock Alerts')}</CardTitle>
              <CardDescription>{t('Items below minimum threshold')}</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={handleDownloadPDF} title={t('Download PDF Report')}>
              <Download className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(Object.entries(lowStockProducts.reduce((acc, product) => {
                const brand = product.brand || t('No Brand');
                if (!acc[brand]) acc[brand] = [];
                acc[brand].push(product);
                return acc;
              }, {} as Record<string, typeof lowStockProducts>)) as [string, typeof lowStockProducts][]).map(([brand, products]) => (
                <div key={brand} className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></span>
                    {brand}
                    <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></span>
                  </h4>
                  <div className="space-y-4">
                    {products.map(product => (
                      <div key={product.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-slate-800">
                        <div className="flex items-start space-x-3">
                          <div className="mt-0.5 rounded-full bg-red-100 p-1.5 dark:bg-red-900/30">
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-none text-slate-900 dark:text-slate-50">{product.name}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {product.quantity} {t('left')} ({t('Min:')} {product.minThreshold})
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="secondary">{t('Restock')}</Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">{t('All stock levels are optimal.')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Recent Activity')}</CardTitle>
          <CardDescription>{t('Latest transactions across your business')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {filteredTransactions.slice(0, 10).map((txn) => (
              <div key={txn.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    txn.type === 'sale' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    txn.type === 'expense' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                    txn.type === 'purchase' ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  )}>
                    {txn.type === 'sale' ? <TrendingUp className="h-5 w-5" /> :
                     txn.type === 'expense' ? <TrendingDown className="h-5 w-5" /> :
                     txn.type === 'purchase' ? <PackageX className="h-5 w-5" /> :
                     <Wallet className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{txn.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(txn.date)}</p>
                  </div>
                </div>
                <div className={cn(
                  "text-sm font-medium",
                  txn.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-50"
                )}>
                  {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                </div>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">{t('No recent activity found for this time range.')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MetricCard({ title, value, trend, icon: Icon, trendText, isAlert, timeRange, className, colorClass }: any) {
  const { t } = useLanguage();
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  
  const defaultTrendText = () => {
    switch (timeRange) {
      case 'today': return t('vs yesterday');
      case 'week': return t('vs last week');
      case 'month': return t('vs last month');
      case 'year': return t('vs last year');
      case 'all': return t('all time');
      default: return t('from last month');
    }
  };
  
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-full">
      <Card className={cn("h-full relative overflow-hidden flex flex-col justify-between p-3 sm:p-4 sm:pt-4", className)}>
        {colorClass && (
          <div className={cn("absolute top-0 left-0 w-1 sm:w-1.5 h-full opacity-80", colorClass)} />
        )}
        <div className="flex flex-row items-center justify-between space-y-0 mb-1 sm:mb-2 pl-2 sm:pl-3">
          <CardTitle className="text-[10px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
            {title}
          </CardTitle>
          <Icon className={cn("h-3 w-3 sm:h-4 sm:w-4 text-slate-400 shrink-0", isAlert && "text-red-500")} />
        </div>
        <div className="pl-2 sm:pl-3">
          <div className="text-base sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 break-words">{value}</div>
          <p className="text-[9px] sm:text-xs mt-1 flex flex-col sm:flex-row sm:items-center text-slate-500 dark:text-slate-400">
            {trend !== 0 && (
              <span className={cn(
                "font-medium flex items-center mb-0.5 sm:mb-0",
                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {isPositive ? '+' : ''}{trend}%
              </span>
            )}
            <span className={cn(trend !== 0 && "sm:ml-1", "truncate")}>
              {trendText || defaultTrendText()}
            </span>
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
