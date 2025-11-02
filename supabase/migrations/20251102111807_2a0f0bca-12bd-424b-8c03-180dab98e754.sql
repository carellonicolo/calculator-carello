-- Add missing INSERT policies for configuration tables
-- This allows administrators to dynamically add new calculator modes and global settings

-- Add INSERT policy for calculator_modes
CREATE POLICY "Only admins can insert calculator modes"
ON public.calculator_modes
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Add INSERT policy for global_settings
CREATE POLICY "Only admins can insert global settings"
ON public.global_settings
FOR INSERT
TO authenticated
WITH CHECK (is_admin());