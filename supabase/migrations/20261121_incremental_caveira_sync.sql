-- Tabela opcional de sincronização incremental linha-a-linha (#5)
-- Execute no SQL Editor do Supabase caso deseje ativar sync incremental + Realtime na tabela dedicada.
-- Mesmo sem esta tabela, a extensão v3.0.0 faz delta-merge automático em public.profiles.full_data.

create table if not exists public.caveira_question_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  action text not null default 'upsert',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

alter table public.caveira_question_events enable row level security;

drop policy if exists "Users read own caveira events" on public.caveira_question_events;
create policy "Users read own caveira events"
  on public.caveira_question_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own caveira events" on public.caveira_question_events;
create policy "Users insert own caveira events"
  on public.caveira_question_events
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own caveira events" on public.caveira_question_events;
create policy "Users update own caveira events"
  on public.caveira_question_events
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users delete own caveira events" on public.caveira_question_events;
create policy "Users delete own caveira events"
  on public.caveira_question_events
  for delete
  using (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'caveira_question_events'
  ) then
    alter publication supabase_realtime add table public.caveira_question_events;
  end if;
exception when others then
  null;
end $$;
