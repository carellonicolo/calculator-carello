-- Tabella per gestire le modalità della calcolatrice
CREATE TABLE calculator_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_key text UNIQUE NOT NULL,
  mode_name text NOT NULL,
  description text,
  is_enabled boolean DEFAULT true NOT NULL,
  display_order integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Popolare con le 3 modalità di default
INSERT INTO calculator_modes (mode_key, mode_name, description, is_enabled, display_order) VALUES
  ('standard', 'Standard', 'Calcolatrice base con operazioni aritmetiche fondamentali', true, 1),
  ('scientific', 'Scientifica', 'Calcolatrice scientifica con funzioni trigonometriche, logaritmi e altro', true, 2),
  ('programmer', 'Programmatore', 'Calcolatrice per programmatori con operazioni bitwise e conversioni di base', true, 3);

-- RLS Policies
ALTER TABLE calculator_modes ENABLE ROW LEVEL SECURITY;

-- Chiunque può leggere le modalità
CREATE POLICY "Anyone can view calculator modes"
  ON calculator_modes FOR SELECT
  TO public
  USING (true);

-- Solo utenti autenticati possono aggiornare
CREATE POLICY "Authenticated users can update calculator modes"
  ON calculator_modes FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Trigger per updated_at
CREATE TRIGGER update_calculator_modes_updated_at
  BEFORE UPDATE ON calculator_modes
  FOR EACH ROW
  EXECUTE FUNCTION update_calculator_settings_updated_at();