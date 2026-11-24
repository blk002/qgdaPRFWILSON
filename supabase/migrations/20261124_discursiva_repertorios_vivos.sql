-- Banco Vivo de Repertórios Discursiva (Cebraspe PRF)
-- Execute este script no SQL Editor do seu projeto Supabase.
-- Ele cria:
--   1. public.discursiva_admins       (lista de e-mails com permissão de curadoria/publicação)
--   2. public.is_discursiva_admin()   (função segura usada pelo RLS e pelo frontend)
--   3. public.discursiva_repertorios  (catálogo global dinâmico com fila 'pending' -> 'published')

-- 1) Tabela de administradores de curadoria
create table if not exists public.discursiva_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.discursiva_admins enable row level security;

-- Apenas service_role / SQL Editor gerenciam admins; usuários comuns não listam e-mails de admins
drop policy if exists "Admins read own admin record" on public.discursiva_admins;
create policy "Admins read own admin record"
  on public.discursiva_admins
  for select
  to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Administrador inicial (adicione outros e-mails aqui se desejar)
insert into public.discursiva_admins (email)
values ('fitmuscle.oficial@gmail.com')
on conflict (email) do nothing;

-- 2) Função segura para verificar se o usuário autenticado é administrador de curadoria
create or replace function public.is_discursiva_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.discursiva_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_discursiva_admin() to anon, authenticated;

-- 3) Tabela principal do banco vivo de repertórios
create table if not exists public.discursiva_repertorios (
  id text primary key,
  eixo text not null check (
    eixo in (
      'seguranca_viaria',
      'seguranca_publica',
      'direitos_humanos',
      'tecnologia_gestao',
      'meio_ambiente'
    )
  ),
  tipo text not null check (
    tipo in (
      'legislacao',
      'politica_publica',
      'dado_oficial',
      'conceito_autor'
    )
  ),
  titulo text not null,
  fonte text not null,
  fonte_url text,
  data_referencia date,
  aspecto_tipico text not null default 'Atualidade / Repertório',
  resumo text not null,
  como_usar text not null,
  palavras_chave text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'published', 'archived')),
  origem text not null default 'curado' check (origem in ('curado', 'radar', 'admin')),
  source_hash text unique,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_discursiva_repertorios_status_published
  on public.discursiva_repertorios (status, published_at desc nulls last, created_at desc);

create index if not exists idx_discursiva_repertorios_eixo
  on public.discursiva_repertorios (eixo);

-- Trigger de updated_at automático
create or replace function public.set_discursiva_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_discursiva_repertorios_updated_at on public.discursiva_repertorios;
create trigger trg_discursiva_repertorios_updated_at
  before update on public.discursiva_repertorios
  for each row execute function public.set_discursiva_updated_at();

-- 4) Row Level Security (RLS)
alter table public.discursiva_repertorios enable row level security;

-- Qualquer usuário lê itens publicados; apenas admins leem pendentes/arquivados
drop policy if exists "Read published discursiva repertorios" on public.discursiva_repertorios;
create policy "Read published discursiva repertorios"
  on public.discursiva_repertorios
  for select
  using (status = 'published' or public.is_discursiva_admin());

drop policy if exists "Admins insert discursiva repertorios" on public.discursiva_repertorios;
create policy "Admins insert discursiva repertorios"
  on public.discursiva_repertorios
  for insert
  to authenticated
  with check (public.is_discursiva_admin());

drop policy if exists "Admins update discursiva repertorios" on public.discursiva_repertorios;
create policy "Admins update discursiva repertorios"
  on public.discursiva_repertorios
  for update
  to authenticated
  using (public.is_discursiva_admin())
  with check (public.is_discursiva_admin());

drop policy if exists "Admins delete discursiva repertorios" on public.discursiva_repertorios;
create policy "Admins delete discursiva repertorios"
  on public.discursiva_repertorios
  for delete
  to authenticated
  using (public.is_discursiva_admin());

-- 5) Habilita Supabase Realtime para atualizações imediatas sem recarregar a página
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'discursiva_repertorios'
  ) then
    alter publication supabase_realtime add table public.discursiva_repertorios;
  end if;
exception when others then
  null;
end $$;
