-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Tables
CREATE TABLE public.charities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    website_url TEXT,
    upcoming_golf_days TEXT,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    selected_charity_id UUID REFERENCES public.charities(id) ON DELETE SET NULL,
    charity_contribution_percentage NUMERIC CHECK (charity_contribution_percentage >= 0 AND charity_contribution_percentage <= 100),
    role TEXT DEFAULT 'subscriber'::text NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_type TEXT NOT NULL,
    status TEXT NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
    score_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, score_date)
);

CREATE TABLE public.draws (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    draw_month DATE NOT NULL,
    draw_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    draw_mode TEXT NOT NULL,
    generated_numbers INTEGER[],
    simulation_result JSONB,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.draw_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    numbers INTEGER[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.prize_pools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
    total_pool NUMERIC DEFAULT 0 NOT NULL,
    jackpot_amount NUMERIC DEFAULT 0 NOT NULL,
    three_match_amount NUMERIC DEFAULT 0 NOT NULL,
    four_match_amount NUMERIC DEFAULT 0 NOT NULL,
    five_match_amount NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.draw_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    match_count INTEGER NOT NULL,
    prize_tier TEXT,
    prize_amount NUMERIC DEFAULT 0 NOT NULL,
    verification_status TEXT DEFAULT 'pending' NOT NULL,
    payout_status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.winner_claims (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    draw_result_id UUID REFERENCES public.draw_results(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    proof_url TEXT,
    verification_status TEXT DEFAULT 'pending' NOT NULL,
    admin_notes TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    payout_status TEXT DEFAULT 'pending' NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.donations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    charity_id UUID REFERENCES public.charities(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    percentage NUMERIC,
    donation_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Security / Admin Helper Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'subscriber'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Row Level Security (RLS) Enable
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winner_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Charities: Public can read active charities. Admins can do all.
CREATE POLICY "Public can read active charities" ON public.charities FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can insert charities" ON public.charities FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update charities" ON public.charities FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete charities" ON public.charities FOR DELETE USING (public.is_admin());

-- Profiles: Users can read/update own. Admins can do all.
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.is_admin());

-- Subscriptions: Users can read own. Admins can do all.
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can do all on subscriptions" ON public.subscriptions FOR ALL USING (public.is_admin());

-- Scores: Users can read/insert/update/delete own. Admins can read/delete.
CREATE POLICY "Users can do all on own scores" ON public.scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can do all on scores" ON public.scores FOR ALL USING (public.is_admin());

-- Draws: Users can read published draws. Admins can do all.
CREATE POLICY "Users can read published draws" ON public.draws FOR SELECT USING (status = 'published' OR status = 'completed');
CREATE POLICY "Admins can do all on draws" ON public.draws FOR ALL USING (public.is_admin());

-- Draw Entries: Users can read own. Admins can do all.
CREATE POLICY "Users can read own draw entries" ON public.draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can do all on draw entries" ON public.draw_entries FOR ALL USING (public.is_admin());

-- Prize Pools: Users can read for published draws. Admins can do all.
CREATE POLICY "Users can read prize pools for published draws" ON public.prize_pools FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.draws WHERE id = draw_id AND (status = 'published' OR status = 'completed'))
);
CREATE POLICY "Admins can do all on prize pools" ON public.prize_pools FOR ALL USING (public.is_admin());

-- Draw Results: Users can read own. Admins can do all.
CREATE POLICY "Users can read own draw results" ON public.draw_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can do all on draw results" ON public.draw_results FOR ALL USING (public.is_admin());

-- Winner Claims: Users can read/insert own. Admins can do all.
CREATE POLICY "Users can read own winner claims" ON public.winner_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own winner claims" ON public.winner_claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can do all on winner claims" ON public.winner_claims FOR ALL USING (public.is_admin());

-- Donations: Users can read/insert own. Admins can do all.
CREATE POLICY "Users can read own donations" ON public.donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own donations" ON public.donations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can do all on donations" ON public.donations FOR ALL USING (public.is_admin());

-- 5. Indexes
CREATE INDEX idx_profiles_charity ON public.profiles(selected_charity_id);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_scores_user ON public.scores(user_id);
CREATE INDEX idx_scores_date ON public.scores(score_date);
CREATE INDEX idx_draw_entries_draw ON public.draw_entries(draw_id);
CREATE INDEX idx_draw_entries_user ON public.draw_entries(user_id);
CREATE INDEX idx_prize_pools_draw ON public.prize_pools(draw_id);
CREATE INDEX idx_draw_results_draw ON public.draw_results(draw_id);
CREATE INDEX idx_draw_results_user ON public.draw_results(user_id);
CREATE INDEX idx_winner_claims_result ON public.winner_claims(draw_result_id);
CREATE INDEX idx_winner_claims_user ON public.winner_claims(user_id);
CREATE INDEX idx_donations_user ON public.donations(user_id);
CREATE INDEX idx_donations_charity ON public.donations(charity_id);
CREATE INDEX idx_donations_subscription ON public.donations(subscription_id);

-- 6. Storage Buckets (Execute after storage extension is available, using Supabase Storage API)
-- In raw SQL for Supabase:
INSERT INTO storage.buckets (id, name, public) VALUES ('charity_images', 'charity_images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('winner_proofs', 'winner_proofs', false) ON CONFLICT (id) DO NOTHING;

-- Storage RLS (Assuming storage.objects table)
CREATE POLICY "Public can view charity images" ON storage.objects FOR SELECT USING (bucket_id = 'charity_images');
CREATE POLICY "Admins can upload charity images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'charity_images' AND public.is_admin());
CREATE POLICY "Admins can update charity images" ON storage.objects FOR UPDATE USING (bucket_id = 'charity_images' AND public.is_admin());
CREATE POLICY "Admins can delete charity images" ON storage.objects FOR DELETE USING (bucket_id = 'charity_images' AND public.is_admin());

CREATE POLICY "Public can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own winner proofs" ON storage.objects FOR SELECT USING (bucket_id = 'winner_proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all winner proofs" ON storage.objects FOR SELECT USING (bucket_id = 'winner_proofs' AND public.is_admin());
CREATE POLICY "Users can upload own winner proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'winner_proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can manage all winner proofs" ON storage.objects FOR ALL USING (bucket_id = 'winner_proofs' AND public.is_admin());

-- 7. Seed Data
INSERT INTO public.charities (name, description, is_active, is_featured) VALUES
('Green Earth Alliance', 'Protecting natural habitats and fighting climate change.', true, true),
('Local Food Bank Network', 'Providing nutritious meals to families in need.', true, false),
('Education For All', 'Supplying school materials and tutoring to underprivileged children.', true, true),
('Animal Rescue Coalition', 'Rescuing and rehabilitating abandoned pets and wildlife.', true, false),
('Veterans Support Trust', 'Helping military veterans transition to civilian life.', true, false);
