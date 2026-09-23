import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { PurchaseRecord } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '../../context/LanguageContext';
import { useGlobal } from '../../context/GlobalContext';

interface PurchaseInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: PurchaseRecord | null;
}

export function PurchaseInvoiceModal({ isOpen, onClose, purchase }: PurchaseInvoiceModalProps) {
  const { t } = useLanguage();
  const { businessSettings } = useGlobal();

  if (!isOpen || !purchase) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
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
    
    // Invoice Title
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(t('Purchase Invoice'), 14, 50);
    
    doc.setFontSize(12);
    doc.text(`${t('PO Number:')} ${purchase.poNumber}`, 14, 60);
    doc.text(`${t('Date')}: ${formatDate(purchase.date)}`, 14, 68);
    
    let startY = 78;
    if (purchase.supplierName) {
      doc.text(`${t('Supplier')}: ${purchase.supplierName}`, 14, startY);
      startY += 6;
      if (purchase.supplierMobile) {
        doc.text(`${t('Mobile Number')}: ${purchase.supplierMobile}`, 14, startY);
        startY += 6;
      }
    }

    const tableData = purchase.items.map(item => [
      item.name,
      formatCurrency(item.unitCost),
      item.quantity.toString(),
      item.discountType === 'percent' ? `${item.discount}%` : formatCurrency(item.discount),
      formatCurrency(Math.max(0, (item.unitCost * item.quantity) - (item.discountType === 'percent' ? (item.unitCost * item.quantity) * (item.discount / 100) : item.discount)))
    ]);

    autoTable(doc, {
      startY: startY + 5,
      head: [[t('Item'), t('Unit Cost'), t('Qty'), t('Disc'), t('Total')]],
      body: tableData,
    });

    const finalY = (doc as any).lastAutoTable.finalY || startY + 5;
    
    doc.text(`${t('Subtotal')}: ${formatCurrency(purchase.subtotal)}`, 14, finalY + 10);
    doc.text(`${t('Shipping')}: ${formatCurrency(purchase.shipping)}`, 14, finalY + 18);
    doc.text(`${t('Discount')}: ${formatCurrency(purchase.discountAmount)}`, 14, finalY + 26);
    doc.text(`${t('Tax')}: ${formatCurrency(purchase.taxAmount)}`, 14, finalY + 34);
    doc.setFontSize(14);
    doc.text(`${t('Grand Total')}: ${formatCurrency(purchase.grandTotal)}`, 14, finalY + 44);

    doc.save(`purchase_invoice_${purchase.poNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 print:p-0 print:bg-white print:backdrop-blur-none">
      <div className="w-full sm:max-w-md bg-white sm:bg-white/90 sm:backdrop-blur-xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none max-h-[95vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>
        
        {/* Header - Not printed */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 print:hidden shrink-0">
          <h2 className="text-base font-semibold text-slate-900">{t('Purchase Details')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Invoice Content */}
        <div className="p-6 print:p-0 overflow-y-auto" id="invoice-content">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-xl font-bold text-indigo-600">{businessSettings.businessName}</h1>
              {businessSettings.ownerName && (
                <p className="text-slate-700 text-sm font-medium mt-1">{t('Owner')}: {businessSettings.ownerName}</p>
              )}
              <p className="text-slate-500 text-xs mt-0.5">{businessSettings.phone}</p>
              <p className="text-slate-500 text-xs">{businessSettings.address}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-slate-900 text-sm">#{purchase.poNumber}</p>
              <p className="text-slate-500 text-xs">{formatDate(purchase.date)}</p>
            </div>
          </div>

          {(purchase.supplierName || purchase.supplierMobile) && (
            <div className="mb-6">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('Supplier')}</h3>
              {purchase.supplierName && <p className="text-slate-900 text-sm font-medium mt-1">{purchase.supplierName}</p>}
              {purchase.supplierMobile && <p className="text-slate-500 text-xs mt-0.5">{purchase.supplierMobile}</p>}
            </div>
          )}

          <table className="w-full text-left text-xs mb-6">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="pb-2 font-medium">{t('Item')}</th>
                <th className="pb-2 font-medium text-right">{t('Unit Cost')}</th>
                <th className="pb-2 font-medium text-right">{t('Qty')}</th>
                <th className="pb-2 font-medium text-right">{t('Disc')}</th>
                <th className="pb-2 font-medium text-right">{t('Total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchase.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2 text-slate-900">{item.name}</td>
                  <td className="py-2 text-right text-slate-500">{formatCurrency(item.unitCost)}</td>
                  <td className="py-2 text-right text-slate-500">{item.quantity}</td>
                  <td className="py-2 text-right text-slate-500">{item.discountType === 'percent' ? `${item.discount}%` : formatCurrency(item.discount)}</td>
                  <td className="py-2 text-right text-slate-900 font-medium">
                    {formatCurrency(Math.max(0, (item.unitCost * item.quantity) - (item.discountType === 'percent' ? (item.unitCost * item.quantity) * (item.discount / 100) : item.discount)))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-56 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>{t('Subtotal')}</span>
                <span>{formatCurrency(purchase.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{t('Shipping')}</span>
                <span>{formatCurrency(purchase.shipping)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{t('Discount')}</span>
                <span>-{formatCurrency(purchase.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{t('Tax')}</span>
                <span>{formatCurrency(purchase.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-200 pt-2">
                <span>{t('Total')}</span>
                <span>{formatCurrency(purchase.grandTotal)}</span>
              </div>
              
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>{t('Payment Method')}</span>
                  <span className="capitalize">{purchase.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px] mt-1">
                  <span>{t('Amount Paid')}</span>
                  <span>{formatCurrency(purchase.paidAmount)}</span>
                </div>
                {purchase.paymentOption === 'partial' && (
                  <div className="flex justify-between text-red-500 text-[10px] mt-1 font-medium">
                    <span>{t('Due Amount')}</span>
                    <span>{formatCurrency(purchase.grandTotal - purchase.paidAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions - Not printed */}
        <div className="flex justify-end gap-2 bg-slate-50 p-4 border-t border-slate-200 print:hidden shrink-0">
          <Button variant="outline" onClick={onClose} className="mr-auto text-sm h-9">
            {t('Back')}
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} className="text-sm h-9 px-3">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t('PDF')}
          </Button>
          <Button onClick={handlePrint} className="text-sm h-9 px-3">
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            {t('Print')}
          </Button>
        </div>
      </div>
    </div>
  );
}
