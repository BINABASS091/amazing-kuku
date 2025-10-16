import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
}

interface StockTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  item: InventoryItem | null;
}

interface TransactionData {
  transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  unit_cost: number;
  reference_number: string;
  supplier: string;
  reason: string;
  notes: string;
}

const StockTransactionModal: React.FC<StockTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<TransactionData>({
    transaction_type: 'IN',
    quantity: 0,
    unit_cost: 0,
    reference_number: '',
    supplier: '',
    reason: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item) return;
    
    try {
      setSaving(true);
      setError(null);

      // Get farmer ID
      const { data: farmer } = await supabase
        .from('farmers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!farmer) {
        setError('Farmer profile not found');
        return;
      }

      // Validate quantity for OUT transactions
      if (formData.transaction_type === 'OUT' && formData.quantity > item.current_stock) {
        setError('Cannot remove more stock than available');
        return;
      }

      // Create transaction
      const { error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert([{
          inventory_item_id: item.id,
          farmer_id: farmer.id,
          transaction_type: formData.transaction_type,
          quantity: formData.quantity,
          unit_cost: formData.unit_cost,
          reference_number: formData.reference_number || null,
          supplier: formData.supplier || null,
          reason: formData.reason || null,
          notes: formData.notes || null,
          created_by: user?.id
        }]);

      if (transactionError) {
        if (transactionError.code === 'PGRST116' || 
            transactionError.message.includes('does not exist') ||
            transactionError.code === 'PGRST205') {
          throw new Error('Inventory system is not available. Please contact support to set up inventory management.');
        }
        throw transactionError;
      }

      // Reset form
      setFormData({
        transaction_type: 'IN',
        quantity: 0,
        unit_cost: 0,
        reference_number: '',
        supplier: '',
        reason: '',
        notes: ''
      });

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving transaction:', err);
      setError('Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof TransactionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getTransactionIcon = () => {
    switch (formData.transaction_type) {
      case 'IN': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'OUT': return <TrendingDown className="w-5 h-5 text-red-600" />;
      case 'ADJUSTMENT': return <RotateCcw className="w-5 h-5 text-blue-600" />;
      default: return <TrendingUp className="w-5 h-5 text-green-600" />;
    }
  };

  const getTransactionColor = () => {
    switch (formData.transaction_type) {
      case 'IN': return 'border-green-200 bg-green-50';
      case 'OUT': return 'border-red-200 bg-red-50';
      case 'ADJUSTMENT': return 'border-blue-200 bg-blue-50';
      default: return 'border-green-200 bg-green-50';
    }
  };

  const calculateNewStock = () => {
    if (!item) return 0;
    
    switch (formData.transaction_type) {
      case 'IN': return item.current_stock + formData.quantity;
      case 'OUT': return item.current_stock - formData.quantity;
      case 'ADJUSTMENT': return formData.quantity;
      default: return item.current_stock;
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${getTransactionColor()}`}>
                {getTransactionIcon()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Stock Transaction</h2>
                <p className="text-sm text-gray-600">{item.name}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Current Stock Info */}
          <div className={`mb-6 p-4 rounded-lg ${getTransactionColor()}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Current Stock:</span>
              <span className="text-lg font-semibold text-gray-900">
                {item.current_stock} {item.unit}
              </span>
            </div>
            {formData.quantity > 0 && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">New Stock:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {calculateNewStock()} {item.unit}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction Type */}
            <div>
              <Label>Transaction Type *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  type="button"
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.transaction_type === 'IN'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => handleInputChange('transaction_type', 'IN')}
                >
                  <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Stock In</span>
                </button>
                
                <button
                  type="button"
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.transaction_type === 'OUT'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => handleInputChange('transaction_type', 'OUT')}
                >
                  <TrendingDown className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Stock Out</span>
                </button>
                
                <button
                  type="button"
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    formData.transaction_type === 'ADJUSTMENT'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => handleInputChange('transaction_type', 'ADJUSTMENT')}
                >
                  <RotateCcw className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Adjust</span>
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <Label htmlFor="quantity">
                {formData.transaction_type === 'ADJUSTMENT' ? 'New Stock Level' : 'Quantity'} * ({item.unit})
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('quantity', parseFloat(e.target.value) || 0)
                }
                required
              />
              {formData.transaction_type === 'OUT' && formData.quantity > item.current_stock && (
                <p className="text-sm text-red-600 mt-1">
                  Cannot exceed available stock ({item.current_stock} {item.unit})
                </p>
              )}
            </div>

            {/* Unit Cost */}
            <div>
              <Label htmlFor="unit_cost">Unit Cost</Label>
              <Input
                id="unit_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('unit_cost', parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
              />
            </div>

            {/* Reference Number */}
            <div>
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('reference_number', e.target.value)
                }
                placeholder="Invoice #, PO #, etc."
              />
            </div>

            {/* Supplier (for IN transactions) */}
            {formData.transaction_type === 'IN' && (
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleInputChange('supplier', e.target.value)
                  }
                  placeholder="Supplier name"
                />
              </div>
            )}

            {/* Reason */}
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  handleInputChange('reason', e.target.value)
                }
                placeholder={
                  formData.transaction_type === 'IN' 
                    ? 'Purchase, transfer in, etc.'
                    : formData.transaction_type === 'OUT'
                    ? 'Usage, sale, waste, etc.'
                    : 'Stock count, correction, etc.'
                }
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                  handleInputChange('notes', e.target.value)
                }
                placeholder="Additional notes (optional)"
                className="w-full p-2 border border-gray-300 rounded-md resize-none"
                rows={3}
              />
            </div>

            {/* Total Cost Display */}
            {formData.quantity > 0 && formData.unit_cost > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Cost:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ${(formData.quantity * formData.unit_cost).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || formData.quantity <= 0}>
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <span>Save Transaction</span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default StockTransactionModal;
