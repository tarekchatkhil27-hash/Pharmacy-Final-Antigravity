import React, { useState } from 'react';
import { Users, CalendarClock, DollarSign, ClipboardList } from 'lucide-react';
import { StaffDirectory } from '../components/hr/StaffDirectory';
import { StaffRoster } from '../components/hr/StaffRoster';
import { StaffAttendance } from '../components/hr/StaffAttendance';
import { StaffPayroll } from '../components/hr/StaffPayroll';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

export function HR() {
  const [activeTab, setActiveTab] = useState<'directory' | 'roster' | 'attendance' | 'payroll'>('directory');
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('Human Resources')}</h1>
        <p className="text-slate-500 dark:text-slate-400">{t('Manage employees, rosters, attendance, and payroll.')}</p>
      </div>

      <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/50 w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('directory')}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap",
            activeTab === 'directory' 
              ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400" 
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
          )}
        >
          <Users className="h-4 w-4" />
          {t('Staff Directory')}
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap",
            activeTab === 'roster' 
              ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400" 
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
          )}
        >
          <ClipboardList className="h-4 w-4" />
          {t('Duty Roster')}
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap",
            activeTab === 'attendance' 
              ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400" 
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
          )}
        >
          <CalendarClock className="h-4 w-4" />
          {t('Attendance')}
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap",
            activeTab === 'payroll' 
              ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400" 
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
          )}
        >
          <DollarSign className="h-4 w-4" />
          {t('Payroll')}
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'directory' && <StaffDirectory />}
        {activeTab === 'roster' && <StaffRoster />}
        {activeTab === 'attendance' && <StaffAttendance />}
        {activeTab === 'payroll' && <StaffPayroll />}
      </div>
    </div>
  );
}
