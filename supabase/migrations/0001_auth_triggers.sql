-- supabase/migrations/0001_auth_triggers.sql

-- 1. Create a function to handle new users from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    charity_contribution_percentage
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    -- Secure admin assignment for testing
    CASE
      WHEN new.email = 'admin@digitalheroes.com' THEN 'admin'::text
      ELSE 'subscriber'::text
    END,
    10 -- Default sensible minimum contribution percentage
  );
  
  RETURN new;
END;
$$;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
