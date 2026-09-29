import { redirect } from "next/navigation";
import { lireSession } from "@/lib/session";
import "./impression.css";

export default async function LayoutImpression({ children }: { children: React.ReactNode }) {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  return <>{children}</>;
}
