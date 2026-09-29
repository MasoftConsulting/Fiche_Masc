import { redirect } from "next/navigation";
import { Coquille } from "@/components/coquille";
import { lireSessionAdmin } from "@/lib/session";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  // Garde de section : tout /admin/* est réservé à l'administrateur. Les Server
  // Actions revérifient de leur côté, une garde de page ne les couvre pas.
  if (!(await lireSessionAdmin())) redirect("/fiches?erreur=droits");

  return <Coquille>{children}</Coquille>;
}
