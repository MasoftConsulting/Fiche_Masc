import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Reveler } from "@/components/reveler";
import { lireSessionAdmin } from "@/lib/session";
import { lireClient } from "@/lib/clients";
import { listerEquipements } from "@/lib/equipements";
import { initiales } from "@/lib/format";
import { EditionClient } from "./edition-client";
import { GestionEquipements } from "./gestion-equipements";

export const dynamic = "force-dynamic";

export default async function PageClient({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ equipement_supprime?: string }>;
}) {
  const session = await lireSessionAdmin();
  if (!session) redirect("/fiches?erreur=droits");

  const { id } = await params;
  const { equipement_supprime } = await searchParams;

  const client = await lireClient(id);
  if (!client) notFound();

  const equipements = await listerEquipements(id);

  return (
    <div className="space-y-10">
      <Reveler>
        <header className="pt-8 md:pt-14">
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-2 text-[0.8rem] text-ink-soft transition-colors duration-500 ease-mass hover:text-ink"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9.5 3.5 5 8l4.5 4.5" />
            </svg>
            Clients
          </Link>

          <div className="mt-6 flex items-start gap-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-navy text-[0.95rem] font-semibold text-white">
              {initiales(client.nom)}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] sm:text-[2.4rem]">
                {client.nom}
              </h1>
              <p className="mt-2 text-[0.82rem] text-ink-soft">
                {[client.adresse, client.contact].filter(Boolean).join(" · ") || "—"}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[0.78rem] text-ink-faint">
                {client.telephone && <span>☎ {client.telephone}</span>}
                {client.email && <span>{client.email}</span>}
              </div>
            </div>
          </div>
        </header>
      </Reveler>

      {equipement_supprime && (
        <p className="rounded-2xl bg-jade/10 px-5 py-3.5 text-[0.85rem] text-jade">
          Équipement supprimé. Les fiches liées restent au registre.
        </p>
      )}

      <Reveler delai={80}>
        <EditionClient client={client} />
      </Reveler>

      <Reveler delai={160}>
        <GestionEquipements clientId={client.id} equipements={equipements} />
      </Reveler>
    </div>
  );
}