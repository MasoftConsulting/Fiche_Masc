-- Double authentification par code e-mail. Idempotent : sur la base de
-- production, la table et la colonne existent déjà et rien ne change.

-- ===========================================================================
-- Double authentification
-- ===========================================================================
-- Chaque connexion exige, après le code d'accès, un code à 6 chiffres envoyé
-- par e-mail. `techniciens.email` en est le destinataire (l'administrateur
-- d'amorçage utilise ADMIN_EMAIL).
--
-- `codes_mfa` : une ligne par utilisateur (`user_key` = 'technicien:<uuid>'
-- ou 'admin_amorcage'), remplacée à chaque envoi et supprimée une fois le code
-- utilisé. Seule l'empreinte HMAC du code est gardée.

alter table public.techniciens
  add column if not exists email text;

create table if not exists public.codes_mfa (
  id          uuid primary key default gen_random_uuid(),
  user_key    text not null unique,
  code_hash   text not null,
  email       text not null,
  tentatives  int not null default 0,
  expire_le   timestamptz not null,
  created_at  timestamptz not null default now()
);

alter table public.codes_mfa enable row level security;
