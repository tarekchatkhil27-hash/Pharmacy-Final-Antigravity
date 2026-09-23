import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../lib/utils';

export function ThemeToggle({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  
  // Treat system as light for toggling purposes if it happens to be set
  const currentTheme = theme === 'system' ? 'light' : theme;

  if (isCollapsed) {
    return (
      <button
        onClick={() => setTheme(currentTheme === 'light' ? 'dark' : 'light')}
        className="flex justify-center items-center p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all"
        title={`Current Theme: ${currentTheme}. Click to change.`}
      >
        {currentTheme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          "flex-1 flex justify-center items-center py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
          currentTheme === 'light' 
            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" 
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        )}
        title="Light Mode"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          "flex-1 flex justify-center items-center py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
          currentTheme === 'dark' 
            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" 
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        )}
        title="Dark Mode"
      >
        <Moon className="h-4 w-4" />
      </button>
    </div>
  );
}
