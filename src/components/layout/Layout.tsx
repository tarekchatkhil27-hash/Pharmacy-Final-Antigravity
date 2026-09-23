import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { NotificationCenter } from './NotificationCenter';
import { useLanguage } from '../../context/LanguageContext';
import { Languages } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex h-screen w-full bg-[#F5F5F7] dark:bg-[#0A0A0A] overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <header className="hidden md:flex h-16 items-center justify-end px-8 border-b border-white/20 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-black/50 shrink-0 gap-4 sticky top-0 z-10">
          <button
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors dark:text-slate-300 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10"
            title="Toggle Language"
          >
            <Languages className="w-4 h-4" />
            {language === 'en' ? 'বাংলা' : 'English'}
          </button>
          <NotificationCenter />
        </header>
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
          <div className="mx-auto max-w-7xl">
            <AnimatePresence mode="wait">
              <React.Fragment key={activeTab}>
                {children}
              </React.Fragment>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
