'use client'

import { WorldShell } from '@/components/world-shell'
import { Switch } from '@/components/ui/switch'
import { updateSettings } from '@/lib/fractions/fraction-progress'
import { RUNGS } from '@/lib/fractions/ladder'
import { useEnsureProfile, useProfile } from '@/lib/use-profile'

/**
 * Parent-facing settings. Kept off the main navigation on purpose — it
 * is reachable from the kluiskamer, not from a world tile, so a kid
 * poking around does not find the unlock switch by accident.
 */
export default function InstellingenPage() {
  useEnsureProfile()
  const profile = useProfile()

  const unlockAll = profile?.settings.unlockAllRungs ?? false

  return (
    <WorldShell world="kluis" backHref="/kluiskamer" backLabel="Kluiskamer">
      <div className="pt-5">
        <h1 className="font-display text-[1.4rem] font-extrabold tracking-tight">
          Instellingen
        </h1>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.13em] text-vault-dim">
          Voor ouders · geldt voor {profile?.name ?? 'dit profiel'}
        </p>
      </div>

      <section className="mt-5 rounded-2xl vault-card p-4">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[15px] font-bold tracking-tight">
              Alle breuken-tredes openzetten
            </h2>
            <p className="mt-1.5 text-[12px] leading-snug text-vault-dim">
              Normaal opent elke trede pas als de vorige af is. Zet dit aan
              als je kind op school al verder is dan trede 1 en niet eerst
              door {RUNGS.length - 1} tredes hoeft te werken.
            </p>
            <p className="mt-2 font-mono text-[10px] text-vault-dim">
              Voortgang telt gewoon door — dit opent alleen de deuren.
            </p>
          </div>
          <Switch
            checked={unlockAll}
            disabled={!profile}
            onCheckedChange={(checked) => updateSettings({ unlockAllRungs: checked })}
            aria-label="Alle breuken-tredes openzetten"
          />
        </div>
      </section>
    </WorldShell>
  )
}
