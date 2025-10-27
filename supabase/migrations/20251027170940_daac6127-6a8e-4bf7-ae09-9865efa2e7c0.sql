-- Add missing settings for Programmer Calculator mode

-- Categorie principali
INSERT INTO calculator_settings (function_key, function_name, category, is_enabled, mode)
VALUES 
  ('word_size', 'Selettore Word Size', 'programmer', true, 'programmer'),
  ('conversions_prog', 'Conversioni di Base', 'programmer', true, 'programmer'),
  ('bitwise_ops', 'Operazioni Bitwise', 'programmer', true, 'programmer'),
  ('shift_ops', 'Operazioni Shift', 'programmer', true, 'programmer');

-- Funzioni Bitwise individuali
INSERT INTO calculator_settings (function_key, function_name, category, is_enabled, mode)
VALUES 
  ('and', 'AND Bitwise', 'programmer', true, 'programmer'),
  ('or', 'OR Bitwise', 'programmer', true, 'programmer'),
  ('xor', 'XOR Bitwise', 'programmer', true, 'programmer'),
  ('not', 'NOT Bitwise', 'programmer', true, 'programmer'),
  ('nand', 'NAND Bitwise', 'programmer', true, 'programmer'),
  ('nor', 'NOR Bitwise', 'programmer', true, 'programmer');

-- Funzioni Shift individuali
INSERT INTO calculator_settings (function_key, function_name, category, is_enabled, mode)
VALUES 
  ('lsh', 'Left Shift (<<)', 'programmer', true, 'programmer'),
  ('rsh', 'Right Shift (>>)', 'programmer', true, 'programmer'),
  ('rol', 'Rotate Left (ROL)', 'programmer', true, 'programmer'),
  ('ror', 'Rotate Right (ROR)', 'programmer', true, 'programmer');