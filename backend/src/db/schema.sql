-- Rodar no SQL Editor do Supabase (https://supabase.com/dashboard)

-- Tabela de eventos
create table if not exists events (
  id text primary key,
  host_id uuid references auth.users(id) on delete cascade,
  theme jsonb not null,
  event jsonb not null,
  created_at timestamptz default now()
);

-- Tabela de RSVPs
create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id text references events(id) on delete cascade,
  name text not null,
  guests integer default 0,
  msg text,
  confirmed_at timestamptz default now()
);

-- Índices
create index if not exists rsvps_event_id_idx on rsvps(event_id);
create index if not exists events_host_id_idx on events(host_id);

-- Row Level Security
alter table events enable row level security;
alter table rsvps enable row level security;

-- Eventos: leitura pública (para convidados carregarem o convite)
create policy "eventos leitura publica" on events
  for select using (true);

-- Eventos: criação e gerenciamento apenas pelo host autenticado
create policy "host gerencia seus eventos" on events
  for all using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- RSVPs: qualquer pessoa pode inserir (convidados sem login)
create policy "rsvp insert publico" on rsvps
  for insert with check (true);

-- RSVPs: apenas o host do evento pode ler
create policy "host le seus rsvps" on rsvps
  for select using (
    exists (
      select 1 from events
      where events.id = rsvps.event_id
        and events.host_id = auth.uid()
    )
  );
