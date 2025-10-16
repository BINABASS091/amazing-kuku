import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import SubscriptionGuard from '../../components/SubscriptionGuard';
import AddInventoryItemModal from '../../components/AddInventoryItemModal';
import StockTransactionModal from '../../components/StockTransactionModal';
import { 
  Package, 
  Plus, 
  AlertTriangle, 
  TrendingDown,
  TrendingUp,
  DollarSign,
  Eye
} from 'lucide-react';

interface InventoryItem {
  id: string;
  farmer_id: string;
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
  created_at: string;
  updated_at: string;
  category: {
    name: string;
    icon: string;
    color: string;
  };
  farm: {
    name: string;
  };
}

interface InventoryAlert {
  id: string;
  inventory_item_id: string;
  alert_type: 'LOW_STOCK' | 'EXPIRED' | 'EXPIRING_SOON';
  message: string;
  is_read: boolean;
  created_at: string;
  inventory_item: {
    name: string;
  };
}

const InventoryManagement: React.FC = () => {
  const { user } = useAuth();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inventorySystemAvailable, setInventorySystemAvailable] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
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

      // Fetch inventory items and alerts with error handling for missing tables
      let inventoryData: InventoryItem[] = [];
      let alertsData: InventoryAlert[] = [];

      try {
        const inventoryResponse = await supabase
          .from('inventory_items')
          .select(`
            *,
            category:inventory_categories(*),
            farm:farms(name)
          `)
          .eq('farmer_id', farmer.id)
          .order('name');

        if (inventoryResponse.error) {
          // Handle case where table doesn't exist
          if (inventoryResponse.error.code === 'PGRST116' || 
              inventoryResponse.error.message.includes('does not exist') ||
              inventoryResponse.error.code === 'PGRST205') {
            console.log('Inventory tables not found, using empty data');
            setInventorySystemAvailable(false);
            inventoryData = [];
          } else {
            throw inventoryResponse.error;
          }
        } else {
          inventoryData = inventoryResponse.data || [];
        }
      } catch (error) {
        console.error('Error fetching inventory items:', error);
        inventoryData = [];
      }

      try {
        const alertsResponse = await supabase
          .from('inventory_alerts')
          .select(`
            *,
            inventory_item:inventory_items(name)
          `)
          .eq('farmer_id', farmer.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false });

        if (alertsResponse.error) {
          // Handle case where table doesn't exist
          if (alertsResponse.error.code === 'PGRST116' || 
              alertsResponse.error.message.includes('does not exist') ||
              alertsResponse.error.code === 'PGRST205') {
            console.log('Inventory alerts table not found, using empty data');
            alertsData = [];
          } else {
            throw alertsResponse.error;
          }
        } else {
          alertsData = alertsResponse.data || [];
        }
      } catch (error) {
        console.error('Error fetching inventory alerts:', error);
        alertsData = [];
      }

      setInventoryItems(inventoryData);
      setAlerts(alertsData);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      // Don't set error if it's just missing tables - we handle that gracefully above
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock <= 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100' };
    if (item.current_stock <= item.min_stock_level) return { status: 'low', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const getTotalInventoryValue = () => {
    return inventoryItems.reduce((total, item) => {
      return total + (item.current_stock * item.unit_cost);
    }, 0);
  };

  const getLowStockCount = () => {
    return inventoryItems.filter(item => item.current_stock <= item.min_stock_level).length;
  };

  const getCategoryIcon = () => {
    return Package; // Simple fallback for now
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <SubscriptionGuard feature="Inventory Management" planRequired="BASIC">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-2">Track and manage your farm supplies and equipment</p>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!inventorySystemAvailable}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* System Unavailable Message */}
        {!inventorySystemAvailable && (
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-yellow-800">Inventory System Not Available</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  The inventory management system is not set up yet. Please contact support to enable this feature for your account.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{inventoryItems.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">${getTotalInventoryValue().toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{getLowStockCount()}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">{alerts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="p-6 border-l-4 border-yellow-500 bg-yellow-50">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-yellow-800">Inventory Alerts</h3>
                <div className="mt-2 space-y-1">
                  {alerts.slice(0, 3).map((alert) => (
                    <p key={alert.id} className="text-sm text-yellow-700">
                      {alert.message}
                    </p>
                  ))}
                  {alerts.length > 3 && (
                    <p className="text-sm text-yellow-600">
                      +{alerts.length - 3} more alerts
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Inventory Items */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Items</h3>
            <Button 
              onClick={() => setShowAddModal(true)}
              variant="outline" 
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
          
          {inventoryItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No inventory items yet</h3>
              <p className="text-gray-600 mb-6">
                Start by adding your first inventory item to track your farm supplies and equipment
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {inventoryItems.map((item) => {
                const stockStatus = getStockStatus(item);
                const CategoryIcon = getCategoryIcon();
                
                return (
                  <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-blue-100`}>
                          <CategoryIcon className={`w-5 h-5 text-blue-600`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.category?.name}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowTransactionModal(true);
                          }}
                        >
                          <TrendingUp className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Stock</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                          {item.current_stock} {item.unit}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Min Level</span>
                        <span className="text-sm text-gray-900">{item.min_stock_level} {item.unit}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Unit Cost</span>
                        <span className="text-sm text-gray-900">${item.unit_cost}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Value</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${(item.current_stock * item.unit_cost).toFixed(2)}
                        </span>
                      </div>
                      
                      {item.location && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Location:</span> {item.location}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>

        {/* Modals */}
        {showAddModal && (
          <AddInventoryItemModal
            isOpen={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setSelectedItem(null);
            }}
            onSave={fetchData}
            item={selectedItem}
          />
        )}

        {showTransactionModal && selectedItem && (
          <StockTransactionModal
            isOpen={showTransactionModal}
            onClose={() => {
              setShowTransactionModal(false);
              setSelectedItem(null);
            }}
            onSave={fetchData}
            item={selectedItem}
          />
        )}
      </div>
    </SubscriptionGuard>
  );
};

export default InventoryManagement;
