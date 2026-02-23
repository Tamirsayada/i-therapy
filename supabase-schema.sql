-- ============================================
-- i-therapy Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Sessions table
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('mapping', 'release', 'emotions')),
  communication_style text check (communication_style in ('sensitive', 'practical', 'spiritual', 'provocative')),
  phase text not null default 'discovery',
  current_tool_id text,
  belief_id text,
  identified_belief text,
  wheel_scores jsonb,
  title text,
  new_belief text,
  release_insight text,
  emotion text,
  meditation_audio_saved boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  agent_type text,
  tool_id text,
  created_at timestamptz default now()
);

-- 3. Beliefs table
create table if not exists beliefs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  belief_text text not null,
  area text,
  status text not null default 'identifying' check (status in ('identifying', 'identified', 'processing', 'released', 'revisit')),
  initial_strength integer check (initial_strength between 1 and 10),
  tool_used text,
  meditation_audio_saved boolean default false,
  discovered_at timestamptz default now(),
  released_at timestamptz
);

-- 4. Row Level Security (RLS) — each user sees only their own data

alter table sessions enable row level security;
alter table messages enable row level security;
alter table beliefs enable row level security;

-- Sessions policies
create policy "Users can view own sessions"
  on sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on sessions for delete
  using (auth.uid() = user_id);

-- Messages policies
create policy "Users can view own messages"
  on messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own messages"
  on messages for insert
  with check (auth.uid() = user_id);

-- Beliefs policies
create policy "Users can view own beliefs"
  on beliefs for select
  using (auth.uid() = user_id);

create policy "Users can insert own beliefs"
  on beliefs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own beliefs"
  on beliefs for update
  using (auth.uid() = user_id);

create policy "Users can delete own beliefs"
  on beliefs for delete
  using (auth.uid() = user_id);

-- 5. Indexes for performance
create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_created_at on sessions(created_at desc);
create index if not exists idx_messages_session_id on messages(session_id);
create index if not exists idx_messages_created_at on messages(created_at);
create index if not exists idx_beliefs_user_id on beliefs(user_id);
create index if not exists idx_beliefs_session_id on beliefs(session_id);

-- 6. Storage bucket for meditation audio
insert into storage.buckets (id, name, public)
values ('meditation-audio', 'meditation-audio', false)
on conflict (id) do nothing;

-- Storage policies
create policy "Users can upload own audio"
  on storage.objects for insert
  with check (
    bucket_id = 'meditation-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own audio"
  on storage.objects for select
  using (
    bucket_id = 'meditation-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own audio"
  on storage.objects for delete
  using (
    bucket_id = 'meditation-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
