/*
 * Service worker — MA SOFT CONSULTING · Fiches d'intervention
 *
 * Volontairement prudent : la plateforme affiche des données nominatives, et un
 * cache de pages HTML servirait la fiche d'un technicien à un autre après un
 * changement de session. On ne met donc en cache QUE des ressources anonymes et
 * immuables (les fichiers hachés de /_next/static, les icônes, la page hors
 * ligne). Les pages, elles, viennent toujours du réseau ; sans réseau, on
 * affiche la page hors ligne.
 */

const VERSION = "masc-v1";
const COQUILLE = `coquille-${VERSION}`;
const STATIQUES = `statiques-${VERSION}`;

const HORS_LIGNE = "/hors-ligne";
const A_PRECHARGER = [
  HORS_LIGNE,
  "/icone-192.png",
  "/icone-512.png",
  "/masc-logo.png",
];

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(
    caches
      .open(COQUILLE)
      // `addAll` échoue en bloc si une seule ressource manque : on tolère les
      // absences plutôt que de laisser l'installation échouer entièrement.
      .then((cache) => Promise.allSettled(A_PRECHARGER.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((noms) =>
        Promise.all(
          noms
            .filter((nom) => !nom.endsWith(VERSION))
            .map((nom) => caches.delete(nom)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Ressource immuable : nom de fichier haché, contenu figé. */
function estStatique(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (evenement) => {
  const requete = evenement.request;

  // Les Server Actions sont des POST : jamais interceptées.
  if (requete.method !== "GET") return;

  const url = new URL(requete.url);
  if (url.origin !== self.location.origin) return;

  // Navigation : réseau d'abord, page hors ligne en secours.
  if (requete.mode === "navigate") {
    evenement.respondWith(
      fetch(requete).catch(async () => {
        const cache = await caches.open(COQUILLE);
        return (
          (await cache.match(HORS_LIGNE)) ??
          new Response("Hors ligne", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }

  // Statiques : cache d'abord, alimenté au fil de l'eau.
  if (estStatique(url)) {
    evenement.respondWith(
      caches.match(requete).then(
        (enCache) =>
          enCache ??
          fetch(requete).then((reponse) => {
            if (reponse.ok && reponse.type === "basic") {
              const copie = reponse.clone();
              caches.open(STATIQUES).then((cache) => cache.put(requete, copie));
            }
            return reponse;
          }),
      ),
    );
  }

  // Tout le reste (données, routes Next internes) : réseau direct, sans cache.
});
