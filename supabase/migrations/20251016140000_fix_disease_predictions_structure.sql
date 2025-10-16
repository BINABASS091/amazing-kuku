-- Fix disease_predictions table structure to match code expectations
-- Add farmer_id column and update structure

-- First, let's add the farmer_id column
ALTER TABLE public.disease_predictions ADD COLUMN IF NOT EXISTS farmer_id UUID;

-- Add foreign key constraint
ALTER TABLE public.disease_predictions 
ADD CONSTRAINT fk_disease_predictions_farmer_id 
FOREIGN KEY (farmer_id) REFERENCES public.farmers(id) ON DELETE CASCADE;

-- Update existing records to set farmer_id based on user_id
UPDATE public.disease_predictions 
SET farmer_id = (
  SELECT id FROM public.farmers WHERE user_id = disease_predictions.user_id
)
WHERE farmer_id IS NULL AND user_id IS NOT NULL;

-- Add index for farmer_id
CREATE INDEX IF NOT EXISTS idx_disease_predictions_farmer_id ON public.disease_predictions(farmer_id);

-- Update RLS policies to work with farmer_id
DROP POLICY IF EXISTS "Allow users to view their own predictions" ON public.disease_predictions;
DROP POLICY IF EXISTS "Allow users to insert their own predictions" ON public.disease_predictions;

-- Create new RLS policies
CREATE POLICY "disease_predictions_select_policy" ON public.disease_predictions
  FOR SELECT TO authenticated USING (
    farmer_id IN (
      SELECT id FROM public.farmers WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "disease_predictions_insert_policy" ON public.disease_predictions
  FOR INSERT TO authenticated WITH CHECK (
    farmer_id IN (
      SELECT id FROM public.farmers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "disease_predictions_update_policy" ON public.disease_predictions
  FOR UPDATE TO authenticated USING (
    farmer_id IN (
      SELECT id FROM public.farmers WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "disease_predictions_delete_policy" ON public.disease_predictions
  FOR DELETE TO authenticated USING (
    farmer_id IN (
      SELECT id FROM public.farmers WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
