-- =====================================================================
-- OTTIMIZZAZIONE DATABASE: Indici per migliorare le performance delle query
-- =====================================================================

-- Indice per query frequenti su calculator_settings filtrate per mode
-- Utilizzato in AdminDashboard.fetchSettings() e Calculator.fetchSettings()
CREATE INDEX IF NOT EXISTS idx_calculator_settings_mode 
ON calculator_settings(mode);

-- Indice per query filtrate per category (groupSettingsByMode, toggleCategoryFeatures)
CREATE INDEX IF NOT EXISTS idx_calculator_settings_category 
ON calculator_settings(category);

-- Indice per ricerche veloci per function_key (controllo abilitazione funzioni)
CREATE INDEX IF NOT EXISTS idx_calculator_settings_function_key 
ON calculator_settings(function_key);

-- Indice composito per query che filtrano per mode e category insieme
CREATE INDEX IF NOT EXISTS idx_calculator_settings_mode_category 
ON calculator_settings(mode, category);

-- Indice per ricerche veloci in global_settings per setting_key
-- Utilizzato in fetchGlobalSettings() con .eq("setting_key", "calculator_enabled")
CREATE INDEX IF NOT EXISTS idx_global_settings_setting_key 
ON global_settings(setting_key);

-- Indice per ordinamento in calculator_modes
CREATE INDEX IF NOT EXISTS idx_calculator_modes_display_order 
ON calculator_modes(display_order);