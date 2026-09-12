import type { BehaviorInstance, BehaviorMeta, BehaviorMigration } from './behavior'
import { validateBehaviorConfig, validateBehaviorSlots } from './behavior'
import { CATALOG, getModuleMeta, latestModuleVersion } from './catalog'

/**
 * Carrying a stored behavior instance across a contract version bump
 * ([[BUG-85]]).
 *
 * THE FAILURE THIS EXISTS FOR. `version` is bumped on a breaking contract
 * change and the catalog resolves an instance on `"<id>@<version>"`, so a bump
 * orphans every instance already stored on the old number. `account-chrome`
 * 1 → 2 did exactly that to 1st Contact's own site: one unresolvable instance,
 * and the entire page refused to load. Nothing noticed, because the only copy
 * the bumping commit migrated was the repo fixture — **a migration performed by
 * editing files in the repo can only ever reach the fixtures**, and the live
 * stores are structurally guaranteed to be missed.
 *
 * WHAT IS AUTOMATABLE AND WHAT IS NOT. The upgrade cannot be inferred. v1 → v2
 * had to invent a `sent` card to hold words that used to be config, and an
 * `error` card whose text lived in the component and was never stored at all —
 * no reading of a v1 instance produces either. So the migration is written by
 * hand, by the author making the breaking change, and declared on the contract
 * ({@link BehaviorMeta.migrations}). What this file automates is everything
 * around that: chaining the steps, validating the result, and — through
 * {@link missingMigrations} — refusing a bump that has not got one.
 */

/** A stored instance as a page holds it: identity, pin, and the contract's two halves. */
export interface StoredInstance {
  id: string
  type: string
  version: number
  config?: Record<string, unknown>
  slots?: BehaviorInstance['slots']
  /** Everything else a page may carry on an instance (`slot`, `background`, …), untouched. */
  [key: string]: unknown
}

/** A migration produced an instance its own new contract rejects. */
export class MigrationResultInvalidError extends Error {
  readonly name = 'MigrationResultInvalidError'
  /** The module the migration belongs to. */
  readonly type: string
  /** The version it was producing. */
  readonly version: number
  /** Why the target contract refused it. */
  readonly errors: readonly { field: string; message: string }[]

  constructor(type: string, version: number, errors: readonly { field: string; message: string }[]) {
    super(
      `Migration to '${type}' v${version} produced an instance its own contract rejects: ` +
        errors.map((e) => `${e.field}: ${e.message}`).join('; '),
    )
    this.type = type
    this.version = version
    this.errors = errors
  }
}

/**
 * The steps that carry `type` from `from` to `to`, or the versions that have no
 * step declared.
 *
 * Returned as a discriminated result rather than thrown, because both callers
 * want the gap itself: the guard wants to name every missing version at once,
 * and {@link upgradeInstance} wants to say which one stopped it.
 */
function pathFor(
  meta: BehaviorMeta,
  from: number,
  to: number,
): { ok: true; steps: BehaviorMigration[] } | { ok: false; missing: number[] } {
  const steps: BehaviorMigration[] = []
  const missing: number[] = []
  for (let v = from + 1; v <= to; v += 1) {
    const step = meta.migrations?.[v]
    if (step === undefined) missing.push(v)
    else steps.push(step)
  }
  return missing.length > 0 ? { ok: false, missing } : { ok: true, steps }
}

/**
 * Every version of every catalog module that no declared migration can reach.
 *
 * THE GUARD'S WHOLE CONTENT, and deliberately a pure function of the catalog:
 * it needs no stored data, so it runs in CI on every commit. Bump a module to 3
 * without declaring `migrations[3]` and this reports it **in the commit that
 * does the bumping**, instead of a site going dark days later in a store nobody
 * thought to look at.
 *
 * THE FLOOR IS {@link BehaviorMeta.migrationsFrom}, not 1. A module that has
 * never been bumped has nothing to migrate from, and one that has declared its
 * older versions extinct has nothing stored to migrate — see that field for why
 * the extinction is written down rather than left as an absence.
 */
