-- Enum per i ruoli applicativi
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Tabella per gestire i ruoli degli utenti
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL DEFAULT 'user',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Indice per performance nelle query sui ruoli
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Abilita Row Level Security sulla tabella user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Solo gli admin possono visualizzare i ruoli
CREATE POLICY "Only admins can view user roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Solo gli admin possono gestire i ruoli
CREATE POLICY "Only admins can manage user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Funzione con SECURITY DEFINER per verificare se un utente ha un ruolo specifico
-- Bypassa RLS per evitare ricorsione infinita
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Funzione helper per controllare se l'utente corrente è admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

-- Rimuovere le vecchie policy troppo permissive
DROP POLICY IF EXISTS "Authenticated users can update calculator settings" ON public.calculator_settings;
DROP POLICY IF EXISTS "Authenticated users can insert calculator settings" ON public.calculator_settings;
DROP POLICY IF EXISTS "Authenticated users can update calculator modes" ON public.calculator_modes;
DROP POLICY IF EXISTS "Authenticated users can update global settings" ON public.global_settings;

-- Nuove policy sicure: SOLO ADMIN può modificare
CREATE POLICY "Only admins can update calculator settings"
ON public.calculator_settings FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can insert calculator settings"
ON public.calculator_settings FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update calculator modes"
ON public.calculator_modes FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update global settings"
ON public.global_settings FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Funzione trigger per assegnare automaticamente ruolo 'user' ai nuovi utenti
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Trigger che si attiva alla creazione di un nuovo utente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();