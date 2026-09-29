"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Zone de signature manuscrite.
 *
 * Canvas + Pointer Events : une seule implémentation couvre la souris, le
 * doigt et le stylet, sans dépendance externe. Le tracé est renvoyé en PNG
 * dataURL et déposé dans un champ caché du formulaire.
 */
export function SignaturePad({
  nom,
  valeurInitiale,
  legende,
  hauteur = 190,
}: {
  nom: string;
  valeurInitiale?: string | null;
  legende: string;
  hauteur?: number;
}) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dessine = useRef(false);
  const dernier = useRef<{ x: number; y: number } | null>(null);
  // Sauvegarde du tracé, pour le restaurer après un redimensionnement (changer
  // la taille d'un canvas efface son contenu).
  const sauvegarde = useRef<string | null>(valeurInitiale ?? null);

  const [valeur, setValeur] = useState<string>(valeurInitiale ?? "");
  const [vide, setVide] = useState(!valeurInitiale);

  const contexte = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return null;
    ctx.lineWidth = 2.1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0c1116";
    return ctx;
  }, []);

  /** Ajuste le canvas à sa largeur réelle et à la densité de l'écran. */
  const dimensionner = useCallback(() => {
    const canvas = canvasRef.current;
    const conteneur = conteneurRef.current;
    if (!canvas || !conteneur) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const largeur = conteneur.clientWidth;
    if (largeur === 0) return;

    canvas.width = Math.round(largeur * ratio);
    canvas.height = Math.round(hauteur * ratio);
    canvas.style.width = `${largeur}px`;
    canvas.style.height = `${hauteur}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const precedent = sauvegarde.current;
    if (precedent) {
      const image = new Image();
      image.onload = () => ctx.drawImage(image, 0, 0, largeur, hauteur);
      image.src = precedent;
    }
  }, [hauteur]);

  useEffect(() => {
    dimensionner();
    const observateur = new ResizeObserver(dimensionner);
    if (conteneurRef.current) observateur.observe(conteneurRef.current);
    return () => observateur.disconnect();
  }, [dimensionner]);

  function position(evenement: React.PointerEvent<HTMLCanvasElement>) {
    const rect = evenement.currentTarget.getBoundingClientRect();
    return { x: evenement.clientX - rect.left, y: evenement.clientY - rect.top };
  }

  function debut(evenement: React.PointerEvent<HTMLCanvasElement>) {
    evenement.currentTarget.setPointerCapture(evenement.pointerId);
    dessine.current = true;
    dernier.current = position(evenement);

    // Un simple appui doit laisser un point, pas rien.
    const ctx = contexte();
    if (!ctx || !dernier.current) return;
    ctx.beginPath();
    ctx.arc(dernier.current.x, dernier.current.y, 1.05, 0, Math.PI * 2);
    ctx.fillStyle = "#0c1116";
    ctx.fill();
  }

  function trace(evenement: React.PointerEvent<HTMLCanvasElement>) {
    if (!dessine.current) return;
    const ctx = contexte();
    const depart = dernier.current;
    if (!ctx || !depart) return;

    const point = position(evenement);
    // Courbe quadratique passant par le milieu du segment : le tracé reste
    // fluide même quand les événements arrivent espacés.
    const milieu = { x: (depart.x + point.x) / 2, y: (depart.y + point.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(depart.x, depart.y);
    ctx.quadraticCurveTo(depart.x, depart.y, milieu.x, milieu.y);
    ctx.stroke();

    dernier.current = point;
    if (vide) setVide(false);
  }

  function fin() {
    if (!dessine.current) return;
    dessine.current = false;
    dernier.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const donnees = canvas.toDataURL("image/png");
    sauvegarde.current = donnees;
    setValeur(donnees);
  }

  function effacer() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sauvegarde.current = null;
    setValeur("");
    setVide(true);
  }

  return (
    <div className="group/sig">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-ink-faint">
          {legende}
        </span>
        <button
          type="button"
          onClick={effacer}
          className="rounded-full px-3 py-1 text-[0.6875rem] font-medium text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink active:scale-[0.97]"
        >
          Effacer
        </button>
      </div>

      {/* Double-bezel : coque extérieure + cœur intérieur concentrique. */}
      <div className="rounded-[1.35rem] bg-ink/[0.04] p-1.5 ring-1 ring-hairline">
        <div
          ref={conteneurRef}
          className="relative overflow-hidden rounded-[calc(1.35rem-0.375rem)] bg-surface shadow-[inset_0_1px_2px_rgba(12,17,22,0.05)]"
        >
          <canvas
            ref={canvasRef}
            onPointerDown={debut}
            onPointerMove={trace}
            onPointerUp={fin}
            onPointerLeave={fin}
            onPointerCancel={fin}
            className="block w-full cursor-crosshair touch-none"
            style={{ height: hauteur }}
          />
          {vide && (
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-6">
              <div className="w-[72%] border-b border-dashed border-ink/15 pb-2 text-center text-[0.7rem] text-ink-faint">
                Signez ici
              </div>
            </div>
          )}
        </div>
      </div>

      <input type="hidden" name={nom} value={valeur} />
    </div>
  );
}
