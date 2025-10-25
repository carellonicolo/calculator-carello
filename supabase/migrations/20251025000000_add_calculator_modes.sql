-- Create calculator_modes table to manage different calculator modes
CREATE TABLE public.calculator_modes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mode_key TEXT NOT NULL UNIQUE,
  mode_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.calculator_modes ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read modes
CREATE POLICY "Anyone can view calculator modes"
ON public.calculator_modes
FOR SELECT
USING (true);

-- Only authenticated users can update modes
CREATE POLICY "Authenticated users can update calculator modes"
ON public.calculator_modes
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calculator_modes_updated_at
BEFORE UPDATE ON public.calculator_modes
FOR EACH ROW
EXECUTE FUNCTION public.update_calculator_settings_updated_at();

-- Add mode column to calculator_settings
ALTER TABLE public.calculator_settings ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'scientific';

-- Insert the three calculator modes
INSERT INTO public.calculator_modes (mode_key, mode_name, description, is_enabled, display_order) VALUES
('standard', 'Standard', 'Calcolatrice base con operazioni aritmetiche fondamentali', true, 1),
('scientific', 'Scientifica', 'Calcolatrice scientifica con funzioni trigonometriche, logaritmi e altro', true, 2),
('programmer', 'Programmatore', 'Calcolatrice per programmatori con operazioni bitwise e conversioni di base', true, 3);

-- Update existing settings to be in scientific mode
UPDATE public.calculator_settings SET mode = 'scientific' WHERE category = 'scientific';
UPDATE public.calculator_settings SET mode = 'programmer' WHERE category = 'conversions';

-- Insert new functions for Standard mode
INSERT INTO public.calculator_settings (function_key, function_name, category, mode, is_enabled) VALUES
('standard_mode', 'Modalità Standard', 'standard', 'standard', true),
('memory_functions', 'Funzioni Memoria (MC, MR, M+, M-, MS)', 'standard', 'standard', true),
('square', 'Quadrato (x²)', 'standard', 'standard', true),
('reciprocal', 'Reciproco (1/x)', 'standard', 'standard', true);

-- Insert new functions for Scientific mode (in addition to existing ones)
INSERT INTO public.calculator_settings (function_key, function_name, category, mode, is_enabled) VALUES
('scientific_mode', 'Modalità Scientifica', 'scientific', 'scientific', true),
('hyperbolic', 'Funzioni Iperboliche', 'scientific', 'scientific', true),
('sinh', 'Seno Iperbolico (sinh)', 'scientific', 'scientific', true),
('cosh', 'Coseno Iperbolico (cosh)', 'scientific', 'scientific', true),
('tanh', 'Tangente Iperbolica (tanh)', 'scientific', 'scientific', true),
('log2', 'Logaritmo Base 2 (log₂)', 'scientific', 'scientific', true),
('pow10', 'Potenza di 10 (10^x)', 'scientific', 'scientific', true),
('pow2', 'Potenza di 2 (2^x)', 'scientific', 'scientific', true),
('square_sci', 'Quadrato (x²)', 'scientific', 'scientific', true),
('cube', 'Cubo (x³)', 'scientific', 'scientific', true),
('nthroot', 'Radice n-esima (ⁿ√x)', 'scientific', 'scientific', true),
('permutation', 'Permutazioni (nPr)', 'scientific', 'scientific', true),
('combination', 'Combinazioni (nCr)', 'scientific', 'scientific', true),
('phi', 'Costante Phi (φ)', 'scientific', 'scientific', true),
('deg_rad', 'Conversione Gradi/Radianti', 'scientific', 'scientific', true),
('abs', 'Valore Assoluto (|x|)', 'scientific', 'scientific', true),
('floor', 'Arrotonda per difetto (⌊x⌋)', 'scientific', 'scientific', true),
('ceil', 'Arrotonda per eccesso (⌈x⌉)', 'scientific', 'scientific', true),
('round', 'Arrotonda (round)', 'scientific', 'scientific', true),
('mod', 'Modulo (mod)', 'scientific', 'scientific', true),
('reciprocal_sci', 'Reciproco (1/x)', 'scientific', 'scientific', true);

-- Insert new functions for Programmer mode
INSERT INTO public.calculator_settings (function_key, function_name, category, mode, is_enabled) VALUES
('programmer_mode', 'Modalità Programmatore', 'programmer', 'programmer', true),
('bitwise_ops', 'Operazioni Bitwise', 'programmer', 'programmer', true),
('and', 'AND Bitwise', 'programmer', 'programmer', true),
('or', 'OR Bitwise', 'programmer', 'programmer', true),
('xor', 'XOR Bitwise', 'programmer', 'programmer', true),
('not', 'NOT Bitwise', 'programmer', 'programmer', true),
('nand', 'NAND Bitwise', 'programmer', 'programmer', true),
('nor', 'NOR Bitwise', 'programmer', 'programmer', true),
('shift_ops', 'Operazioni di Shift', 'programmer', 'programmer', true),
('lsh', 'Left Shift (<<)', 'programmer', 'programmer', true),
('rsh', 'Right Shift (>>)', 'programmer', 'programmer', true),
('rol', 'Rotate Left', 'programmer', 'programmer', true),
('ror', 'Rotate Right', 'programmer', 'programmer', true),
('conversions_prog', 'Conversioni Base', 'programmer', 'programmer', true),
('bin', 'Binario (BIN)', 'programmer', 'programmer', true),
('oct', 'Ottale (OCT)', 'programmer', 'programmer', true),
('dec', 'Decimale (DEC)', 'programmer', 'programmer', true),
('hex', 'Esadecimale (HEX)', 'programmer', 'programmer', true),
('word_size', 'Dimensione Word', 'programmer', 'programmer', true),
('byte_mode', 'BYTE (8 bit)', 'programmer', 'programmer', true),
('word_mode', 'WORD (16 bit)', 'programmer', 'programmer', true),
('dword_mode', 'DWORD (32 bit)', 'programmer', 'programmer', true),
('qword_mode', 'QWORD (64 bit)', 'programmer', 'programmer', true),
('complement_ops', 'Operazioni Complemento', 'programmer', 'programmer', true),
('ones_complement', 'Complemento a 1', 'programmer', 'programmer', true),
('twos_complement', 'Complemento a 2', 'programmer', 'programmer', true),
('bit_ops', 'Operazioni sui Bit', 'programmer', 'programmer', true),
('set_bit', 'Set Bit', 'programmer', 'programmer', true),
('clear_bit', 'Clear Bit', 'programmer', 'programmer', true),
('toggle_bit', 'Toggle Bit', 'programmer', 'programmer', true),
('count_bits', 'Conta Bit Settati', 'programmer', 'programmer', true),
('msb', 'Most Significant Bit', 'programmer', 'programmer', true),
('lsb', 'Least Significant Bit', 'programmer', 'programmer', true);
