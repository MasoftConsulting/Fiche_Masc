import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Garde d'accès globale.
 *
 * Tout ce qui n'est pas /connexion exige un cookie de session valide, et /admin
 * exige en plus le rôle administrateur : la requête d'un technicien est
 * refusée ici, avant même d'atteindre le layout. C'est la première des trois
 * barrières — le layout de /admin et chaque Server Action revérifient de leur
 * côté, car une Server Action est une route HTTP à part entière.
 */

// /hors-ligne est mise en cache par le service worker à l'installation, avant
// toute session : elle doit rester joignable sans cookie.
const PUBLIC = ["/connexion", "/hors-ligne", "/verification"];
const RESERVE_ADMIN = ["/admin"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const jeton = request.cookies.get("masc_fiche")?.value;
  const secret = process.env.SESSION_SECRET;

  if (jeton && secret && secret.length >= 32) {
    try {
      const { payload } = await jwtVerify(jeton, new TextEncoder().encode(secret));

      if (RESERVE_ADMIN.some((p) => pathname.startsWith(p)) && payload.role !== "admin") {
        const refus = request.nextUrl.clone();
        refus.pathname = "/fiches";
        refus.search = "?erreur=droits";
        return NextResponse.redirect(refus);
      }

      return NextResponse.next();
    } catch {
      // Signature invalide ou jeton expiré : on redirige comme un anonyme.
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = "/connexion";
  // Mémorise la page demandée pour y revenir après la connexion.
  url.searchParams.set("suite", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  /*
   * Exclut les assets statiques et les routes internes de Next.
   *
   * `manifest.webmanifest` et `sw.js` doivent impérativement rester hors garde :
   * le navigateur les réclame sans cookie de session (le manifeste n'est envoyé
   * avec des identifiants que si le lien porte `crossorigin="use-credentials"`).
   * Redirigés vers /connexion, ils reviendraient en HTML — l'installation sur
   * l'écran d'accueil échouerait sans le moindre message d'erreur.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
