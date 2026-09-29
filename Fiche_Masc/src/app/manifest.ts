import type { MetadataRoute } from "next";

/**
 * Manifeste d'installation.
 *
 * `display: standalone` retire la barre d'adresse : une fois posée sur l'écran
 * d'accueil, la plateforme se comporte comme une application. `start_url` pointe
 * sur le registre plutôt que sur "/" pour éviter la redirection au lancement.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fiches d'intervention · MA SOFT CONSULTING",
    short_name: "Fiches MASC",
    description:
      "Saisie, signature et impression des fiches d'intervention MA SOFT CONSULTING.",
    lang: "fr",
    dir: "ltr",
    start_url: "/fiches",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#eef0f3",
    theme_color: "#0f3352",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icone-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Nouvelle fiche",
        short_name: "Nouvelle",
        url: "/fiches/nouvelle",
        icons: [{ src: "/icone-192.png", sizes: "192x192" }],
      },
    ],
  };
}
