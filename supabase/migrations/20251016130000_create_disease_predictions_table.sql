-- Create disease_predictions table for tracking AI disease prediction requests

CREATE TABLE IF NOT EXISTS smart_kuku.disease_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES smart_kuku.farmers(id) ON DELETE CASCADE,
  image_url TEXT,
  prediction_result JSONB,
  confidence_score DECIMAL(3,2),
  predicted_disease VARCHAR(200),
  recommendations TEXT,
  status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_disease_predictions_farmer_id ON smart_kuku.disease_predictions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_disease_predictions_created_at ON smart_kuku.disease_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_disease_predictions_status ON smart_kuku.disease_predictions(status);

-- Enable RLS
ALTER TABLE smart_kuku.disease_predictions ENABLE ROW LEVEL SECURITY;

-- Policies for disease_predictions
CREATE POLICY "disease_predictions_select_policy" ON smart_kuku.disease_predictions
  FOR SELECT TO authenticated USING (
    farmer_id IN (
      SELECT id FROM smart_kuku.farmers WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM smart_kuku.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "disease_predictions_insert_policy" ON smart_kuku.disease_predictions
  FOR INSERT TO authenticated WITH CHECK (
    farmer_id IN (
      SELECT id FROM smart_kuku.farmers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "disease_predictions_update_policy" ON smart_kuku.disease_predictions
  FOR UPDATE TO authenticated USING (
    farmer_id IN (
      SELECT id FROM smart_kuku.farmers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "disease_predictions_delete_policy" ON smart_kuku.disease_predictions
  FOR DELETE TO authenticated USING (
    farmer_id IN (
      SELECT id FROM smart_kuku.farmers WHERE user_id = auth.uid()
    )
  );
