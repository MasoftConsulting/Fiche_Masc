"use client";

import { useEffect, useRef } from "react";

type EvenementInstallation = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const REFUS = "masc-installation-refusee";

/**
 * Enregistrement du service worker et invitation à installer.
 *
 * Android/Chrome émet `beforeinstallprompt`, que l'on retient pour déclencher
 * l'installation au moment choisi. iOS ne l'émet pas : on y affiche la marche à
 * suivre manuelle, seule voie possible sur ce système.
 *
 * Les deux variantes du bandeau sont rendues puis dévoilées via l'attribut
 * `hidden` : la détection du navigateur n'a lieu qu'après le montage, et passer
 * par un état React déclencherait un rendu en cascade à chaque chargement.
 */
export function PWA() {
  const banniere = useRef<HTMLDivElement>(null);
  const blocIOS = useRef<HTMLParagraphElement>(null);
  const texteAndroid = useRef<HTMLParagraphElement>(null);
  const blocAndroid = useRef<HTMLDivElement>(null);
  const invite = useRef<EvenementInstallation | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      // Enregistré en production seulement : en développement il servirait des
      // fichiers périmés à chaque rechargement à chaud.
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Contexte non sécurisé ou navigateur restrictif : l'application
        // fonctionne sans, inutile d'alerter l'utilisateur.
      });
    }

    const installee =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    let refusee = false;
    try {
      refusee = window.localStorage.getItem(REFUS) === "1";
    } catch {
      // Stockage indisponible (navigation privée) : on propose quand même.
    }
    if (installee || refusee) return;

    const surIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      // iPadOS se présente comme un Mac : on le reconnaît au tactile.
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (surIOS) {
      if (blocIOS.current) blocIOS.current.hidden = false;
      if (banniere.current) banniere.current.hidden = false;
      return;
    }

    const capter = (evenement: Event) => {
      evenement.preventDefault();
      invite.current = evenement as EvenementInstallation;
      if (texteAndroid.current) texteAndroid.current.hidden = false;
      if (blocAndroid.current) blocAndroid.current.hidden = false;
      if (banniere.current) banniere.current.hidden = false;
    };

    const installe = () => {
      if (banniere.current) banniere.current.hidden = true;
    };

    window.addEventListener("beforeinstallprompt", capter);
    window.addEventListener("appinstalled", installe);
    return () => {
      window.removeEventListener("beforeinstallprompt", capter);
      window.removeEventListener("appinstalled", installe);
    };
  }, []);

  function fermer() {
    if (banniere.current) banniere.current.hidden = true;
    try {
      window.localStorage.setItem(REFUS, "1");
    } catch {
      // Sans stockage, l'invitation reviendra au prochain chargement.
    }
  }

  async function installer() {
    const evenement = invite.current;
    if (!evenement) return;
    await evenement.prompt();
    await evenement.userChoice;
    invite.current = null;
    if (banniere.current) banniere.current.hidden = true;
  }

  return (
    <div
      ref={banniere}
      hidden
      className="fixed inset-x-3 z-40 print:hidden"
      // Ancré en haut, sous la barre flottante : en bas, l'invitation
      // recouvrirait la barre « Enregistrer » du formulaire, qui y est collée.
      style={{ top: "calc(max(1.25rem, env(safe-area-inset-top)) + 4.25rem)" }}
    >
      <div className="mx-auto max-w-md rounded-[1.5rem] border border-white/60 bg-white/85 p-1.5 shadow-souleve backdrop-blur-2xl">
        <div className="flex items-center gap-3 rounded-[calc(1.5rem-0.375rem)] bg-surface px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[0.85rem] font-medium text-ink">Installer sur le téléphone</p>

            <p ref={blocIOS} hidden className="mt-0.5 text-[0.74rem] leading-snug text-ink-soft">
              Bouton Partager, puis « Sur l&apos;écran d&apos;accueil ».
            </p>

            <p ref={texteAndroid} hidden className="mt-0.5 text-[0.74rem] leading-snug text-ink-soft">
              Accès direct depuis l&apos;écran d&apos;accueil, en plein écran.
            </p>
          </div>

          <div ref={blocAndroid} hidden>
            <button
              type="button"
              onClick={installer}
              className="shrink-0 rounded-full bg-ink px-4 py-2 text-[0.8rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.97]"
            >
              Installer
            </button>
          </div>

          <button
            type="button"
            onClick={fermer}
            aria-label="Masquer"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-faint transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
