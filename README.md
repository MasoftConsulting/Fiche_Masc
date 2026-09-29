# Fiches d'intervention — MA SOFT CONSULTING

Plateforme de saisie, de signature et d'impression des fiches d'intervention.
Le rendu imprimé reproduit le document papier officiel, sur **une seule page A4**.

- **Next.js 16** (App Router, Server Actions) · **React 19** · **Tailwind CSS 4**
- **Supabase** (PostgreSQL) — accès serveur uniquement, tables fermées par RLS

---

## 1. Mise en route

```bash
npm install
cp .env.local.example .env.local   # puis compléter (voir §2)
npm run dev                        # http://localhost:3000
```

## 2. Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role — **serveur uniquement** |
| `CODE_ADMIN` | Code d'accès administrateur (code d'amorçage) |
| `SESSION_SECRET` | Signe le cookie de session **et** les empreintes des codes, 32 caractères minimum |
| `ADMIN_EMAIL` | Reçoit le code de connexion de l'administrateur d'amorçage |
| `SMTP_HOST`, `SMTP_PORT` | Serveur SMTP d'envoi des codes de connexion (465 = TLS implicite, 587 = STARTTLS) |
| `SMTP_USER`, `SMTP_PASSWORD` | Identifiants SMTP |
| `SMTP_FROM` | Expéditeur affiché (vide : `SMTP_USER`) |

```bash
openssl rand -base64 36   # pour SESSION_SECRET
```

> ⚠ Changer `SESSION_SECRET` invalide tous les codes techniciens déjà
> distribués : il faut alors les régénérer depuis `/admin`.

## 3. Base de données

Dans **Supabase > SQL Editor**, exécuter [`supabase/schema.sql`](supabase/schema.sql).
Le script est idempotent. Il crée :

- `techniciens` — nom, empreinte du code, rôle, actif ;
- `fiches_intervention` — les 9 sections du document + `technicien_id` ;
- les index, le trigger `updated_at` et `prochain_numero_fiche()`.

Les deux tables ont la **RLS activée sans aucune policy** : elles sont
inaccessibles avec la clé anon. Tout passe par les Server Components et Server
Actions, avec la clé `service_role` qui ne quitte jamais le serveur.

### Mettre à jour une base déjà créée

**Rejouer le même fichier**, en entier, dans *SQL Editor*. Rien d'autre à faire :
le script est écrit pour être idempotent, il n'y a pas de dossier de migrations
à tenir à jour.

| Instruction | Sur une base déjà à jour |
| --- | --- |
| `create table if not exists` | ignorée |
| `alter table … add column if not exists` | ignorée |
| `create index if not exists` | ignorée |
| `create or replace function` | remplace la version en place |
| `drop trigger if exists` + `create trigger` | recrée le trigger |
| `enable row level security` | sans effet si déjà activée |

Aucune de ces instructions ne touche aux lignes existantes : **vos fiches déjà
saisies sont conservées**. Après exécution, vérifier dans *Table Editor* que
`techniciens` existe et que `fiches_intervention` a bien une colonne
`technicien_id`.

Les fiches créées avant l'ajout de cette colonne ont `technicien_id` à `null` :
elles restent visibles pour l'administrateur sous le filtre **Non attribuées**.

## 4. Accès

La connexion se fait en deux étapes :

1. **le code d'accès**, qui identifie son porteur et renseigne donc seul le
   champ « Technicien » des fiches ;
2. **un code à 6 chiffres reçu par e-mail** (double authentification), valable
   10 minutes, à usage unique, 5 essais maximum. Il est envoyé à l'adresse du
   technicien (obligatoire, saisie dans `/admin`) ou à `ADMIN_EMAIL` pour le
   code d'amorçage. Table `codes_mfa`.

| | Voit | Peut |
| --- | --- | --- |
| **Technicien** | ses propres fiches uniquement | créer, modifier et imprimer ses fiches |
| **Administrateur** | les fiches de toute l'équipe | + créer les codes, filtrer par technicien, supprimer |

**Premier démarrage** : la table `techniciens` est vide, seul `CODE_ADMIN`
ouvre la plateforme. Connectez-vous avec, allez sur **Techniciens** et créez le
premier code.

Le cloisonnement est appliqué côté serveur (requête filtrée sur
`technicien_id`), pas seulement dans l'interface : bricoler l'URL d'une fiche
d'un collègue renvoie une 404.

`/admin` est fermé au rôle `technicien` par trois barrières indépendantes :
le proxy refuse la requête avant d'atteindre la page, le layout de la section
redirige, et chaque Server Action revérifie la session — une Server Action étant
une route HTTP à part entière, la garde de la page qui affiche le bouton ne la
protège pas. Le lien « Techniciens » n'apparaît pas non plus dans la barre.

## 5. Les codes d'accès

- Générés au format `MSC-XXXX-XXXX`, dans un alphabet sans caractères
  ambigus (ni `0`/`O`, ni `1`/`I`/`L`) — dictables au téléphone.
- L'administrateur peut aussi imposer un code de son choix (6 caractères mini).
- **Le code en clair n'est stocké nulle part** : seule une empreinte
  HMAC-SHA256 va en base. Il n'est affiché qu'une fois, à la création. En cas de
  perte : *Nouveau code*.
- *Désactiver* coupe l'accès sans rien supprimer. *Supprimer* retire le
  technicien mais **conserve ses fiches**, au nom qu'elles portaient.

