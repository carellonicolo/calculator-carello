-- Create global_settings table for calculator-wide settings
CREATE TABLE public.global_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read global settings (needed for calculator to check if it's enabled)
CREATE POLICY "Anyone can view global settings" 
ON public.global_settings 
FOR SELECT 
USING (true);

-- Only authenticated users can update global settings
CREATE POLICY "Authenticated users can update global settings" 
ON public.global_settings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_global_settings_updated_at
BEFORE UPDATE ON public.global_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_calculator_settings_updated_at();

-- Insert initial calculator_enabled setting
INSERT INTO public.global_settings (setting_key, setting_value, description)
VALUES ('calculator_enabled', true, 'Master switch to enable/disable entire calculator functionality');