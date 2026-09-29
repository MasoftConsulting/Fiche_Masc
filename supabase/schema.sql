-- MA SOFT CONSULTING — Fiches d'intervention
-- À exécuter dans Supabase > SQL Editor (une seule fois).
-- Le script est idempotent : on peut le rejouer sans casser les données.

create extension if not exists "pgcrypto";

-- ===========================================================================
-- Techniciens
-- ===========================================================================
-- Chaque technicien a son propre code d'accès. Le code en clair n'est jamais
-- stocké : `code_hash` contient un HMAC-SHA256 calculé côté serveur avec
-- SESSION_SECRET. Déterministe, donc la connexion reste une seule requête
-- indexée ; irréversible sans le secret.
--
-- Conséquence à connaître : changer SESSION_SECRET invalide tous les codes
-- existants (il faut alors les régénérer depuis l'espace administration).

create table if not exists public.techniciens (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  code_hash  text not null unique,
  role       text not null default 'technicien',  -- 'technicien' | 'admin'
  actif      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists techniciens_nom_idx on public.techniciens (nom);

-- ===========================================================================
-- Fiches d'intervention
-- ===========================================================================

create table if not exists public.fiches_intervention (
  id uuid primary key default gen_random_uuid(),

  -- En-tête
  numero              text not null unique,
  date_intervention   date,
  heure_arrivee       text,
  heure_depart        text,
  facturable          text,            -- 'oui' | 'non' | null

  -- 1. Informations générales
  societe             text,
  adresse             text,
  contact             text,
  telephone           text,
  email               text,
  technicien          text,            -- nom figé, tel qu'imprimé sur la fiche

  -- 2. Type d'intervention (cases à cocher)
  types               text[] not null default '{}',
  type_autre          text,

  -- 3. Matériel concerné
  marque_modele       text,
  numero_serie        text,
  adresse_ip          text,
  localisation        text,

  -- 4. Compteur machine
  compteur_nb            text,
  compteur_nb_valide     boolean not null default false,
  compteur_couleur       text,
  compteur_couleur_valide boolean not null default false,

  -- 5. Détail
  detail              text,

  -- 6. Résultat
  resultat            text,            -- 'reussie' | 'partielle' | 'non_resolue'
  commentaires        text,

  -- 7. Tests effectués
  tests               text[] not null default '{}',
  tests_autres        text,

  -- 8. Recommandations
  recommandations     text,

  -- 9. Validation client
  client_nom          text,
  client_fonction     text,
  signature_client    text,            -- image PNG en dataURL
  signature_technicien text,

  -- Suivi
  statut              text not null default 'brouillon',  -- 'brouillon' | 'signee'
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Auteur de la fiche. La colonne texte `technicien` reste la valeur imprimée
-- (elle ne doit pas changer si le technicien est renommé plus tard) ; ce lien
-- sert au cloisonnement et aux statistiques de l'espace administration.
-- `on delete set null` : supprimer un technicien ne supprime jamais ses fiches.
alter table public.fiches_intervention
  add column if not exists technicien_id uuid references public.techniciens (id) on delete set null;

-- Recherche : par client, par numéro, par technicien.
create index if not exists fiches_intervention_numero_idx
  on public.fiches_intervention (numero desc);
create index if not exists fiches_intervention_date_idx
  on public.fiches_intervention (date_intervention desc nulls last);
create index if not exists fiches_intervention_societe_idx
  on public.fiches_intervention (societe);
create index if not exists fiches_intervention_technicien_idx
  on public.fiches_intervention (technicien_id);

-- ===========================================================================
-- Automatismes
-- ===========================================================================

-- `updated_at` tenu par la base plutôt que par l'application : impossible à
-- oublier depuis un appel qui ne passerait pas par les Server Actions.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fiches_intervention_touch on public.fiches_intervention;
create trigger fiches_intervention_touch
  before update on public.fiches_intervention
  for each row execute function public.touch_updated_at();

drop trigger if exists techniciens_touch on public.techniciens;
create trigger techniciens_touch
  before update on public.techniciens
  for each row execute function public.touch_updated_at();

-- Numérotation FI-AAAA-NNN, calculée en base pour rester unique même si deux
-- techniciens créent une fiche à la même seconde.
create or replace function public.prochain_numero_fiche(annee int)
returns text language plpgsql as $$
declare
  prefixe text := 'FI-' || annee::text || '-';
  suivant int;
begin
  select coalesce(max(substring(numero from '\d+$')::int), 0) + 1
    into suivant
    from public.fiches_intervention
   where numero like prefixe || '%';

  return prefixe || lpad(suivant::text, 3, '0');
end;
$$;

-- ===========================================================================
-- Sécurité
-- ===========================================================================
-- RLS activée sans aucune policy : les deux tables sont totalement fermées à la
-- clé anon (celle exposée au navigateur). L'application lit et écrit uniquement
-- côté serveur avec la clé service_role, qui contourne la RLS.

alter table public.fiches_intervention enable row level security;
alter table public.techniciens enable row level security;

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
