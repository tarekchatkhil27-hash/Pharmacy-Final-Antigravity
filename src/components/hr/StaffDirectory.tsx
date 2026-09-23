import React, { useState, useRef } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { useLanguage } from '../../context/LanguageContext';
import { Staff } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus, Edit, Trash2, Mail, Phone, Briefcase, Calendar, Clock, Badge, Download, X } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export function StaffDirectory() {
  const { staff, setStaff } = useGlobal();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [viewingIdCard, setViewingIdCard] = useState<Staff | null>(null);

  const [formData, setFormData] = useState<Partial<Staff>>({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    joinDate: new Date().toISOString().split('T')[0],
    salary: 0,
    status: 'active',
    shift: 'Morning'
  });

  const handleOpenModal = (staffMember?: Staff) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData(staffMember);
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        position: '',
        department: '',
        email: '',
        phone: '',
        joinDate: new Date().toISOString().split('T')[0],
        salary: 0,
        status: 'active',
        shift: 'Morning'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      setStaff(prev => prev.map(s => s.id === editingStaff.id ? { ...s, ...formData } as Staff : s));
    } else {
      const newStaff: Staff = {
        ...formData,
        id: `EMP-${Date.now()}`,
      } as Staff;
      setStaff(prev => [...prev, newStaff]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('Are you sure you want to delete this staff member?'))) {
      setStaff(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('Staff Directory')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('Manage employee profiles and ID cards.')}</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          {t('Add Staff')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(employee => (
          <Card key={employee.id} className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 relative group">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl font-bold border-2 border-indigo-200 dark:border-indigo-800">
                    {employee.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 leading-tight">{employee.name}</h3>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{employee.position}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{employee.id}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => setViewingIdCard(employee)} title={t('View ID Card')}>
                    <Badge className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleOpenModal(employee)} title={t('Edit')}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(employee.id)} title={t('Delete')}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 mt-6">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                  <Briefcase className="h-4 w-4 mr-3 text-slate-400" />
                  {employee.department}
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                  <Mail className="h-4 w-4 mr-3 text-slate-400" />
                  {employee.email}
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                  <Phone className="h-4 w-4 mr-3 text-slate-400" />
                  {employee.phone}
                </div>
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                  <Clock className="h-4 w-4 mr-3 text-slate-400" />
                  {t(employee.shift)} {t('Shift')}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${employee.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {t(employee.status.toUpperCase())}
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {formatCurrency(employee.salary)} {t('/ mo')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {editingStaff ? t('Edit Staff Profile') : t('Add New Staff')}
              </h3>
            </div>
            <div className="p-4 overflow-y-auto">
              <form id="staff-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Full Name')}</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Position')}</label>
                    <input required type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Department')}</label>
                    <input required type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Email Address')}</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Phone Number')}</label>
                    <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Join Date')}</label>
                    <input required type="date" value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Salary (Monthly)')}</label>
                    <input required type="number" min="0" step="1" value={formData.salary} onChange={e => setFormData({...formData, salary: parseInt(e.target.value) || 0})} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Shift / Roster')}</label>
                    <select value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value as any})} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50">
                      <option value="Morning">{t('Morning')}</option>
                      <option value="Evening">{t('Evening')}</option>
                      <option value="Night">{t('Night')}</option>
                      <option value="Flexible">{t('Flexible')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('Status')}</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50">
                      <option value="active">{t('Active')}</option>
                      <option value="inactive">{t('Inactive')}</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 shrink-0 bg-slate-50 dark:bg-slate-900/50">
              <Button variant="outline" onClick={handleCloseModal}>{t('Cancel')}</Button>
              <Button type="submit" form="staff-form" className="bg-indigo-600 hover:bg-indigo-700 text-white">{t('Save Staff')}</Button>
            </div>
          </div>
        </div>
      )}

      {viewingIdCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-white hover:bg-white/20 z-10"
              onClick={() => setViewingIdCard(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            
            {/* ID Card Front */}
            <div className="relative bg-gradient-to-b from-indigo-600 to-indigo-800 p-6 flex flex-col items-center text-center">
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
                <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-white blur-2xl"></div>
              </div>
              
              <div className="z-10 w-full">
                <h2 className="text-white font-bold text-xl tracking-wider mb-6 uppercase">{t('Company Name')}</h2>
                
                <div className="mx-auto h-28 w-28 rounded-full bg-white p-1 shadow-lg mb-4">
                  <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 text-4xl font-bold">
                    {viewingIdCard.name.charAt(0)}
                  </div>
                </div>
                
                <h3 className="text-white font-bold text-2xl mb-1">{viewingIdCard.name}</h3>
                <p className="text-indigo-200 font-medium text-sm uppercase tracking-widest mb-4">{viewingIdCard.position}</p>
                
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/20">
                  <p className="text-white text-sm font-mono tracking-widest">{viewingIdCard.id}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white dark:bg-slate-900">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Briefcase className="h-4 w-4 mr-3 text-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-300">{viewingIdCard.department} {t('Department')}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-3 text-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-300">{viewingIdCard.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-3 text-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-300">{viewingIdCard.phone}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-center">
                <div className="h-12 w-32 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-xs text-slate-400">{t('BARCODE')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