## 6. Parcours

| Route | Rôle |
| --- | --- |
| `/connexion` | Code d'accès (cookie signé, 30 jours) |
| `/fiches` | Registre : recherche, filtres, synthèse |
| `/fiches/nouvelle` | Saisie (numéro `FI-AAAA-NNN` attribué) |
| `/fiches/[id]` | Reprise et modification |
| `/impression/[id]` | Feuille A4, bouton **Imprimer** |
| `/admin` | Techniciens, codes et décompte des fiches — administrateur |

Le `proxy.ts` (ex-middleware) exige un cookie valide sur toutes les routes sauf
`/connexion` ; `/admin` ajoute sa propre garde, et chaque Server Action
revérifie la session de son côté.

## 7. Le formulaire

Les 9 sections reprennent exactement le document papier : informations
générales, type d'intervention, matériel, compteurs, détail, résultat, tests,
recommandations, validation client.

- **Signatures** : canvas + Pointer Events (souris, doigt, stylet), sans
  dépendance externe. Le tracé est stocké en PNG dataURL.
- **Statut** : une fiche passe de `brouillon` à `signee` dès que la signature du
  client est présente.
- **Numérotation** : `FI-AAAA-NNN` calculée en base ; la contrainte d'unicité
  sur `numero` rattrape deux créations simultanées.

## 8. Impression

`/impression/[id]` produit une feuille de 210 × 297 mm exactement. Les zones
« Détail » et « Recommandations » absorbent l'espace restant pour que la page
soit toujours pleine.

À l'impression : format A4, marges « aucune », **graphismes d'arrière-plan
activés** pour que les aplats bleus sortent de l'imprimante.

## 9. Mobile (PWA installable)

La plateforme s'installe sur l'écran d'accueil et s'ouvre en plein écran, sans
barre d'adresse. Un seul code, une seule base : c'est la même application.

**Installer** — Android/Chrome : une invitation apparaît en bas de l'écran, ou
menu ⋮ → *Installer l'application*. iOS/Safari : bouton **Partager** →
*Sur l'écran d'accueil* (Apple ne permet pas d'invitation automatique, la
marche à suivre est affichée dans le bandeau).

| Fichier | Rôle |
| --- | --- |
| [`src/app/manifest.ts`](src/app/manifest.ts) | Nom, icônes, `display: standalone`, raccourci « Nouvelle fiche » |
| [`public/sw.js`](public/sw.js) | Service worker |
| [`src/components/pwa.tsx`](src/components/pwa.tsx) | Enregistrement + bandeau d'installation |
| [`src/app/hors-ligne/page.tsx`](src/app/hors-ligne/page.tsx) | Page servie quand le réseau manque |

**Ce que le service worker met en cache — et ce qu'il ne met pas.** Uniquement
des ressources anonymes et immuables : les fichiers hachés de `/_next/static`,
les icônes, la page hors ligne. **Jamais les pages HTML**, qui contiennent des
données nominatives : un cache de pages servirait la fiche d'un technicien à un
autre après un changement de session. Les pages viennent donc toujours du
réseau ; sans réseau, la page hors ligne s'affiche. Les Server Actions sont des
`POST`, jamais interceptées.

Le service worker n'est enregistré qu'en **production** : en développement il
servirait des fichiers périmés à chaque rechargement à chaud.

Après un changement de `public/sw.js`, incrémentez `VERSION` en tête du fichier
— c'est ce qui purge les anciens caches à l'activation.

**Ergonomie tactile** : champs à 16 px sur mobile (en dessous, iOS zoome au
focus et ne dézoome jamais), cases à cocher agrandies au pouce, marges
d'encoche et de barre gestuelle réservées (`viewport-fit: cover` +
`env(safe-area-inset-*)`), signature au doigt déjà gérée par les Pointer Events.

## 10. Déploiement

En ligne : **https://masc-fiche.vercel.app** (projet Vercel `masc-fiche`).

Le dossier n'est pas un dépôt Git : les mises en ligne partent du poste, par
la CLI.

```bash
npx vercel deploy --prod        # publier
npx vercel env ls production    # vérifier les variables
```

> ⚠ **`SESSION_SECRET` doit être identique en local et sur Vercel.** Il ne
> signe pas seulement le cookie de session : il calcule aussi l'empreinte des
> codes techniciens stockée en base. Les deux environnements partageant le même
> projet Supabase, un secret différent rendrait invalides, d'un côté, tous les
> codes créés de l'autre.

`NEXT_PUBLIC_SUPABASE_URL` est figée **au moment du build** (c'est le propre du
préfixe `NEXT_PUBLIC_`) : les variables doivent exister sur Vercel *avant* le
déploiement, sinon le build embarque une valeur vide.

Ne jamais préfixer `SUPABASE_SERVICE_ROLE_KEY`, `CODE_ADMIN` ou
`SESSION_SECRET` par `NEXT_PUBLIC_`.

Les URL propres à un déploiement (`masc-fiche-<hash>-….vercel.app`) sont
protégées par l'authentification Vercel et renvoient une 302 : pour un test sur
téléphone, utiliser l'alias de production, public.

Pour des mises en ligne automatiques à chaque commit, connecter un dépôt Git au
projet depuis le tableau de bord Vercel.

## 11. Commandes

```bash
npm run dev     # développement
npm run build   # build de production
npm run start   # serveur de production
npm run lint    # ESLint
```
