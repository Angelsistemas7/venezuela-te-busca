-- ─────────────────────────────────────────────────────────────────────────
-- Venezuela te busca — Esquema de base de datos (PostgreSQL / Supabase)
--
-- Cómo aplicarlo:
--   1. Crea un proyecto gratis en https://app.supabase.com
--   2. Abre "SQL Editor" y pega TODO este archivo. Ejecuta.
--   3. Copia URL y claves a tu .env.local (ver .env.example)
--
-- Diseñado para escalar: índices en los campos de búsqueda/filtro y
-- búsqueda de texto completo en español sobre nombre + ubicación.
-- ─────────────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- búsqueda difusa por nombre/cédula

-- ── Tipos ────────────────────────────────────────────────────────────────
do $$ begin
  create type person_status as enum ('por_localizar', 'localizado', 'hospitalizado', 'fallecido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gender_type as enum ('masculino', 'femenino', 'otro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type aid_point_type as enum ('comida', 'agua', 'medicina', 'refugio', 'ropa', 'otro');
exception when duplicate_object then null; end $$;

-- ── Personas ───────────────────────────────────────────────────────────────
create table if not exists persons (
  id uuid primary key default uuid_generate_v4(),
  first_name      text not null check (length(first_name) between 1 and 80),
  last_name       text default '' check (length(last_name) <= 80),
  cedula          text,
  age             int check (age between 0 and 120),
  gender          gender_type,
  estado          text,
  location_text   text default '',
  description     text default '',
  photo_url       text,
  status          person_status not null default 'por_localizar',
  hospital_name   text,
  is_unidentified boolean not null default false,
  contact_name    text,
  contact_phone   text,
  contact_email   text,
  verified        boolean not null default false,
  reactions       jsonb not null default '{"fuerza":0,"corazon":0,"difundir":0}',
  -- columna generada para búsqueda de texto completo en español
  search_doc tsvector generated always as (
    to_tsvector('spanish',
      coalesce(first_name,'') || ' ' ||
      coalesce(last_name,'') || ' ' ||
      coalesce(cedula,'') || ' ' ||
      coalesce(estado,'') || ' ' ||
      coalesce(location_text,''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists persons_status_idx        on persons (status);
create index if not exists persons_estado_idx        on persons (estado);
create index if not exists persons_gender_idx        on persons (gender);
create index if not exists persons_age_idx           on persons (age);
create index if not exists persons_unidentified_idx  on persons (is_unidentified);
create index if not exists persons_created_idx       on persons (created_at desc);
create index if not exists persons_search_idx        on persons using gin (search_doc);
create index if not exists persons_name_trgm_idx     on persons using gin ((first_name || ' ' || last_name) gin_trgm_ops);

-- ── Propietario de la publicación (token privado de gestión) ────────────────
-- Tabla aparte y SIN lectura pública: el token es secreto. Solo el servidor
-- (service role) lo lee para verificar al autor. Permite que quien publicó
-- gestione su registro (estado, edición, borrado) sin crear cuenta.
create table if not exists person_owners (
  person_id uuid primary key references persons(id) on delete cascade,
  token     text not null,
  created_at timestamptz not null default now()
);

-- ── Propietario de recursos (puntos de ayuda, caravanas) ────────────────────
-- Igual que person_owners pero genérico: el autor de un punto de ayuda o de una
-- caravana lo gestiona con un enlace privado (token). Sin lectura pública; la
-- verificación del autor se hace en el servidor con la service role. No es una
-- FK porque entity_id apunta a una de varias tablas según entity_type.
create table if not exists resource_owners (
  entity_type text not null check (entity_type in ('aid_point','march')),
  entity_id   uuid not null,
  token       text not null,
  created_at  timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

-- ── Reportes de cambio de estado (con verificación anti-abuso) ──────────────
create table if not exists status_reports (
  id uuid primary key default uuid_generate_v4(),
  person_id uuid not null references persons(id) on delete cascade,
  reported_status       person_status not null,
  reporter_name         text not null,
  reporter_phone        text not null,
  reporter_relationship text not null,
  location_found        text not null,
  notes                 text default '',
  verified              boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists status_reports_person_idx   on status_reports (person_id);
create index if not exists status_reports_verified_idx on status_reports (verified);

-- ── Puntos de ayuda (comida / agua / refugio...) ────────────────────────────
create table if not exists aid_points (
  id uuid primary key default uuid_generate_v4(),
  name           text not null,
  types          aid_point_type[] not null default '{comida}',
  estado         text,
  location_text  text not null,
  schedule_text  text default '',
  description    text default '',
  photo_url      text,
  contact_name   text,
  contact_phone  text,
  verified       boolean not null default false,
  available      boolean not null default true,
  votes_available int not null default 0,
  votes_depleted  int not null default 0,
  likes          int not null default 0,
  updated_at     timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists aid_points_estado_idx on aid_points (estado);
create index if not exists aid_points_type_idx   on aid_points using gin (types);

-- ── Marchas / caravanas ─────────────────────────────────────────────────────
create table if not exists marches (
  id uuid primary key default uuid_generate_v4(),
  title           text not null,
  origin_text     text not null,
  destination_text text not null,
  depart_at       timestamptz not null,
  organizer_name  text not null,
  organizer_phone text not null,
  whatsapp_url    text,
  description     text default '',
  attendees_count int not null default 0,
  likes           int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists marches_depart_idx on marches (depart_at);

-- ── Hospitales ──────────────────────────────────────────────────────────────
create table if not exists hospitals (
  id uuid primary key default uuid_generate_v4(),
  name          text not null,
  estado        text,
  location_text text default '',
  status        text not null default 'operativo' check (status in ('operativo','saturado','lleno','cerrado')),
  specialties   text[] not null default '{}',
  needs_text    text default '',
  contact_name  text,
  contact_phone text,
  votes_supplies    int not null default 0,
  votes_no_supplies int not null default 0,
  likes             int not null default 0,
  updated_at    timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists hospitals_estado_idx on hospitals (estado);
create index if not exists hospitals_status_idx on hospitals (status);

create table if not exists hospital_patients (
  id uuid primary key default uuid_generate_v4(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  full_name   text not null,
  cedula      text,
  condition   text default '',
  status      text not null default 'estable' check (status in ('estable','critico','observacion','alta')),
  note        text default '',
  created_at timestamptz not null default now()
);
create index if not exists hospital_patients_hospital_idx on hospital_patients (hospital_id);

-- ── Comunidad / Feed ────────────────────────────────────────────────────────
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  type          text not null check (type in ('necesito','ofrezco','rescate','medico','caravana','identificar','info')),
  body          text not null check (length(body) between 5 and 1500),
  estado        text,
  location_text text default '',
  photo_url     text,
  link_url      text,
  author_name   text not null,
  contact_phone text,
  reactions     jsonb not null default '{"apoyo":0,"corazon":0,"hecho":0}',
  created_at timestamptz not null default now()
);
create index if not exists posts_type_idx    on posts (type);
create index if not exists posts_estado_idx  on posts (estado);
create index if not exists posts_created_idx on posts (created_at desc);

-- ── Comentarios (foro de comunidad) ─────────────────────────────────────────
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in ('person','aid_point','march','post','hospital')),
  entity_id   uuid not null,
  -- Respuesta en hilo (un nivel): apunta al comentario raíz; null si es de primer nivel.
  parent_id   uuid references comments(id) on delete cascade,
  author_name text not null,
  body        text not null check (length(body) between 1 and 1000),
  photo_url   text,
  likes       int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists comments_entity_idx on comments (entity_type, entity_id);
create index if not exists comments_parent_idx on comments (parent_id);

-- ── updated_at automático en persons ────────────────────────────────────────
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists persons_touch on persons;
create trigger persons_touch before update on persons
  for each row execute function touch_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Lectura pública; escritura pública controlada (la app valida + Turnstile).
-- Los cambios de estado público se hacen con la service role tras verificar
-- un reporte, NO directamente desde el cliente.
alter table persons        enable row level security;
alter table status_reports enable row level security;
alter table aid_points     enable row level security;
alter table marches        enable row level security;
alter table comments         enable row level security;
alter table posts            enable row level security;
alter table hospitals        enable row level security;
alter table hospital_patients enable row level security;
alter table person_owners    enable row level security;
alter table resource_owners  enable row level security;

-- person_owners / resource_owners: inserción pública (para guardar el token al
-- publicar), pero SIN política de lectura → nadie puede leer los tokens con la
-- clave anon. La verificación del autor se hace en el servidor con service role.
create policy "public_insert_owners" on person_owners for insert with check (true);
create policy "public_insert_resource_owners" on resource_owners for insert with check (true);

-- Lectura para todos
create policy "public_read_persons"   on persons          for select using (true);
create policy "public_read_aid"       on aid_points       for select using (true);
create policy "public_read_marches"   on marches          for select using (true);
create policy "public_read_comments"  on comments         for select using (true);
create policy "public_read_posts"     on posts            for select using (true);
create policy "public_read_hospitals" on hospitals        for select using (true);
create policy "public_read_patients"  on hospital_patients for select using (true);

-- Inserción pública (la app filtra spam con Turnstile + validación)
create policy "public_insert_persons"  on persons          for insert with check (true);
create policy "public_insert_reports"  on status_reports   for insert with check (true);
create policy "public_insert_aid"      on aid_points       for insert with check (true);
create policy "public_insert_marches"  on marches          for insert with check (true);
create policy "public_insert_comments" on comments         for insert with check (true);
create policy "public_insert_posts"    on posts            for insert with check (true);
create policy "public_insert_hospitals" on hospitals       for insert with check (true);
create policy "public_insert_patients"  on hospital_patients for insert with check (true);

-- Reacciones a publicaciones y disponibilidad de puntos: se actualizan vía
-- acciones del servidor. Si no usas service role, habilita estas dos:
-- create policy "public_update_post_reactions" on posts      for update using (true) with check (true);
-- create policy "public_update_aid_available"  on aid_points for update using (true) with check (true);

-- Nota: NO se crea política de UPDATE/DELETE para anon.
-- Editar estado de personas o verificar reportes/puntos requiere la
-- service role (servidor), evitando que cualquiera marque "localizado".
