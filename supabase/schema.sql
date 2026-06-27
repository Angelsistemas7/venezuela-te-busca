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
  entity_type text not null check (entity_type in ('aid_point','march','post')),
  entity_id   uuid not null,
  token       text not null,
  created_at  timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

-- ── Gestores delegados de recursos (los asigna el admin) ────────────────────
-- El admin da a un usuario (cuenta) permiso para administrar un hospital o un
-- punto de ayuda concreto (estado/disponibilidad/insumos, edición), sin ser el
-- admin global ni el publicador. Tabla PRIVADA: solo el servidor (service role)
-- la lee/escribe. La verificación del permiso se hace en el servidor.
create table if not exists resource_managers (
  entity_type text not null check (entity_type in ('aid_point','hospital')),
  entity_id   uuid not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  granted_by  text,
  created_at  timestamptz not null default now(),
  primary key (entity_type, entity_id, user_id)
);
create index if not exists resource_managers_entity_idx on resource_managers (entity_type, entity_id);
create index if not exists resource_managers_user_idx   on resource_managers (user_id);

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
  verified      boolean not null default false,
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
  pinned        boolean not null default false,
  reactions     jsonb not null default '{"apoyo":0,"corazon":0,"hecho":0}',
  created_at timestamptz not null default now()
);
create index if not exists posts_type_idx    on posts (type);
create index if not exists posts_estado_idx  on posts (estado);
create index if not exists posts_created_idx on posts (created_at desc);
create index if not exists posts_pinned_idx  on posts (pinned);

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
alter table resource_managers enable row level security;
-- resource_managers: SIN políticas (solo service role). Quién gestiona un recurso
-- no es público; se resuelve en el servidor con la service role.

-- person_owners / resource_owners: SIN lectura pública (los tokens son secretos)
-- y SIN inserción pública. Se escriben con service role al publicar.

-- Lectura para todos
create policy "public_read_persons"   on persons          for select using (true);
create policy "public_read_aid"       on aid_points       for select using (true);
create policy "public_read_marches"   on marches          for select using (true);
create policy "public_read_comments"  on comments         for select using (true);
create policy "public_read_posts"     on posts            for select using (true);
create policy "public_read_hospitals" on hospitals        for select using (true);
create policy "public_read_patients"  on hospital_patients for select using (true);

-- Escrituras (INSERT/UPDATE/DELETE): SOLO por service role desde el servidor.
-- Antes había inserción pública con la clave anon; se quitó porque permitía
-- saltarse Turnstile y la validación, e incluso falsear `user_id`. Todas las
-- acciones escriben con SUPABASE_SERVICE_ROLE_KEY (obligatoria en producción).
-- Re-ejecutar este archivo elimina las políticas antiguas si ya existían:
drop policy if exists "public_insert_persons"            on persons;
drop policy if exists "public_insert_reports"            on status_reports;
drop policy if exists "public_insert_aid"                on aid_points;
drop policy if exists "public_insert_marches"            on marches;
drop policy if exists "public_insert_comments"           on comments;
drop policy if exists "public_insert_posts"              on posts;
drop policy if exists "public_insert_hospitals"          on hospitals;
drop policy if exists "public_insert_patients"           on hospital_patients;
drop policy if exists "public_insert_owners"             on person_owners;
drop policy if exists "public_insert_resource_owners"    on resource_owners;

-- Reacciones a publicaciones y disponibilidad de puntos: se actualizan vía
-- acciones del servidor. Si no usas service role, habilita estas dos:
-- create policy "public_update_post_reactions" on posts      for update using (true) with check (true);
-- create policy "public_update_aid_available"  on aid_points for update using (true) with check (true);

-- Nota: NO se crea política de UPDATE/DELETE para anon.
-- Editar estado de personas o verificar reportes/puntos requiere la
-- service role (servidor), evitando que cualquiera marque "localizado".

-- ── Cuentas: perfil de usuario (login OPCIONAL) ──────────────────────────────
-- Supabase Auth gestiona auth.users (correo de acceso + hash de la contraseña).
-- Aquí solo guardamos el nombre de usuario (único) y, si lo dieron, el correo de
-- recuperación. El nombre visible se desnormaliza en cada publicación/comentario,
-- así que el cliente NUNCA necesita leer esta tabla.
create table if not exists profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  username       text not null,
  username_lower text not null unique,
  login_email    text not null,
  recovery_email text,
  created_at     timestamptz not null default now()
);

alter table profiles enable row level security;
-- Sin políticas a propósito: `profiles` solo se lee/escribe con la service role
-- desde el servidor (registro e inicio de sesión). Con la clave anon no se puede
-- leer ni el nombre de usuario, ni el correo de recuperación.

-- ── Cuentas: enlazar publicaciones y comentarios a la cuenta (OPCIONAL) ───────
-- Si publicas con sesión iniciada, la fila queda ligada a tu user_id y la puedes
-- gestionar desde cualquier dispositivo. Sigue conviviendo con el token anónimo.
alter table persons    add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table posts      add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table aid_points add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table marches    add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table comments   add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table hospitals  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_persons_user_id    on persons(user_id);
create index if not exists idx_posts_user_id      on posts(user_id);
create index if not exists idx_aid_points_user_id on aid_points(user_id);
create index if not exists idx_marches_user_id    on marches(user_id);
create index if not exists idx_hospitals_user_id  on hospitals(user_id);

-- Migración para bases ya creadas: el "visto bueno" del admin a hospitales.
-- (En instalaciones nuevas ya viene en el create table de hospitals.)
alter table hospitals  add column if not exists verified boolean not null default false;

-- Migración para bases ya creadas: publicaciones fijadas (destacadas) en el muro.
alter table posts      add column if not exists pinned boolean not null default false;
