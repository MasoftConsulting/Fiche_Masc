"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Révélation à l'entrée dans le viewport.
 *
 * IntersectionObserver plutôt qu'un écouteur de scroll : pas de reflow continu,
 * donc pas de saccade sur les téléphones des techniciens.
 */
export function Reveler({
  children,
  delai = 0,
  className = "",
}: {
  children: ReactNode;
  delai?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const noeud = ref.current;
    if (!noeud) return;

    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (!entree.isIntersecting) return;
        noeud.style.animationDelay = `${delai}ms`;
        noeud.classList.add("visible");
        observateur.disconnect();
      },
      /*
       * `threshold: 0` — dès qu'un pixel entre dans le viewport.
       *
       * Un seuil en pourcentage est un piège pour les blocs plus hauts que
       * l'écran : sur un téléphone, un formulaire de 6 000 px n'atteint jamais
       * 8 % de visibilité, l'observateur ne se déclenche pas et la section
       * reste invisible. Le décalage bas de 40 px suffit à laisser l'animation
       * démarrer juste avant l'entrée à l'écran.
       */
      { threshold: 0, rootMargin: "0px 0px -40px 0px" },
    );

    observateur.observe(noeud);
    return () => observateur.disconnect();
  }, [delai]);

  return (
    <div ref={ref} className={`reveler ${className}`}>
      {children}
    </div>
  );
}