export function missingMigrations(): { type: string; version: number }[] {
  const gaps: { type: string; version: number }[] = []
  for (const meta of CATALOG) {
    const path = pathFor(meta, oldestLive(meta), meta.version)
    if (!path.ok) for (const version of path.missing) gaps.push({ type: meta.id, version })
  }
  return gaps
}

/**
 * The oldest version this module still migrates from — its declared
 * {@link BehaviorMeta.migrationsFrom}, or 1 where it declares none.
 */
function oldestLive(meta: BehaviorMeta): number {
  return meta.migrationsFrom ?? 1
}

/** True when this instance's pin is already the catalog's current version. */
export function isCurrent(instance: StoredInstance): boolean {
  return instance.version === latestModuleVersion(instance.type)
}

/**
 * One instance carried to the current contract, and what had to be discarded
 * to get it there.
 */
export interface UpgradedInstance {
  instance: StoredInstance
  /**
   * Config keys the target contract does not declare, removed so the result
   * validates — named rather than dropped in silence.
   *
   * NOT A MIGRATION'S JOB, WHICH IS WHY IT IS HERE. An undeclared key is not a
   * version-N-to-N+1 concern; it is data that was never part of any contract,
   * admitted because config validation used to be lax (`account-chrome`'s
   * stored instance carried `account`, which no version ever declared). Every
   * migration would otherwise have to re-implement the same cleanup, and each
   * would be a fresh chance to do it silently.
   *
   * SAFE TO DROP, precisely because it is undeclared: a key no contract
   * declares is a key no component ever read, so nothing rendered from it.
   * Reported all the same, because "nothing read it" is a claim the operator
   * is entitled to check.
   */
  droppedConfigKeys: string[]
  /** Slot names the target contract does not declare. Same reasoning. */
  droppedSlots: string[]
}

/** Keys of `values` that `declared` does not mention, sorted. */
function undeclared(declared: Record<string, unknown>, values: Record<string, unknown>): string[] {
  return Object.keys(values)
    .filter((k) => !(k in declared))
    .sort()
}

/** `Object.fromEntries` minus a set of keys. */
function without<T>(values: Record<string, T>, remove: readonly string[]): Record<string, T> {
  return Object.fromEntries(Object.entries(values).filter(([k]) => !remove.includes(k)))
}

/**
 * Carry one stored instance up to its module's current contract version.
 *
 * Chained, so an instance two bumps behind crosses both steps in order and each
 * migration only ever has to know about the single version it produces.
 *
 * THE RESULT IS VALIDATED, AND A FAILURE IS AN ERROR RATHER THAN A WARNING.
 * Writing back an instance that fails its own new contract would trade a loud
 * catalog miss — which is at least a message naming the module and both
 * versions — for a quiet one that surfaces later as a render fault somewhere
 * else entirely. A migration that cannot produce a valid instance is a bug in
 * the migration, and the upgrade stops.
 *
 * Fields outside the contract (`slot`, `background`, `motion`, the pre-pivot
 * reproduction fields) are carried through untouched: they are the page's, not
 * the behavior contract's, and a version bump says nothing about them.
 */
