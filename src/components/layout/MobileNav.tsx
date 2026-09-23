import React, { useState } from 'react';
import { navItems } from './Sidebar';
import { cn } from '../../lib/utils';
import { Languages, Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationCenter } from './NotificationCenter';
import { useGlobal } from '../../context/GlobalContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const { currentUserRole, businessSettings } = useGlobal();
  const { language, setLanguage, t } = useLanguage();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredNavItems = navItems.filter(item => {
    if (currentUserRole === 'staff' && (item.id === 'hr' || item.id === 'settings')) {
      return false;
    }
    return true;
  });

  const bottomNavIds = ['dashboard', 'inventory', 'sales', 'accounting', 'directory'];
  const bottomNavItems = filteredNavItems.filter(i => bottomNavIds.includes(i.id));

  return (
    <div className="md:hidden">
      {/* Top Bar (Glassmorphism) */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/50 bg-white/70 backdrop-blur-xl px-4 dark:border-white/10 dark:bg-black/50 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center justify-center w-10 h-10 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {businessSettings.businessName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="flex items-center justify-center w-10 h-10 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors dark:text-slate-300 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10"
            title="Toggle Language"
          >
            <Languages className="w-5 h-5" />
          </button>
          <NotificationCenter />
          <div className="flex items-center justify-center w-10 h-10">
            <ThemeToggle isCollapsed={true} />
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-950 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 truncate">
                  {businessSettings.businessName}
                </span>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-slate-50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsDrawerOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50',
                      )}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {t(item.label)}
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full border-t border-slate-200/50 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-black/50 z-30 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <nav className="flex justify-around items-center h-16 px-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isSales = item.id === 'sales';
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[3.5rem] h-full transition-colors relative',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50'
                )}
              >
                {isSales ? (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 p-3.5 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-4 ring-white dark:ring-black/50 transition-transform active:scale-95">
                    <Icon className="h-6 w-6" />
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "p-1.5 rounded-full mb-0.5 transition-all duration-200", 
                      isActive ? "bg-indigo-100 dark:bg-indigo-500/20" : "bg-transparent"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium tracking-tight truncate w-full text-center">
                      {t(item.label)}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
