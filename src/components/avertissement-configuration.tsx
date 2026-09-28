export function AvertissementConfiguration() {
  return (
    <div className="pt-16">
      <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70 shadow-flottant">
        <div className="rounded-[calc(2rem-0.5rem)] bg-surface p-9">
          <h1 className="font-display text-[1.8rem] font-semibold tracking-[-0.035em]">
            Supabase n&apos;est pas connecté
          </h1>
          <p className="mt-4 max-w-lg text-[0.92rem] leading-relaxed text-ink-soft">
            Renseignez{" "}
            <code className="rounded bg-ink/5 px-1.5 py-0.5">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            et{" "}
            <code className="rounded bg-ink/5 px-1.5 py-0.5">
              SUPABASE_SERVICE_ROLE_KEY
            </code>{" "}
            dans
            <code className="mx-1 rounded bg-ink/5 px-1.5 py-0.5">.env.local</code>, puis
            exécutez
            <code className="mx-1 rounded bg-ink/5 px-1.5 py-0.5">supabase/schema.sql</code>{" "}
            dans l&apos;éditeur SQL du projet Supabase.
          </p>
        </div>
      </div>
    </div>
  );
}