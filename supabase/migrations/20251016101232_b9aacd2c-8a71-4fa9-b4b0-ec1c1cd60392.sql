-- Create table for calculator function settings
CREATE TABLE public.calculator_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_key TEXT NOT NULL UNIQUE,
  function_name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.calculator_settings ENABLE ROW LEVEL SECURITY;

-- Create policies - Allow public read access for calculator frontend
CREATE POLICY "Anyone can view calculator settings" 
ON public.calculator_settings 
FOR SELECT 
USING (true);

-- Only authenticated users (admin) can modify settings
CREATE POLICY "Authenticated users can update calculator settings" 
ON public.calculator_settings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert calculator settings" 
ON public.calculator_settings 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_calculator_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calculator_settings_updated_at
BEFORE UPDATE ON public.calculator_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_calculator_settings_updated_at();

-- Insert default settings for all calculator functions
INSERT INTO public.calculator_settings (function_key, function_name, category, is_enabled) VALUES
-- Base conversions
('base_conversions', 'Conversioni di Base', 'conversions', true),
('base_10_to_2', 'Decimale → Binario', 'conversions', true),
('base_10_to_8', 'Decimale → Ottale', 'conversions', true),
('base_10_to_16', 'Decimale → Esadecimale', 'conversions', true),
('base_2_to_10', 'Binario → Decimale', 'conversions', true),
('base_8_to_10', 'Ottale → Decimale', 'conversions', true),
('base_16_to_10', 'Esadecimale → Decimale', 'conversions', true),

-- Trigonometric functions
('trigonometric', 'Funzioni Trigonometriche', 'scientific', true),
('sin', 'Seno (sin)', 'scientific', true),
('cos', 'Coseno (cos)', 'scientific', true),
('tan', 'Tangente (tan)', 'scientific', true),
('asin', 'Arcoseno (asin)', 'scientific', true),
('acos', 'Arcocoseno (acos)', 'scientific', true),
('atan', 'Arcotangente (atan)', 'scientific', true),

-- Logarithms and exponentials
('logarithms', 'Logaritmi ed Esponenziali', 'scientific', true),
('log', 'Logaritmo base 10 (log)', 'scientific', true),
('ln', 'Logaritmo naturale (ln)', 'scientific', true),
('exp', 'Esponenziale (e^x)', 'scientific', true),
('power', 'Potenza (x^y)', 'scientific', true),

-- Roots and factorials
('advanced_ops', 'Radici e Fattoriali', 'scientific', true),
('sqrt', 'Radice Quadrata (√)', 'scientific', true),
('cbrt', 'Radice Cubica (∛)', 'scientific', true),
('factorial', 'Fattoriale (n!)', 'scientific', true),

-- Constants
('constants', 'Costanti Matematiche', 'scientific', true),
('pi', 'Pi greco (π)', 'scientific', true),
('e', 'Numero di Eulero (e)', 'scientific', true);