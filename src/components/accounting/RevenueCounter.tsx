import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { TrendingUp, Coins, Smartphone, CreditCard, Building2, History } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, isWithinTimeRange, TimeRange } from '../../lib/utils';

export function RevenueCounter() {
  const { sales } = useGlobal();
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const revenueCounter = useMemo(() => {
    const counter = {
      cash: 0,
      bkas: 0,
      card: 0,
      bank: 0,
      credit: 0
    };

    const filteredSales = sales.filter(s => isWithinTimeRange(s.date, timeRange));

    filteredSales.forEach(sale => {
      if (sale.paymentMethod === 'cash') counter.cash += sale.paidAmount;
      else if (sale.paymentMethod === 'bkash' || sale.paymentMethod === 'bkas') counter.bkas += sale.paidAmount;
      else if (sale.paymentMethod === 'card') counter.card += sale.paidAmount;
      else if (sale.paymentMethod === 'bank') counter.bank += sale.paidAmount;
      
      counter.credit += (sale.grandTotal - sale.paidAmount);
    });

    return counter;
  }, [sales, timeRange]);

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            {t('Revenue Counter')}
          </CardTitle>
          <CardDescription>{t('Revenue breakdown by payment method')}</CardDescription>
        </div>
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
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
            <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 mb-1.5 sm:mb-2" />
            <span className="text-[10px] sm:text-xs font-medium text-emerald-600 uppercase tracking-wider">{t('Cash')}</span>
            <span className="text-xs sm:text-lg font-bold text-slate-900 dark:text-slate-50 mt-1 break-words w-full text-center">{formatCurrency(revenueCounter.cash)}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-pink-50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/20">
            <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600 mb-1.5 sm:mb-2" />
            <span className="text-[10px] sm:text-xs font-medium text-pink-600 uppercase tracking-wider">{t('bKash')}</span>
            <span className="text-xs sm:text-lg font-bold text-slate-900 dark:text-slate-50 mt-1 break-words w-full text-center">{formatCurrency(revenueCounter.bkas)}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mb-1.5 sm:mb-2" />
            <span className="text-[10px] sm:text-xs font-medium text-blue-600 uppercase tracking-wider">{t('Card')}</span>
            <span className="text-xs sm:text-lg font-bold text-slate-900 dark:text-slate-50 mt-1 break-words w-full text-center">{formatCurrency(revenueCounter.card)}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 mb-1.5 sm:mb-2" />
            <span className="text-[10px] sm:text-xs font-medium text-indigo-600 uppercase tracking-wider">{t('Bank')}</span>
            <span className="text-xs sm:text-lg font-bold text-slate-900 dark:text-slate-50 mt-1 break-words w-full text-center">{formatCurrency(revenueCounter.bank)}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 col-span-1 md:col-span-1">
            <History className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 mb-1.5 sm:mb-2" />
            <span className="text-[10px] sm:text-xs font-medium text-amber-600 uppercase tracking-wider">{t('Credit')}</span>
            <span className="text-xs sm:text-lg font-bold text-slate-900 dark:text-slate-50 mt-1 break-words w-full text-center">{formatCurrency(revenueCounter.credit)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
