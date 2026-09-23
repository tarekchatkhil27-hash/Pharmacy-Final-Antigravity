import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Calculator, 
  Users, 
  Briefcase, 
  Settings,
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { useGlobal } from '../../context/GlobalContext';
import { useLanguage } from '../../context/LanguageContext';

export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'sales', label: 'Sales', icon: ShoppingCart },
  { id: 'accounting', label: 'Accounting', icon: Calculator },
  { id: 'directory', label: 'Directory', icon: Users },
  { id: 'hr', label: 'HR', icon: Briefcase },
  { id: 'medicine-database', label: 'Medicine Database', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }: SidebarProps) {
  const { currentUserRole, setCurrentUserRole, businessSettings } = useGlobal();
  const { t } = useLanguage();

  const filteredNavItems = navItems.filter(item => {
    if (currentUserRole === 'staff' && (item.id === 'hr' || item.id === 'settings')) {
      return false;
    }
    return true;
  });

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-slate-200/50 bg-white/70 backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-black/50',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/50 dark:border-white/10 shrink-0">
        {!isCollapsed && (
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 truncate">
            {businessSettings.businessName}
          </span>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold mx-auto">
            {businessSettings.businessName.charAt(0).toUpperCase()}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn('hidden md:flex', isCollapsed ? 'mx-auto' : '')}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50',
                isCollapsed ? 'justify-center' : 'justify-start'
              )}
              title={isCollapsed ? t(item.label) : undefined}
            >
              <Icon className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
              {!isCollapsed && <span>{t(item.label)}</span>}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-200/50 dark:border-white/10 shrink-0 flex flex-col gap-4">
        {!isCollapsed && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('Role:')}</span>
            <select
              value={currentUserRole}
              onChange={(e) => {
                const newRole = e.target.value as 'admin' | 'staff';
                setCurrentUserRole(newRole);
                if (newRole === 'staff' && (activeTab === 'hr' || activeTab === 'settings')) {
                  setActiveTab('dashboard');
                }
              }}
              className="text-sm rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            >
              <option value="admin">{t('Admin')}</option>
              <option value="staff">{t('Staff')}</option>
            </select>
          </div>
        )}
        {isCollapsed && (
          <select
            value={currentUserRole}
            onChange={(e) => {
              const newRole = e.target.value as 'admin' | 'staff';
              setCurrentUserRole(newRole);
              if (newRole === 'staff' && (activeTab === 'hr' || activeTab === 'settings')) {
                setActiveTab('dashboard');
              }
            }}
            className="text-xs rounded border border-slate-200 bg-slate-50 px-1 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 w-full"
            title={t('Role')}
          >
            <option value="admin">Adm</option>
            <option value="staff">Stf</option>
          </select>
        )}
        {!isCollapsed ? (
          <ThemeToggle />
        ) : (
          <div className="flex justify-center">
            <ThemeToggle isCollapsed={true} />
          </div>
        )}
      </div>
    </aside>
  );
}
