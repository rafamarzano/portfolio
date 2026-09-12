-- ============================================================
-- setup.sql
-- Rode este script no SQL Editor do seu projeto Supabase
-- (Painel do Supabase > SQL Editor > New query > colar e rodar).
-- ============================================================

-- ------------------------------------------------------------
-- Tabela: portfolio_events
-- Guarda os eventos do site (visitas, cliques em botões e
-- visualizações de vídeo).
-- ------------------------------------------------------------
create table if not exists public.portfolio_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,      -- 'page_view' | 'button_click' | 'video_view'
  event_name text,               -- nome do evento (ex: id do vídeo, nome do botão)
  session_id text,               -- identifica visitantes únicos
  page_path text,                -- caminho da página onde o evento ocorreu
  metadata jsonb,                -- dados extras (title, brand, category, etc.)
  created_at timestamptz not null default now()
);

-- Índice para acelerar consultas ordenadas por data (usadas na paginação do painel)
create index if not exists idx_portfolio_events_created_at
  on public.portfolio_events (created_at desc);

-- ------------------------------------------------------------
-- Tabela: portfolio_leads
-- Guarda as mensagens de contato enviadas pelo site.
-- ------------------------------------------------------------
create table if not exists public.portfolio_leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  brand text,
  budget text,
  message text,
  source text,                   -- 'contact' | 'popup'
  created_at timestamptz not null default now()
);

create index if not exists idx_portfolio_leads_created_at
  on public.portfolio_leads (created_at desc);

-- ------------------------------------------------------------
-- Row Level Security (RLS)
-- Com o RLS ligado, ninguém lê ou escreve nada até que exista
-- uma policy autorizando explicitamente.
-- ------------------------------------------------------------
alter table public.portfolio_events enable row level security;
alter table public.portfolio_leads  enable row level security;

-- ------------------------------------------------------------
-- Policies de leitura (SELECT) para usuários autenticados
-- Isso é o que permite que o painel (depois do login) leia os
-- dados das duas tabelas.
-- ------------------------------------------------------------
create policy "Painel autenticado pode ler eventos"
  on public.portfolio_events
  for select
  to authenticated
  using (true);

create policy "Painel autenticado pode ler leads"
  on public.portfolio_leads
  for select
  to authenticated
  using (true);

-- ------------------------------------------------------------
-- Policies de escrita (INSERT) para o público (papel "anon")
-- Isso permite que o SITE do portfólio (navegador do visitante)
-- grave visitas, cliques, vídeos assistidos e mensagens de
-- contato usando a mesma chave anon (pública). A policy é
-- somente de INSERT: o público nunca consegue ler, alterar ou
-- apagar o que já foi gravado, só adicionar linhas novas.
-- ------------------------------------------------------------
create policy "Inserção pública de eventos"
  on public.portfolio_events
  for insert
  to anon
  with check (true);

create policy "Inserção pública de mensagens"
  on public.portfolio_leads
  for insert
  to anon
  with check (true);
