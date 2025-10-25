-- Aggiungi colonna mode alla tabella calculator_settings
ALTER TABLE calculator_settings 
ADD COLUMN mode text NOT NULL DEFAULT 'scientific';

-- Aggiorna i valori esistenti basandosi sulla category
-- Operazioni bitwise e conversioni sono per programmer
UPDATE calculator_settings 
SET mode = 'programmer' 
WHERE category IN ('bitwise', 'conversions');

-- Funzioni base sono per standard
UPDATE calculator_settings 
SET mode = 'standard' 
WHERE category IN ('basic');

-- Tutte le altre (trigonometric, logarithmic, etc.) restano scientific
UPDATE calculator_settings 
SET mode = 'scientific' 
WHERE category NOT IN ('bitwise', 'conversions', 'basic');