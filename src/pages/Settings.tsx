import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useGlobal } from '../context/GlobalContext';
import { User, UserRole } from '../types';
import { Save, Plus, Edit2, Trash2, Shield, Building2, Receipt, UserCircle, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Settings() {
  const { users, setUsers, businessSettings, setBusinessSettings, categories, setCategories, addNotification } = useGlobal();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'financial' | 'categories'>('general');
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{old: string, new: string} | null>(null);

  // General Settings State
  const [generalForm, setGeneralForm] = useState(businessSettings);

  // Financial Settings State
  const [financialForm, setFinancialForm] = useState({
    taxPercentage: businessSettings.taxPercentage,
    currency: businessSettings.currency,
  });

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, type: 'general' | 'financial' | null}>({isOpen: false, type: null});

  // User Management State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<Partial<User>>({
    name: '',
    username: '',
    password: '',
    role: 'staff',
    status: 'active'
  });

  const handleSaveGeneral = () => {
    setConfirmModal({ isOpen: true, type: 'general' });
  };

  const confirmSaveGeneral = () => {
    setBusinessSettings(prev => ({ ...prev, ...generalForm }));
    addNotification({
      title: t('Settings Saved'),
      message: t('General settings have been updated successfully.'),
      type: 'success'
    });
    setConfirmModal({ isOpen: false, type: null });
  };

  const handleSaveFinancial = () => {
    setConfirmModal({ isOpen: true, type: 'financial' });
  };

  const confirmSaveFinancial = () => {
    setBusinessSettings(prev => ({ ...prev, ...financialForm }));
    addNotification({
      title: t('Settings Saved'),
      message: t('Financial settings have been updated successfully.'),
      type: 'success'
    });
    setConfirmModal({ isOpen: false, type: null });
  };

  const handleSaveUser = () => {
    if (!userForm.name || !userForm.username || (!editingUser && !userForm.password)) {
      addNotification({
        title: t('Validation Error'),
        message: t('Please fill in all required fields.'),
        type: 'error'
      });
      return;
    }

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...userForm } as User : u));
      addNotification({
        title: t('User Updated'),
        message: `${t('User')} ${userForm.name} ${t('has been updated.')}`,
        type: 'success'
      });
    } else {
      const newUser: User = {
        id: `U${Date.now()}`,
        ...(userForm as Omit<User, 'id'>),
        lastLogin: '-'
      };
      setUsers([...users, newUser]);
      addNotification({
        title: t('User Added'),
        message: `${t('User')} ${newUser.name} ${t('has been created.')}`,
        type: 'success'
      });
    }

    setIsAddingUser(false);
    setEditingUser(null);
    setUserForm({ name: '', username: '', password: '', role: 'staff', status: 'active' });
  };

  const handleDeleteUser = (id: string) => {
    if (users.length <= 1) {
      addNotification({
        title: t('Action Denied'),
        message: t('Cannot delete the last user.'),
        type: 'error'
      });
      return;
    }
    setUsers(users.filter(u => u.id !== id));
    addNotification({
      title: t('User Deleted'),
      message: t('User has been removed from the system.'),
      type: 'success'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('Settings')}</h1>
        <p className="text-slate-500 dark:text-slate-400">{t('Manage your business preferences, users, and financial configurations.')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
              activeTab === 'general' 
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' 
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-5 h-5" />
            {t('General Settings')}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
              activeTab === 'users' 
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' 
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="w-5 h-5" />
            {t('Users & Roles')}
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
              activeTab === 'financial' 
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' 
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-5 h-5" />
            {t('Tax & Financial')}
          </button>
          <button
            onClick={() => setActiveTab('categories' as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
              activeTab === 'categories' as any
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' 
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Edit2 className="w-5 h-5" />
            {t('Category Settings')}
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('General Settings')}</CardTitle>
                <CardDescription>{t('Update your business profile and contact information.')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Business Name')}</label>
                    <input
                      type="text"
                      value={generalForm.businessName}
                      onChange={(e) => setGeneralForm({ ...generalForm, businessName: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("Owner's Name")}</label>
                    <input
                      type="text"
                      value={generalForm.ownerName}
                      onChange={(e) => setGeneralForm({ ...generalForm, ownerName: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Email Address')}</label>
                    <input
                      type="email"
                      value={generalForm.email}
                      onChange={(e) => setGeneralForm({ ...generalForm, email: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Phone Number')}</label>
                    <input
                      type="text"
                      value={generalForm.phone}
                      onChange={(e) => setGeneralForm({ ...generalForm, phone: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Timezone')}</label>
                    <select
                      value={generalForm.timezone}
                      onChange={(e) => setGeneralForm({ ...generalForm, timezone: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="Asia/Dhaka">GMT+6 (Asia/Dhaka)</option>
                      <option value="UTC">UTC</option>
                      <option value="EST">EST</option>
                      <option value="PST">PST</option>
                      <option value="GMT">GMT</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Business Address')}</label>
                    <textarea
                      value={generalForm.address}
                      onChange={(e) => setGeneralForm({ ...generalForm, address: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveGeneral} className="gap-2">
                    <Save className="w-4 h-4" />
                    {t('Save Changes')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'financial' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('Tax & Financial')}</CardTitle>
                <CardDescription>{t('Manage your default tax rates and currency settings.')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Default Tax Percentage (%)')}</label>
                    <input
                      type="number"
                      value={financialForm.taxPercentage}
                      onChange={(e) => setFinancialForm({ ...financialForm, taxPercentage: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Currency')}</label>
                    <select
                      value={financialForm.currency}
                      onChange={(e) => setFinancialForm({ ...financialForm, currency: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="BDT">BDT (৳)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveFinancial} className="gap-2">
                    <Save className="w-4 h-4" />
                    {t('Save Changes')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              {isAddingUser || editingUser ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingUser ? t('Edit User') : t('Add New User')}</CardTitle>
                    <CardDescription>{t('Configure user details, role, and access credentials.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Full Name')}</label>
                        <input
                          type="text"
                          value={userForm.name}
                          onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Username / User ID')}</label>
                        <input
                          type="text"
                          value={userForm.username}
                          onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {t('Password')} {editingUser && <span className="text-xs text-slate-400 font-normal">({t('Leave blank to keep current')})</span>}
                        </label>
                        <input
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Role')}</label>
                        <select
                          value={userForm.role}
                          onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="admin">{t('Admin (Full Access)')}</option>
                          <option value="staff">{t('Staff (Restricted Access)')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Status')}</label>
                        <select
                          value={userForm.status}
                          onChange={(e) => setUserForm({ ...userForm, status: e.target.value as 'active' | 'inactive' })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        >
                          <option value="active">{t('Active')}</option>
                          <option value="inactive">{t('Inactive')}</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsAddingUser(false);
                          setEditingUser(null);
                        }}
                      >
                        {t('Cancel')}
                      </Button>
                      <Button onClick={handleSaveUser} className="gap-2">
                        <Save className="w-4 h-4" />
                        {t('Save User')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{t('Users & Roles')}</CardTitle>
                      <CardDescription>{t('Manage system access and permissions.')}</CardDescription>
                    </div>
                    <Button onClick={() => {
                      setUserForm({ name: '', username: '', password: '', role: 'staff', status: 'active' });
                      setIsAddingUser(true);
                    }} className="gap-2">
                      <Plus className="w-4 h-4" />
                      {t('Add User')}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                          <tr>
                            <th className="px-4 py-3 font-medium">{t('User')}</th>
                            <th className="px-4 py-3 font-medium">{t('Role')}</th>
                            <th className="px-4 py-3 font-medium">{t('Status')}</th>
                            <th className="px-4 py-3 font-medium">{t('Last Login')}</th>
                            <th className="px-4 py-3 font-medium text-right">{t('Actions')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center font-bold">
                                    {user.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-medium text-slate-900 dark:text-slate-100">{user.name}</div>
                                    <div className="text-xs text-slate-500">@{user.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                  user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                }`}>
                                  {user.role === 'admin' ? t('Admin') : t('Staff')}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                  user.status === 'active' 
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {user.status === 'active' ? t('Active') : t('Inactive')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : t('Never')}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => {
                                      setEditingUser(user);
                                      setUserForm({ ...user, password: '' });
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('Category Settings')}</CardTitle>
                    <CardDescription>{t('Manage product categories for your inventory.')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder={t('Add new category...')}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <Button
                    onClick={() => {
                      if (!newCategory.trim()) return;
                      if (categories.includes(newCategory.trim())) {
                        addNotification({ title: t('Error'), message: t('Category already exists.'), type: 'error' });
                        return;
                      }
                      setCategories([...categories, newCategory.trim()]);
                      setNewCategory('');
                      addNotification({ title: t('Success'), message: t('Category added.'), type: 'success' });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('Add')}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {categories.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      {editingCategory?.old === cat ? (
                        <input
                          type="text"
                          value={editingCategory.new}
                          onChange={(e) => setEditingCategory({ ...editingCategory, new: e.target.value })}
                          className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm bg-white dark:border-slate-700 dark:bg-slate-950 mr-2"
                        />
                      ) : (
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {editingCategory?.old === cat ? (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                if (!editingCategory.new.trim()) return;
                                const newCats = [...categories];
                                const catIndex = newCats.indexOf(cat);
                                newCats[catIndex] = editingCategory.new.trim();
                                setCategories(newCats);
                                setEditingCategory(null);
                                addNotification({ title: t('Success'), message: t('Category updated.'), type: 'success' });
                              }}
                              className="text-emerald-600 hover:bg-emerald-50"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingCategory(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setEditingCategory({ old: cat, new: cat })}>
                              <Edit2 className="w-4 h-4 text-slate-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                if(window.confirm(t('Delete this category?'))) {
                                  setCategories(categories.filter(c => c !== cat));
                                  addNotification({ title: t('Success'), message: t('Category deleted.'), type: 'success' });
                                }
                              }}
                              className="text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">{t('No categories found.')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                {t('Confirm Changes')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {t('Are you sure you want to save these settings? This action will update the application configuration.')}
              </p>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setConfirmModal({ isOpen: false, type: null })}
                >
                  {t('Cancel')}
                </Button>
                <Button 
                  onClick={() => {
                    if (confirmModal.type === 'general') confirmSaveGeneral();
                    if (confirmModal.type === 'financial') confirmSaveFinancial();
                  }}
                >
                  {t('Confirm & Save')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
