-- Add inventory management tables to the smart_kuku schema

-- Inventory categories table
CREATE TABLE IF NOT EXISTS smart_kuku.inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- Icon name for UI
  color VARCHAR(20), -- Color for UI theming
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default inventory categories
INSERT INTO smart_kuku.inventory_categories (name, description, icon, color) VALUES
('Feed', 'Animal feed and supplements', 'grain', 'green'),
('Medicine', 'Veterinary medicines and vaccines', 'pill', 'red'),
('Equipment', 'Farm equipment and tools', 'wrench', 'blue'),
('Cleaning', 'Cleaning and disinfection supplies', 'spray-can', 'purple'),
('Other', 'Miscellaneous inventory items', 'box', 'gray')
ON CONFLICT (name) DO NOTHING;

-- Inventory items table
CREATE TABLE IF NOT EXISTS smart_kuku.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES smart_kuku.farmers(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES smart_kuku.farms(id) ON DELETE CASCADE,
  category_id UUID REFERENCES smart_kuku.inventory_categories(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  sku VARCHAR(100), -- Stock Keeping Unit
  unit VARCHAR(50) NOT NULL, -- kg, liters, pieces, etc.
  current_stock DECIMAL(10,2) DEFAULT 0,
  min_stock_level DECIMAL(10,2) DEFAULT 0, -- Reorder point
  max_stock_level DECIMAL(10,2), -- Maximum stock level
  unit_cost DECIMAL(10,2) DEFAULT 0,
  supplier VARCHAR(200),
  supplier_contact VARCHAR(100),
  expiry_date DATE,
  location VARCHAR(100), -- Storage location
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory transactions table (stock movements)
CREATE TABLE IF NOT EXISTS smart_kuku.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES smart_kuku.inventory_items(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES smart_kuku.farmers(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('IN', 'OUT', 'ADJUSTMENT')),
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  reference_number VARCHAR(100), -- Invoice number, batch number, etc.
  supplier VARCHAR(200),
  reason VARCHAR(200), -- Purchase, usage, wastage, etc.
  notes TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory alerts table
CREATE TABLE IF NOT EXISTS smart_kuku.inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES smart_kuku.inventory_items(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES smart_kuku.farmers(id) ON DELETE CASCADE,
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('LOW_STOCK', 'EXPIRED', 'EXPIRING_SOON')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_farmer_id ON smart_kuku.inventory_items(farmer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_farm_id ON smart_kuku.inventory_items(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category_id ON smart_kuku.inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON smart_kuku.inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON smart_kuku.inventory_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_farmer_id ON smart_kuku.inventory_transactions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON smart_kuku.inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_farmer_id ON smart_kuku.inventory_alerts(farmer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_read ON smart_kuku.inventory_alerts(is_read);

-- Function to update inventory stock after transaction
CREATE OR REPLACE FUNCTION smart_kuku.update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current stock based on transaction type
  UPDATE smart_kuku.inventory_items 
  SET current_stock = CASE 
    WHEN NEW.transaction_type = 'IN' THEN current_stock + NEW.quantity
    WHEN NEW.transaction_type = 'OUT' THEN current_stock - NEW.quantity
    WHEN NEW.transaction_type = 'ADJUSTMENT' THEN NEW.quantity
    ELSE current_stock
  END,
  updated_at = NOW()
  WHERE id = NEW.inventory_item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory stock updates
DROP TRIGGER IF EXISTS inventory_stock_update_trigger ON smart_kuku.inventory_transactions;
CREATE TRIGGER inventory_stock_update_trigger
  AFTER INSERT ON smart_kuku.inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION smart_kuku.update_inventory_stock();

-- Function to generate inventory alerts
CREATE OR REPLACE FUNCTION smart_kuku.generate_inventory_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for low stock
  IF NEW.current_stock <= NEW.min_stock_level AND NEW.min_stock_level > 0 THEN
    INSERT INTO smart_kuku.inventory_alerts (inventory_item_id, farmer_id, alert_type, message)
    VALUES (
      NEW.id,
      NEW.farmer_id,
      'LOW_STOCK',
      'Low stock alert: ' || NEW.name || ' is running low (' || NEW.current_stock || ' ' || NEW.unit || ' remaining)'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Check for expiring items (30 days before expiry)
  IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
    INSERT INTO smart_kuku.inventory_alerts (inventory_item_id, farmer_id, alert_type, message)
    VALUES (
      NEW.id,
      NEW.farmer_id,
      CASE 
        WHEN NEW.expiry_date <= CURRENT_DATE THEN 'EXPIRED'
        ELSE 'EXPIRING_SOON'
      END,
      CASE 
        WHEN NEW.expiry_date <= CURRENT_DATE THEN 'Expired: ' || NEW.name || ' expired on ' || NEW.expiry_date
        ELSE 'Expiring soon: ' || NEW.name || ' expires on ' || NEW.expiry_date
      END
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory alerts
DROP TRIGGER IF EXISTS inventory_alerts_trigger ON smart_kuku.inventory_items;
CREATE TRIGGER inventory_alerts_trigger
  AFTER INSERT OR UPDATE ON smart_kuku.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION smart_kuku.generate_inventory_alerts();

-- Row Level Security (RLS) policies

-- Enable RLS
ALTER TABLE smart_kuku.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_kuku.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_kuku.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_kuku.inventory_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for inventory_categories (readable by all authenticated users)
CREATE POLICY "inventory_categories_select_policy" ON smart_kuku.inventory_categories
  FOR SELECT TO authenticated USING (true);

-- Policies for inventory_items
CREATE POLICY "inventory_items_select_policy" ON smart_kuku.inventory_items
  FOR SELECT TO authenticated USING (
    farmer_id IN (
      SELECT id FROM smart_kuku.farmers WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM smart_kuku.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "inventory_items_insert_policy" ON smart_kuku.inventory_items
  FOR INSERT TO authenticated WITH CHECK (
    farmer_id IN (
      SELECT id FROM smart_kuku.farmers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "inventory_items_update_policy" ON smart_kuku.inventory_items
  FOR UPDATE TO authenticated USING (
    farmer_id IN (
      SELECT id FROM smart_kuku.farmers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "inventory_items_delete_policy" ON smart_kuku.inventory_items
  FOR DELETE TO authenticated USING (
    farmer_id IN (
      SELECT id FROM smart_kuku.farmers WHERE user_id = auth.uid()
    )
  );

-- Policies for inventory_transactions
CREATE POLICY "inventory_transactions_select_policy" ON smart_kuku.inventory_transactions
  FOR SELECT TO authenticated USING (
    farmer_id IN (
      SELECT id FROM smart_kuku.farmers WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM smart_kuku.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "inventory_transactions_insert_policy" ON smart_kuku.inventory_transactions
  FOR INSERT TO authenticated WITH CHECK (
    farmer_id IN (
      SELECT id FROM smart_kuku.farmers WHERE user_id = auth.uid()
    )
  );

-- Policies for inventory_alerts
CREATE POLICY "inventory_alerts_select_policy" ON smart_kuku.inventory_alerts
  FOR SELECT TO authenticated USING (
    farmer_id IN (
      SELECT id FROM smart_kuku.farmers WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM smart_kuku.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "inventory_alerts_update_policy" ON smart_kuku.inventory_alerts
  FOR UPDATE TO authenticated USING (
    farmer_id IN (
      SELECT id FROM smart_kuku.farmers WHERE user_id = auth.uid()
    )
  );
