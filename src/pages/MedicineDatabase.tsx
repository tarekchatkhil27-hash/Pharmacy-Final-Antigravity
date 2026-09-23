import React, { useEffect, useState } from 'react';
import { Database, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getMedicineDatabase } from '../lib/medicineDatabase';
import { Medicine } from '../types';
import { motion } from 'motion/react';

export function MedicineDatabase() {
  const { t } = useLanguage();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getMedicineDatabase().then(data => {
      setMedicines(data);
      setLoading(false);
    });
  }, []);

  const filteredMedicines = medicines.filter(med => 
    med['Product Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med['Generic Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med['Brand Name']?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 100); // Limit to 100 for performance

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-col gap-4 border-b border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:border-white/10 dark:bg-slate-950">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Database className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            {t('Medicine Database')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t('Browse the complete database of medicines')}
          </p>
        </div>
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('Search medicines...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50"
          />
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-black/20">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">{t('Product Name')}</th>
                      <th className="px-6 py-4 font-medium">{t('Generic Name')}</th>
                      <th className="px-6 py-4 font-medium">{t('Strength')}</th>
                      <th className="px-6 py-4 font-medium">{t('Dosage Form')}</th>
                      <th className="px-6 py-4 font-medium">{t('Brand Name')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {filteredMedicines.length > 0 ? (
                      filteredMedicines.map((med, index) => (
                        <motion.tr 
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.5) }}
                          className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/50"
                        >
                          <td className="px-6 py-4 text-slate-900 font-medium dark:text-slate-200">{med['Product Name']}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{med['Generic Name']}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{med['Strength']}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{med['Dosage Form']}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{med['Brand Name']}</td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                          {t('No medicines found matching your search.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                Showing top {filteredMedicines.length} results.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
