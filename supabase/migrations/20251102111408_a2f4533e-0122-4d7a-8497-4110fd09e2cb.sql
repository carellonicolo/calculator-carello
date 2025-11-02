-- Fix 1: Add missing DELETE policies for configuration tables
-- These policies ensure only admins can delete critical configuration data

CREATE POLICY "Only admins can delete calculator settings"
ON public.calculator_settings
FOR DELETE
TO authenticated
USING (is_admin());

CREATE POLICY "Only admins can delete calculator modes"
ON public.calculator_modes
FOR DELETE
TO authenticated
USING (is_admin());

CREATE POLICY "Only admins can delete global settings"
ON public.global_settings
FOR DELETE
TO authenticated
USING (is_admin());

-- Fix 2: Replace recursive RLS policies on user_roles table
-- The existing policies query user_roles within user_roles policies, causing recursion
-- Replace with non-recursive policies using the is_admin() SECURITY DEFINER function

DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can view user roles" ON public.user_roles;

CREATE POLICY "Only admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Only admins can view user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (is_admin());