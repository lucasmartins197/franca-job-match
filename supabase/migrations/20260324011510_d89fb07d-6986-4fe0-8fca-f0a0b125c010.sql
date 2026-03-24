
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  skill text NOT NULL,
  description text NOT NULL DEFAULT '',
  date date NOT NULL,
  time_start text NOT NULL,
  time_end text NOT NULL,
  payment numeric NOT NULL DEFAULT 0,
  slots integer NOT NULL DEFAULT 1,
  slots_remaining integer NOT NULL DEFAULT 1,
  neighborhood text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'aberta',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read jobs" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner can insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update jobs" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete jobs" ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, user_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own applications" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Job owner can read applications" ON public.applications FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.user_id = auth.uid())
);
CREATE POLICY "Users can insert applications" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS neighborhood text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS jobs_completed integer DEFAULT 0;
