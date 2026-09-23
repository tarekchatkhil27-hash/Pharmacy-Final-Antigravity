import React, { useState } from 'react';
import { X, Edit, Trash2, Package, Tag, Hash, DollarSign, Calendar, User, Truck, Save, Layers } from 'lucide-react';
import { Button } from '../ui/Button';
import { Product } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useGlobal } from '../../context/GlobalContext';
import { useLanguage } from '../../context/LanguageContext';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string, name: string) => void;
}

export function ProductDetailsModal({ product, isOpen, onClose, onDelete }: ProductDetailsModalProps) {
  const { setProducts, setHistoryLogs, addNotification } = useGlobal();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [showBatchHistory, setShowBatchHistory] = useState(false);

  if (!isOpen || !product) return null;

  const handleEditClick = () => {
    setEditForm(product);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...editForm } as Product : p));
    setHistoryLogs(prev => [{
      id: `LOG-${Date.now()}`,
      date: new Date().toISOString(),
      module: 'inventory',
      action: 'Edit Product',
      description: `Updated product details: ${product.name}`,
      user: 'Admin'
    }, ...prev]);

    // Notification
    addNotification({
      title: t('Product Updated'),
      message: `${product.name} ${t('details have been updated.')}`,
      type: 'info',
      module: 'inventory'
    });

    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity p-0 sm:p-4">
      <div className="relative w-full sm:max-w-2xl bg-white/90 sm:bg-white/70 sm:backdrop-blur-xl sm:border sm:border-white/20 dark:bg-slate-900/90 dark:sm:bg-black/50 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>
        <div className="flex items-center justify-between border-b border-slate-200/50 bg-transparent px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center dark:bg-indigo-900/30 dark:text-indigo-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {isEditing ? t('Edit Product') : t('Product Details')}
              </h2>
              <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button variant="ghost" size="icon" onClick={handleEditClick} className="text-slate-500 hover:text-indigo-600">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { onClose(); onDelete(product.id, product.name); }} className="text-slate-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full ml-2">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto p-6">
          {isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Product Name')}</label>
                  <input name="name" value={editForm.name || ''} onChange={handleInputChange} className="w-full px-3 py-2 text-sm focus:ring-2 dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Category')}</label>
                  <input name="category" value={editForm.category || ''} onChange={handleInputChange} className="w-full px-3 py-2 text-sm focus:ring-2 dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Purchase Price (Cost)')}</label>
                  <input type="number" name="cost" value={editForm.cost || ''} onChange={handleInputChange} className="w-full px-3 py-2 text-sm focus:ring-2 dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Selling Price')}</label>
                  <input type="number" name="price" value={editForm.price || ''} onChange={handleInputChange} className="w-full px-3 py-2 text-sm focus:ring-2 dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Stock Quantity')}</label>
                  <input type="number" name="quantity" value={editForm.quantity || ''} onChange={handleInputChange} className="w-full px-3 py-2 text-sm focus:ring-2 dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Min Threshold')}</label>
                  <input type="number" name="minThreshold" value={editForm.minThreshold || ''} onChange={handleInputChange} className="w-full px-3 py-2 text-sm focus:ring-2 dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Brand')}</label>
                  <input name="brand" value={editForm.brand || ''} onChange={handleInputChange} className="w-full px-3 py-2 text-sm focus:ring-2 dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('Batch Number')}</label>
                  <input name="batchNumber" value={editForm.batchNumber || ''} onChange={handleInputChange} className="w-full px-3 py-2 text-sm focus:ring-2 dark: border-none bg-slate-100 dark:bg-slate-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200 focus:outline-none dark:text-slate-50" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button variant="outline" onClick={handleCancelEdit}>{t('Cancel')}</Button>
                <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Save className="mr-2 h-4 w-4" />
                  {t('Save Changes')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">{t('Basic Info')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Tag className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{product.name}</p>
                          <p className="text-xs text-slate-500">{t('Name')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Hash className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{product.category || '-'}</p>
                          <p className="text-xs text-slate-500">{t('Category')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Package className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{product.brand || '-'}</p>
                          <p className="text-xs text-slate-500">{t('Brand')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">{t('Pricing & Stock')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{formatCurrency(product.price)}</p>
                          <p className="text-xs text-slate-500">{t('Selling Price')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{formatCurrency(product.movingAverageCost || product.cost)}</p>
                          <p className="text-xs text-slate-500">{t('Moving Average Cost (MAC)')}</p>
                        </div>
                      </div>
                      
                      {product.costHistory && product.costHistory.length > 0 && (
                        <div className="flex items-start gap-3">
                          <DollarSign className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                              {/* Show up to 3 latest unique prices */}
                              {[...new Set(product.costHistory.map(h => h.cost))]
                                .slice(0, 3)
                                .map(c => formatCurrency(c))
                                .join(' / ')}
                            </p>
                            <p className="text-xs text-slate-500">{t('Recent Purchase Prices')}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`h-5 w-5 shrink-0 mt-0.5 rounded-full flex items-center justify-center ${product.quantity <= product.minThreshold ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          <Package className="h-3 w-3" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{product.quantity} {t('units')}</p>
                          <p className="text-xs text-slate-500">{t('Current Stock (Min: ')}{product.minThreshold})</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <DollarSign className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{formatCurrency((product.movingAverageCost || product.cost) * product.quantity)}</p>
                          <p className="text-xs text-slate-500">{t('Total Cost (MAC × Stock)')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">{t('Additional Details')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                            {formatDate(product.lastRestocked)} at {new Date(product.lastRestocked).toLocaleTimeString()}
                          </p>
                          <p className="text-xs text-slate-500">{t('Last Restocked')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{product.addedBy || t('System')}</p>
                          <p className="text-xs text-slate-500">{t('Added By')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Truck className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{product.batchNumber || '-'}</p>
                          <p className="text-xs text-slate-500">{t('Latest Batch Number')}</p>
                        </div>
                      </div>
                      {product.batches && product.batches.length > 0 && (
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                          <Button 
                            variant="outline" 
                            className="w-full flex items-center justify-center gap-2"
                            onClick={() => setShowBatchHistory(true)}
                          >
                            <Layers className="h-4 w-4" />
                            {t('View Batch History')} ({product.batches.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Batch History Modal */}
      {showBatchHistory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center dark:bg-indigo-900/30 dark:text-indigo-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('Batch History')}</h2>
                  <p className="text-xs text-slate-500">{product.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowBatchHistory(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <div className="space-y-4">
                {product.batches?.map((batch, index) => (
                  <div key={batch.id || index} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-semibold dark:bg-indigo-900/30 dark:text-indigo-400">
                          <Truck className="h-3.5 w-3.5" />
                          {batch.batchNumber}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(batch.date)} at {new Date(batch.date).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">{t('Quantity')}</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{batch.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">{t('Unit Cost')}</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{formatCurrency(batch.cost)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">{t('Added By')}</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{batch.addedBy}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">{t('Total Cost')}</p>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{formatCurrency(batch.quantity * batch.cost)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
