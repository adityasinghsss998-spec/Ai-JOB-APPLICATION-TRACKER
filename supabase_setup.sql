-- SUPABASE SETUP SCRIPT
-- Paste this script into the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query) and run it.

-- =========================================================================
-- 1. ENUMS AND SCHEMAS
-- =========================================================================

-- Create application status enum if it does not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE application_status AS ENUM ('saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn');
  END IF;
END $$;

-- =========================================================================
-- 2. TABLES CREATION & MODIFICATION
-- =========================================================================

-- A. Profiles Table Setup
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    phone TEXT,
    location TEXT,
    summary TEXT,
    skills TEXT[],
    current_company TEXT,
    current_job_title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all expected columns exist on profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_job_title TEXT;

-- B. Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    status application_status NOT NULL DEFAULT 'saved',
    applied_at TIMESTAMPTZ,
    job_url TEXT,
    location TEXT,
    salary_range TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- C. Resumes Table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    parsed_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- A. Profiles Policies
DROP POLICY IF EXISTS "Users can view any profile" ON public.profiles;
CREATE POLICY "Users can view any profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- B. Job Applications Policies
DROP POLICY IF EXISTS "Users can manage their own job applications" ON public.job_applications;
CREATE POLICY "Users can manage their own job applications" 
ON public.job_applications
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- C. Resumes Policies
DROP POLICY IF EXISTS "Users can manage their own resumes" ON public.resumes;
CREATE POLICY "Users can manage their own resumes" 
ON public.resumes
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- 4. SIGN-UP TRIGGER FOR PROFILES
-- =========================================================================

-- Create a trigger function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 5. STORAGE BUCKET AND STORAGE SECURITY POLICIES
-- =========================================================================

-- Create resumes bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to resumes
DROP POLICY IF EXISTS "Public Read Resumes" ON storage.objects;
CREATE POLICY "Public Read Resumes"
ON storage.objects FOR SELECT
USING ( bucket_id = 'resumes' );

-- Allow users to upload resumes to their own folder
DROP POLICY IF EXISTS "Insert Own Resumes" ON storage.objects;
CREATE POLICY "Insert Own Resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own resumes
DROP POLICY IF EXISTS "Update Own Resumes" ON storage.objects;
CREATE POLICY "Update Own Resumes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own resumes
DROP POLICY IF EXISTS "Delete Own Resumes" ON storage.objects;
CREATE POLICY "Delete Own Resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
