import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Save, Package } from 'lucide-react';

interface InventoryItem {
  id?: string;
  farmer_id?: string;
  farm_id: string;
  category_id: string;
  name: string;
  description: string;
  sku: string;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  unit_cost: number;
  supplier: string;
  supplier_contact: string;
  expiry_date: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
}

interface InventoryCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface Farm {
  id: string;
  name: string;
}

interface AddInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  item?: InventoryItem | null;
}

const AddInventoryItemModal: React.FC<AddInventoryItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  item
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<InventoryItem>({
    farm_id: '',
    category_id: '',
    name: '',
    description: '',
    sku: '',
    unit: 'kg',
    current_stock: 0,
    min_stock_level: 0,
    max_stock_level: 0,
    unit_cost: 0,
    supplier: '',
    supplier_contact: '',
    expiry_date: '',
    location: '',
    status: 'ACTIVE'
  });
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFormData();
      if (item) {
        setFormData({
          ...item,
          expiry_date: item.expiry_date ? new Date(item.expiry_date).toISOString().split('T')[0] : ''
        });
      } else {
        setFormData({
          farm_id: '',
          category_id: '',
          name: '',
          description: '',
          sku: '',
          unit: 'kg',
          current_stock: 0,
          min_stock_level: 0,
          max_stock_level: 0,
          unit_cost: 0,
          supplier: '',
          supplier_contact: '',
          expiry_date: '',
          location: '',
          status: 'ACTIVE'
        });
      }
    }
  }, [isOpen, item]);

  const fetchFormData = async () => {
    try {
      setLoading(true);
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

      // Fetch categories and farms with error handling
      let categoriesData: InventoryCategory[] = [];
      let farmsData: Farm[] = [];

      try {
        const categoriesResponse = await supabase
          .from('inventory_categories')
          .select('*')
          .order('name');

        if (categoriesResponse.error) {
          if (categoriesResponse.error.code === 'PGRST116' || 
              categoriesResponse.error.message.includes('does not exist') ||
              categoriesResponse.error.code === 'PGRST205') {
            console.log('Inventory categories table not found, using empty data');
            categoriesData = [];
          } else {
            throw categoriesResponse.error;
          }
        } else {
          categoriesData = categoriesResponse.data || [];
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        categoriesData = [];
      }

      try {
        const farmsResponse = await supabase
          .from('farms')
          .select('id, name')
          .eq('farmer_id', farmer.id)
          .eq('status', 'ACTIVE')
          .order('name');

        if (farmsResponse.error) throw farmsResponse.error;
        farmsData = farmsResponse.data || [];
      } catch (error) {
        console.error('Error fetching farms:', error);
        farmsData = [];
      }

      setCategories(categoriesData);
      setFarms(farmsData);
    } catch (err) {
      console.error('Error fetching form data:', err);
      setError('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      // Prepare data
      const inventoryData = {
        ...formData,
        farmer_id: farmer.id,
        expiry_date: formData.expiry_date || null,
        updated_at: new Date().toISOString()
      };

      if (item?.id) {
        // Update existing item
        const { error } = await supabase
          .from('inventory_items')
          .update(inventoryData)
          .eq('id', item.id);

        if (error) {
          if (error.code === 'PGRST116' || 
              error.message.includes('does not exist') ||
              error.code === 'PGRST205') {
            throw new Error('Inventory system is not available. Please contact support to set up inventory management.');
          }
          throw error;
        }
      } else {
        // Create new item
        const { error } = await supabase
          .from('inventory_items')
          .insert([inventoryData]);

        if (error) {
          if (error.code === 'PGRST116' || 
              error.message.includes('does not exist') ||
              error.code === 'PGRST205') {
            throw new Error('Inventory system is not available. Please contact support to set up inventory management.');
          }
          throw error;
        }
      }

      onSave();
      onClose();
    } catch (err) {
      console.error('Error saving inventory item:', err);
      setError('Failed to save inventory item');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof InventoryItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {item ? 'Edit Inventory Item' : 'Add Inventory Item'}
                </h2>
                <p className="text-sm text-gray-600">
                  {item ? 'Update the details of this inventory item' : 'Add a new item to your inventory'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Broiler Feed Starter"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="e.g., BF-001"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the item"
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  rows={3}
                />
              </div>

              {/* Category and Farm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="farm">Farm *</Label>
                  <select
                    id="farm"
                    value={formData.farm_id}
                    onChange={(e) => handleInputChange('farm_id', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Farm</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>
                        {farm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <select
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="l">Liters (l)</option>
                    <option value="ml">Milliliters (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="bags">Bags</option>
                    <option value="bottles">Bottles</option>
                    <option value="boxes">Boxes</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="current_stock">Current Stock</Label>
                  <Input
                    id="current_stock"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.current_stock}
                    onChange={(e) => handleInputChange('current_stock', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_stock_level">Minimum Stock Level</Label>
                  <Input
                    id="min_stock_level"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_stock_level}
                    onChange={(e) => handleInputChange('min_stock_level', parseFloat(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="max_stock_level">Maximum Stock Level</Label>
                  <Input
                    id="max_stock_level"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.max_stock_level}
                    onChange={(e) => handleInputChange('max_stock_level', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Cost and Supplier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unit_cost">Unit Cost</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => handleInputChange('unit_cost', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder="Supplier name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplier_contact">Supplier Contact</Label>
                  <Input
                    id="supplier_contact"
                    value={formData.supplier_contact}
                    onChange={(e) => handleInputChange('supplier_contact', e.target.value)}
                    placeholder="Phone or email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Location and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Storage Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Warehouse A, Shelf 2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED')}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="DISCONTINUED">Discontinued</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>{item ? 'Update Item' : 'Add Item'}</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AddInventoryItemModal;
