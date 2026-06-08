-- HRReply.ai Database Schema
-- Run this in your Supabase SQL Editor

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  default_tone text DEFAULT 'friendly' CHECK (default_tone IN ('formal', 'friendly', 'hinglish')),
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  replies_used int DEFAULT 0,
  replies_reset_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  role_applied text NOT NULL DEFAULT '',
  stage text DEFAULT 'applied' CHECK (stage IN ('applied','screening','shortlisted','interview_scheduled','interviewed','offer_sent','hired','rejected')),
  last_contacted_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their candidates" ON public.candidates USING (auth.uid() = user_id);

-- Replies table
CREATE TABLE IF NOT EXISTS public.replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES public.candidates(id) ON DELETE SET NULL,
  reply_type text NOT NULL,
  tone text NOT NULL CHECK (tone IN ('formal', 'friendly', 'hinglish')),
  context_input text NOT NULL,
  generated_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their replies" ON public.replies USING (auth.uid() = user_id);

-- Templates table
CREATE TABLE IF NOT EXISTS public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  reply_type text NOT NULL,
  tone text NOT NULL CHECK (tone IN ('formal', 'friendly', 'hinglish')),
  prompt_snippet text NOT NULL DEFAULT '',
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read system and own templates" ON public.templates
  FOR SELECT USING (is_system = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own templates" ON public.templates
  FOR ALL USING (auth.uid() = user_id);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  razorpay_sub_id text,
  plan text NOT NULL CHECK (plan IN ('pro', 'team')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their subscriptions" ON public.subscriptions USING (auth.uid() = user_id);

-- Function to reset monthly reply count
CREATE OR REPLACE FUNCTION reset_monthly_replies()
RETURNS void AS $$
  UPDATE public.users
  SET replies_used = 0, replies_reset_at = now()
  WHERE plan = 'free'
    AND replies_reset_at < now() - INTERVAL '30 days';
$$ LANGUAGE SQL;
