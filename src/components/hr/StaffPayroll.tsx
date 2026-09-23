import React, { useState, useMemo } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { FileText, DollarSign, CheckCircle2, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Payroll } from '../../types';

export function StaffPayroll() {
  const { staff, payroll, setPayroll, setTransactions, setHistoryLogs, addNotification, businessSettings } = useGlobal();
  const { t } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const activeStaff = useMemo(() => staff.filter(s => s.status === 'active'), [staff]);

  const getPayrollRecord = (staffId: string) => {
    return payroll.find(p => p.staffId === staffId && p.month === selectedMonth);
  };

  const [editingRecord, setEditingRecord] = useState<Partial<Payroll> | null>(null);

  const handleEdit = (employee: typeof staff[0]) => {
    const existing = getPayrollRecord(employee.id);
    if (existing) {
      setEditingRecord(existing);
    } else {
      setEditingRecord({
        staffId: employee.id,
        month: selectedMonth,
        basicSalary: employee.salary,
        allowances: 0,
        deductions: 0,
        netPay: employee.salary,
        status: 'pending'
      });
    }
  };

  const handleSaveRecord = () => {
    if (!editingRecord || !editingRecord.staffId) return;
    
    const netPay = (editingRecord.basicSalary || 0) + (editingRecord.allowances || 0) - (editingRecord.deductions || 0);
    const finalRecord = { ...editingRecord, netPay } as Payroll;

    setPayroll(prev => {
      const existingIdx = prev.findIndex(p => p.staffId === finalRecord.staffId && p.month === finalRecord.month);
      if (existingIdx >= 0) {
        const newArr = [...prev];
        newArr[existingIdx] = finalRecord;
        return newArr;
      } else {
        return [...prev, { ...finalRecord, id: `PAY-${Date.now()}` }];
      }
    });
    setEditingRecord(null);
  };

  const openPaymentModal = (payrollId: string) => {
    setSelectedPayrollId(payrollId);
    setPaymentMethod('Cash');
    setPaymentModalOpen(true);
  };

  const processPayment = () => {
    if (!selectedPayrollId) return;
    const record = payroll.find(p => p.id === selectedPayrollId);
    if (!record) return;
    const employee = staff.find(s => s.id === record.staffId);

    setPayroll(prev => prev.map(p => p.id === selectedPayrollId ? { ...p, status: 'paid', paymentDate: new Date().toISOString() } : p));
    
    // Add transaction to Accounting
    setTransactions(prev => [{
      id: `TXN-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'expense',
      amount: record.netPay,
      description: `Payroll for ${employee?.name || 'Staff'} - ${record.month} (via ${paymentMethod})`,
      category: 'Payroll',
      status: 'completed',
      referenceId: selectedPayrollId
    }, ...prev]);

    // Add log
    setHistoryLogs(prev => [{
      id: `LOG-${Date.now()}`,
      date: new Date().toISOString(),
      module: 'hr',
      action: 'Payroll Paid',
      description: `Processed payroll of ${formatCurrency(record.netPay)} for ${employee?.name || 'Staff'} via ${paymentMethod}`,
      user: 'Admin'
    }, ...prev]);

    // Notification
    addNotification({
      title: 'Payroll Processed',
      message: `Salary of ${formatCurrency(record.netPay)} for ${employee?.name || 'Staff'} has been marked as paid via ${paymentMethod}.`,
      type: 'success',
      module: 'hr'
    });

    setPaymentModalOpen(false);
    setSelectedPayrollId(null);
  };

  const generatePayslip = (record: Payroll, employeeName: string) => {
    const doc = new jsPDF();
    
    // Business Header
    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text(businessSettings.businessName, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    if (businessSettings.ownerName) {
      doc.text(`${t('Owner')}: ${businessSettings.ownerName}`, 14, 28);
      doc.text(businessSettings.phone, 14, 33);
      doc.text(businessSettings.address, 14, 38);
    } else {
      doc.text(businessSettings.phone, 14, 28);
      doc.text(businessSettings.address, 14, 33);
    }
    
    // Payslip Title
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('Payslip', 14, 50);
    
    doc.setFontSize(12);
    doc.text(`Employee: ${employeeName}`, 14, 60);
    doc.text(`Month: ${record.month}`, 14, 68);
    doc.text(`Status: ${record.status.toUpperCase()}`, 14, 76);
    
    let startY = 84;
    if (record.paymentDate) {
      doc.text(`Paid On: ${new Date(record.paymentDate).toLocaleDateString()}`, 14, startY);
      startY += 8;
    }

    autoTable(doc, {
      startY: startY,
      head: [['Description', 'Amount']],
      body: [
        ['Basic Salary', formatCurrency(record.basicSalary)],
        ['Allowances', formatCurrency(record.allowances)],
        ['Deductions', `-${formatCurrency(record.deductions)}`],
      ],
    });

    const finalY = (doc as any).lastAutoTable.finalY || startY;
    doc.setFontSize(14);
    doc.text(`Net Pay: ${formatCurrency(record.netPay)}`, 14, finalY + 15);

    doc.save(`payslip_${employeeName.replace(/\s+/g, '_')}_${record.month}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('Payroll Management')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('Process salaries and generate payslips.')}</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-sm">
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <CardTitle>{t('Salary Processing -')} {selectedMonth}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">{t('Employee')}</th>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">{t('Basic Salary')}</th>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">{t('Net Pay')}</th>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">{t('Status')}</th>
                  <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {activeStaff.map(employee => {
                  const record = getPayrollRecord(employee.id);
                  const isEditing = editingRecord?.staffId === employee.id;

                  if (isEditing) {
                    return (
                      <tr key={employee.id} className="bg-indigo-50/50 dark:bg-indigo-900/10">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-50">{employee.name}</td>
                        <td colSpan={2} className="px-6 py-4">
                          <div className="flex items-center gap-4 justify-end">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">{t('Allowances:')}</span>
                              <input 
                                type="number" min="0" step="1"
                                value={editingRecord.allowances}
                                onChange={e => setEditingRecord({...editingRecord, allowances: parseInt(e.target.value) || 0})}
                                className="w-24 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">{t('Deductions:')}</span>
                              <input 
                                type="number" min="0" step="1"
                                value={editingRecord.deductions}
                                onChange={e => setEditingRecord({...editingRecord, deductions: parseInt(e.target.value) || 0})}
                                className="w-24 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
                              />
                            </div>
                          </div>
                        </td>
                        <td colSpan={2} className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingRecord(null)}>{t('Cancel')}</Button>
                            <Button size="sm" onClick={handleSaveRecord}>{t('Save')}</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 dark:text-slate-50">{employee.name}</p>
                        <p className="text-xs text-slate-500">{employee.position}</p>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(employee.salary)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-slate-50">
                        {record ? formatCurrency(record.netPay) : formatCurrency(employee.salary)}
                      </td>
                      <td className="px-6 py-4">
                        {!record ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                            {t('Unprocessed')}
                          </span>
                        ) : record.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            {t('Paid')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {t('Pending')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {!record || record.status === 'pending' ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleEdit(employee)}>
                                {t('Process')}
                              </Button>
                              {record && (
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => openPaymentModal(record.id)}>
                                  {t('Mark Paid')}
                                </Button>
                              )}
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => generatePayslip(record, employee.name)}>
                              <FileText className="h-4 w-4 mr-1.5" />
                              {t('Payslip')}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {activeStaff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      {t('No active staff members found.')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Confirmation Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl dark:bg-slate-950 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('Confirm Salary Payment')}</h2>
              <Button variant="ghost" size="icon" onClick={() => setPaymentModalOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('Total Net Pay')}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                  {formatCurrency(payroll.find(p => p.id === selectedPayrollId)?.netPay || 0)}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  {t('Employee')}: <span className="font-medium text-slate-700 dark:text-slate-300">
                    {staff.find(s => s.id === payroll.find(p => p.id === selectedPayrollId)?.staffId)?.name}
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('Payment Method')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Cash', 'bKash', 'Bank Transfer', 'Other'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all ${
                        paymentMethod === method
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                      }`}
                    >
                      {t(method)}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                onClick={processPayment}
              >
                {t('Confirm & Mark Paid')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
