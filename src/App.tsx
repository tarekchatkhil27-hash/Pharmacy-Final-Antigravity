/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Sales } from './pages/Sales';
import { Accounting } from './pages/Accounting';
import { Directory } from './pages/Directory';
import { HR } from './pages/HR';
import { MedicineDatabase } from './pages/MedicineDatabase';
import { Settings } from './pages/Settings';
import { GlobalProvider } from './context/GlobalContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'sales':
        return <Sales />;
      case 'accounting':
        return <Accounting />;
      case 'directory':
        return <Directory />;
      case 'hr':
        return <HR />;
      case 'medicine-database':
        return <MedicineDatabase />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="nexus-theme">
      <LanguageProvider>
        <GlobalProvider>
          <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            {renderContent()}
          </Layout>
        </GlobalProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