export function upgradeInstance(instance: StoredInstance): UpgradedInstance {
  const target = latestModuleVersion(instance.type)
  if (instance.version === target) {
    return { instance, droppedConfigKeys: [], droppedSlots: [] }
  }
  if (instance.version > target) {
    throw new Error(
      `Instance '${instance.id}' pins '${instance.type}' v${instance.version}, which is ahead of ` +
        `the catalog's v${target}. This store was written by a newer build; upgrading it here ` +
        `would silently downgrade it.`,
    )
  }

  // Resolving the TARGET meta, never the stored one — the stored version is by
  // definition the one the catalog no longer has.
  const meta = getModuleMeta(instance.type, target)
  const floor = oldestLive(meta)
  if (instance.version < floor) {
    // The declaration was wrong, and this instance is the evidence. Said plainly
    // rather than as "no migration declared", because the remedy is different:
    // somebody has to write the missing steps AND correct the claim that
    // nothing was stored down here.
    throw new Error(
      `Instance '${instance.id}' pins '${instance.type}' v${instance.version}, below the oldest ` +
        `version that module still migrates from (v${floor}). That floor is a claim that nothing ` +
        `is stored below it, and this instance disproves it: lower \`migrationsFrom\` and declare ` +
        `the migrations that reach v${floor}.`,
    )
  }
  const path = pathFor(meta, instance.version, target)
  if (!path.ok) {
    throw new Error(
      `No migration path for '${instance.type}' v${instance.version} → v${target}: ` +
        `no migration declared for v${path.missing.join(', v')}. ` +
        `Declare it on the module's meta as \`migrations[${path.missing[0]}]\`.`,
    )
  }

  const { id, type, version: _stored, config, slots, ...rest } = instance
  let carried: BehaviorInstance = { config: config ?? {}, slots: slots ?? {} }
  for (const step of path.steps) carried = step(carried)

  // AFTER the migrations, not before: a migration is entitled to read a key it
  // is about to retire (v1 → v2 reads `sentMessage` to fill the `sent` slot),
  // so stripping first would take the input out from under it.
  const droppedConfigKeys = undeclared(meta.config, carried.config)
  const droppedSlots = undeclared(meta.slots, carried.slots)
  const upgradedConfig = without(carried.config, droppedConfigKeys)
  const upgradedSlots = without(carried.slots, droppedSlots)

  const errors = [
    ...validateBehaviorConfig(meta, upgradedConfig),
    ...validateBehaviorSlots(meta, upgradedSlots),
  ]
  if (errors.length > 0) throw new MigrationResultInvalidError(type, target, errors)

  return {
    instance: { id, type, version: target, config: upgradedConfig, slots: upgradedSlots, ...rest },
    droppedConfigKeys,
    droppedSlots,
  }
}

/**
 * What an upgrade would do to one page's modules — reported, never applied.
 *
 * Separated from the write so the default run of every driver above this can be
 * read-only. A facility that rewrites live site data the first time it is run
 * is not one to hand an operator.
 */
export interface InstanceUpgrade {
  /** The instance's id within its page. */
  id: string
  type: string
  /** The version it is stored at. */
  from: number
  /** The version it would be written at. */
  to: number
  /** The upgraded instance, ready to write. */
  upgraded: StoredInstance
  /** Config keys the target contract does not declare — see {@link UpgradedInstance}. */
  droppedConfigKeys: string[]
  /** Slot names the target contract does not declare. */
  droppedSlots: string[]
}

/**
 * Upgrade every stale instance in one page's `modules`, returning the new list
 * and what changed. A page with nothing stale returns its own list unchanged.
 *
 * A type the catalog does not know AT ANY version is left alone rather than
 * thrown on: it is a different failure — a module that was removed, or a page
 * written by a build that had one we do not — and an upgrade pass inventing an
 * opinion about it would be the wrong place to decide.
 */
export function upgradePageModules(modules: readonly StoredInstance[]): {
  modules: StoredInstance[]
  upgrades: InstanceUpgrade[]
} {
  const upgrades: InstanceUpgrade[] = []
  const out = modules.map((instance) => {
    const target = latestVersionOrNull(instance.type)
    if (target === null || target === instance.version) return instance
    const { instance: upgraded, droppedConfigKeys, droppedSlots } = upgradeInstance(instance)
    upgrades.push({
      id: instance.id,
      type: instance.type,
      from: instance.version,
      to: upgraded.version,
      upgraded,
      droppedConfigKeys,
      droppedSlots,
    })
    return upgraded
  })
  return { modules: out, upgrades }
}

/** `latestModuleVersion`, but null for a type the catalog has never heard of. */
function latestVersionOrNull(type: string): number | null {
  const versions = CATALOG.filter((m) => m.id === type).map((m) => m.version)
  return versions.length === 0 ? null : Math.max(...versions)
}
