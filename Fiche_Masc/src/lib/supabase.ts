import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase à privilèges élevés, réservé au code serveur.
 *
 * La table `fiches_intervention` a la RLS activée sans policy : elle est donc
 * inaccessible avec la clé anon. Toutes les lectures et écritures passent par
 * les Server Actions et Server Components de l'application, jamais par le
 * navigateur — la clé service_role ne quitte donc pas le serveur.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) return null;

  return createClient(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const supabaseConfigure = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);
