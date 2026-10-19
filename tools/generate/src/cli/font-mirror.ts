/**
 * [[REQ-312]] — `1c fonts mirror` and `1c fonts publish`, as commands.
 *
 * The mechanism is in `../fonts/`; this is the part that faces an operator:
 * which checkout, which commit, and what the run has to say for itself
 * afterwards. It sits beside `font-catalogue.ts` and `font-doc.ts` because the
 * three are one build-toolset story — the catalogue says what may be served, the
 * document advertises it, and the mirror is the bytes that make both true.
 */

import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { pathExists } from '../store/fsutil'
import { CommandError } from './errors'
import { cmdFontsIndex } from '../fonts/index-build'
import { loadPlatformManifest, runMirror, MANIFEST_REL, MIRROR_DIR_REL, type MirrorReport } from '../fonts/mirror'
import { platformObjects, readCloudRecord, runPublish, PLATFORM_BUCKET, type PublishReport } from '../fonts/publish'
import { localStores, readLocalRecord, runSeed } from '../fonts/seed'
import { digestOf, mirrorDigests, objectsToMove, type DeployedRecord } from '../fonts/deployed'

export interface MirrorCommandOptions {
  cwd?: string
  /** `--repo`: a path to a `google/fonts` checkout. */
  repo?: string
  /** `--ref`: the upstream commit, when the checkout is not a git working tree. */
  ref?: string
  /** `--only`: refresh just these slugs, leaving the rest of the manifest alone. */
  only?: string[]
  /** `--quality`: brotli level. Lower trades mirror size for wall-clock. */
  quality?: number
  /** Today, injectable so a run is reproducible under test. */
  today?: string
  onProgress?: (line: string) => void
}

/**
 * The upstream checkout, which the operator must already hold.
 *
 * NO CLONE HAPPENS HERE, and that is the ticket's framing rather than a
 * limitation: the corpus is ~2.5 GB of font binaries, so acquiring it is a
 * deliberate act with a location the operator chooses and reuses across
 * refreshes — a dependency, not a temp directory a build verb fills and deletes.
 * `1c fonts catalogue` may clone because it takes a blobless 5 MB slice; this
 * takes the blobs.
 */
function requireCheckout(repo: string | undefined): string {
  if (!repo) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: '`1c fonts mirror` needs a google/fonts checkout: pass --repo <dir>.',
      hint:
        'The mirror takes ~2.5GB of font binaries, so the checkout is acquired once and reused:\n' +
        '  git clone --depth 1 https://github.com/google/fonts /path/to/google-fonts\n' +
        'then `1c fonts mirror --repo /path/to/google-fonts`.',
    })
  }
  if (/^https?:|^git@/i.test(repo)) {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: '--repo must be a checkout on disk, not a URL.',
      hint:
        'Cloning ~2.5GB inside a build verb would re-download the corpus on every refresh. ' +
        'Clone it once (`git clone --depth 1 https://github.com/google/fonts <dir>`) and point --repo at it.',
    })
  }
  if (!pathExists(path.join(repo, 'ofl'))) {
    throw new CommandError({
      code: 'NOT_FOUND',
      message: `${repo} does not look like a google/fonts checkout — it holds no 'ofl' directory.`,
      path: repo,
    })
  }
  return path.resolve(repo)
}

/**
 * The commit the mirror is pinned to.
 *
 * Read from the checkout, because the pin has to describe the bytes actually
 * taken rather than the bytes an operator believed they had. `--ref` is the
 * escape hatch for a checkout that is not a git working tree (an unpacked
 * archive), and the absence of both is refused rather than defaulted: a manifest
 * claiming to be pinned to "unknown" is not pinned.
 */
function resolveRef(checkout: string, given: string | undefined): string {
  if (given) return given
  try {
    return execFileSync('git', ['-C', checkout, 'rev-parse', 'HEAD'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    }).trim()
  } catch {
    throw new CommandError({
      code: 'SCHEMA_INVALID',
      message: `Cannot read the upstream commit from ${checkout}, and no --ref was given.`,
      hint:
        'The manifest records which commit the bytes came from so two builds of the same repo commit ' +
        'serve the same faces. Pass --ref <sha> for a checkout that is not a git working tree.',
    })
  }
}

/** `YYYY-MM-DD`, in UTC — the date a mirrored family records as its own. */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export function cmdFontsMirror(options: MirrorCommandOptions = {}): MirrorReport {
  const cwd = options.cwd ?? process.cwd()
  const checkout = requireCheckout(options.repo)
  const report = runMirror({
    cwd,
    checkout,
    ref: resolveRef(checkout, options.ref),
    only: options.only,
    quality: options.quality,
    today: options.today ?? todayUtc(),
    onProgress: options.onProgress,
  })
  /*
   * [[REQ-313]] — AND THE ASSISTANT'S PROJECTION, IN THE SAME BREATH.
   *
   * `use_font` serves a face by writing a path this manifest recorded, and it
   * reads those paths out of a projection rather than out of the manifest itself,
   * because it runs in a Worker with no filesystem. A mirror refreshed without
   * re-projecting therefore leaves the assistant binding paths the origin no
   * longer serves — a failure visible from nowhere, since the manifest is right
   * and the origin is right and the page validates.
   *
   * So it is not a step anybody has to remember. `1c fonts index` still exists as
   * its own verb, because a refreshed CATALOGUE changes the projection without
   * changing a single byte of the mirror, and that must not cost 2.5GB of upstream
   * binaries to pick up.
   */
  cmdFontsIndex(cwd)
  return report
}

export async function cmdFontsPublish(options: {
  cwd?: string
  dryRun?: boolean
  onProgress?: (line: string) => void
} = {}): Promise<PublishReport> {
  return runPublish({
    cwd: options.cwd ?? process.cwd(),
    dryRun: options.dryRun,
    onProgress: options.onProgress,
  })
}

/**
 * [[REQ-315]] — the same mirror, delivered to the environment the work is done in.
 *
 * A SECOND DELIVERY, NOT A SECOND MIRROR. `publish` and `seed` differ in exactly
 * one thing — where the bytes are put — and share the object set, the prefix, the
 * key function, the digest check, the report and the formatter. See `seed.ts` for
 * why the local store is written through miniflare's own `R2Bucket` rather than
 * through its on-disk format.
 */
export async function cmdFontsSeed(options: {
  cwd?: string
  dryRun?: boolean
  apps?: string[]
  onProgress?: (line: string) => void
} = {}): Promise<PublishReport> {
  return runSeed({
    cwd: options.cwd ?? process.cwd(),
    dryRun: options.dryRun,
    apps: options.apps,
    onProgress: options.onProgress,
  })
}

/**
 * Seed the local stores at the tail of a mirror run, reporting rather than
 * failing ([[REQ-315]]).
 *
 * NOT A STEP ANYBODY HAS TO REMEMBER, for the reason `cmdFontsMirror` already
 * runs `1c fonts index` at its own tail: a mirror that leaves the operator's own
 * dev environment unable to serve what it just spent an hour and a half
 * converting has not finished. The projection and the local bytes are the same
 * class of follow-on, and the projection is what makes the omission harmful —
 * it fills in every environment at once, so `use_font` starts binding paths
 * local dev cannot answer at the exact moment the mirror completes.
 *
 * AND A FAILURE HERE DOES NOT FAIL THE MIRROR. The expensive, resumable work is
 * already on disk and its manifest is written; a store that could not be opened
 * is an ordinary local condition — no `apps/` tree at all, in a consumer that
 * vendors only the tool — and losing a mirror run over it would be trading the
 * whole thing for the convenience. `1c fonts seed` re-runs it.
 */
export async function seedAfterMirror(
  cwd: string,
  onProgress: (line: string) => void = () => {},
): Promise<PublishReport | null> {
  if (localStores(cwd).length === 0) return null
  try {
    return await runSeed({ cwd, onProgress })
  } catch (err) {
    onProgress(`  local dev stores not seeded: ${(err as Error).message}`)
    onProgress('  run `1c fonts seed` to retry — the mirror itself is complete.')
    return null
  }
}

/**
 * [[REQ-412]] — one destination's answer to "is the mirror deployed here?".
 *
 * `unreadable` is its own state and not a kind of `absent`: a bucket that could
 * not be asked has not been shown to be stale, and a deploy that cannot ask
 * must say so rather than guess either way.
 */
export interface FontsDeployDestination {
  /** `1stcontact-sites (cloud)`, or the app whose local store this is. */
  name: string
  /** The app, for a local store — what a seed is narrowed to. */
  app?: string
  state: 'current' | 'stale' | 'absent' | 'unreadable'
  /** Objects a delivery would send, by the record's account. */
  moves: number
  /** Why it could not be read, for `unreadable`. */
  reason?: string
  deployedAt?: string
}

/**
 * What a change-detected font deploy decided.
 *
 *   unchanged     every destination already holds this manifest — nothing sent
 *   deployed      at least one did not, and the existing delivery ran
 *   would-deploy  a rehearsal that found something to send
 *   stale         `--check` (bin/deploy --no-fonts) found something it did not send
 *   blocked       something is stale and the mirror is not fully staged
 *   unstaged      at the local target, something is stale and NOTHING is staged —
 *                 a fresh checkout or worktree; the deploy proceeds, warned
 *   unknown       a destination could not be read, under a rehearsal or a check
 *   no-mirror     there is no manifest, so there is nothing to deploy
 *   no-store      at the local target, no app in this deploy serves platform fonts
 */
export type FontsDeployOutcome =
  | 'unchanged'
  | 'deployed'
  | 'would-deploy'
  | 'stale'
  | 'blocked'
  | 'unstaged'
  | 'unknown'
  | 'no-mirror'
  | 'no-store'

export interface FontsDeployReport {
  target: 'cloud' | 'local'
  mode: 'deliver' | 'dry-run' | 'check'
  outcome: FontsDeployOutcome
  /** Objects the manifest names. */
  objects: number
  /** Objects the manifest names that are not staged — reported whether or not they would block. */
  missing: string[]
  destinations: FontsDeployDestination[]
  /** The delivery's own report, when one ran. */
  delivery?: PublishReport
}

export interface FontsDeployOptions {
  cwd?: string
  target: 'cloud' | 'local'
  /** At the local target, the apps being deployed; their stores are the ones checked. */
  apps?: string[]
  dryRun?: boolean
  /** Report only — never deliver, never fail on staleness (`bin/deploy --no-fonts`). */
  check?: boolean
  env?: NodeJS.ProcessEnv
  onProgress?: (line: string) => void
}

/**
 * [[REQ-412]] — deploy the platform fonts IF, AND ONLY IF, the mirror has
 * changed since the last font deploy to this target.
 *
 * NOT A THIRD DELIVERY. Deciding is the only new thing here: what runs when a
 * destination is stale is `runPublish` / `runSeed`, unchanged, which digest-check
 * every object and write the record this reads. So `bin/deploy --fonts` and an
 * ordinary `bin/deploy` deliver identically and leave identical evidence.
 *
 * THE MIRROR NEED BE STAGED ONLY WHEN SOMETHING WILL MOVE. The comparison is
 * of the manifest against the destination's record and reads no font bytes, so
 * a machine without the mirror can deploy code to a bucket that is current. A
 * stale destination with an incomplete mirror is BLOCKED rather than partially
 * delivered: a new Worker shipped against half the fonts it binds is the failure
 * this exists to prevent. Under a rehearsal that is reported, not raised — a
 * rehearsal's job is to say everything a real run would meet.
 *
 * EXCEPT A LOCAL TARGET WITH NOTHING STAGED AT ALL. A fresh checkout or a
 * branch worktree holds no mirror (it is gitignored and 1.35 GB) and its dev
 * stores are its own and disposable; that is not a half-staged mirror, and
 * refusing it would make every local deploy outside the main checkout fail.
 * It proceeds with a warning. The cloud is never excused: there the stale
 * bucket is what the public is served.
 */
export async function cmdFontsDeploy(options: FontsDeployOptions): Promise<FontsDeployReport> {
  const cwd = options.cwd ?? process.cwd()
  const env = options.env ?? process.env
  const mode = options.check ? 'check' : options.dryRun ? 'dry-run' : 'deliver'
  const base = { target: options.target, mode } as const

  const manifest = loadPlatformManifest(cwd)
  if (!manifest) return { ...base, outcome: 'no-mirror', objects: 0, missing: [], destinations: [] }
  const current = mirrorDigests(manifest)
  const missing = platformObjects(cwd, manifest)
    .filter((o) => !pathExists(o.file))
    .map((o) => o.path)
  const objects = Object.keys(current).length
  const digest = digestOf(current)

  const judge = (name: string, record: DeployedRecord | null, app?: string): FontsDeployDestination => ({
    name,
    ...(app ? { app } : {}),
    state: record === null ? 'absent' : record.digest === digest ? 'current' : 'stale',
    moves: record?.digest === digest ? 0 : objectsToMove(current, record),
    ...(record ? { deployedAt: record.deployedAt } : {}),
  })
  const unreadable = (name: string, err: unknown, app?: string): FontsDeployDestination => ({
    name,
    ...(app ? { app } : {}),
    state: 'unreadable',
    moves: objects,
    reason: (err as Error).message,
  })

  const destinations: FontsDeployDestination[] = []
  if (options.target === 'cloud') {
    const name = `${PLATFORM_BUCKET} (cloud)`
    try {
      destinations.push(judge(name, await readCloudRecord(env)))
    } catch (err) {
      destinations.push(unreadable(name, err))
    }
  } else {
    // The apps being deployed that serve fonts; an app that does not is not an
    // error here, as it is to `1c fonts seed --app` — it simply has no store.
    const wanted = options.apps && options.apps.length > 0 ? new Set(options.apps) : null
    const stores = localStores(cwd).filter((store) => wanted === null || wanted.has(store.app))
    if (stores.length === 0) return { ...base, outcome: 'no-store', objects, missing, destinations }
    for (const store of stores) {
      try {
        destinations.push(judge(store.app, await readLocalRecord(cwd, store), store.app))
      } catch (err) {
        destinations.push(unreadable(store.app, err, store.app))
      }
    }
  }

  const behind = destinations.filter((d) => d.state !== 'current')
  if (behind.length === 0) return { ...base, outcome: 'unchanged', objects, missing, destinations }

  const report = { ...base, objects, missing, destinations }
  const incomplete: FontsDeployOutcome =
    options.target === 'local' && missing.length === objects ? 'unstaged' : 'blocked'
  if (mode !== 'deliver') {
    if (behind.some((d) => d.state === 'unreadable')) return { ...report, outcome: 'unknown' }
    return { ...report, outcome: mode === 'check' ? 'stale' : missing.length > 0 ? incomplete : 'would-deploy' }
  }
  const cannotAsk = behind.find((d) => d.state === 'unreadable')
  if (cannotAsk) {
    throw new CommandError({
      code: 'ENVIRONMENT',
      message: `Cannot tell whether the platform fonts are deployed to ${cannotAsk.name}: ${cannotAsk.reason}`,
      hint:
        'A code deploy now ships the fonts first when they have changed, and that needs the deploy ' +
        'record. Fix the credential, or pass --no-fonts for an emergency code-only deploy.',
    })
  }
  if (missing.length > 0) return { ...report, outcome: incomplete }

  const delivery =
    options.target === 'cloud'
      ? await runPublish({ cwd, env, onProgress: options.onProgress })
      : await runSeed({ cwd, apps: behind.map((d) => d.app!), onProgress: options.onProgress })
  return { ...report, outcome: 'deployed', delivery }
}

/** The fix for an incomplete mirror, naming the families it would restage. */
function restageHint(missing: string[]): string {
  const slugs = [...new Set(missing.map((m) => m.split('/')[0]).filter((s) => !s.includes('.')))]
  const only = slugs.length > 0 && slugs.length <= 20 ? ` --only ${slugs.join(',')}` : ''
  return `1c fonts mirror --repo <google/fonts>${only}`
}

/**
 * [[REQ-412]] — the decision in one line, and the reason under it.
 *
 * ONE LINE FIRST, ALWAYS, because "fonts were not deployed" is the fact an
 * operator most needs and least expects to have to look for: the deploy says
 * `platform fonts: unchanged` as readily as it says what it sent.
 */
export function formatFontsDeployReport(report: FontsDeployReport): string {
  const since = (d: FontsDeployDestination): string =>
    d.state === 'absent'
      ? 'never deployed here'
      : d.state === 'unreadable'
        ? `could not be read — ${d.reason}`
        : `${d.moves} object(s) changed since ${d.deployedAt || 'the last font deploy'}`
  const lines: string[] = []
  switch (report.outcome) {
    case 'no-mirror':
      return 'platform fonts: no fonts/platform.json — nothing to deploy'
    case 'no-store':
      return 'platform fonts: no app in this deploy serves them locally — nothing to deploy'
    case 'unchanged':
      lines.push(`platform fonts: unchanged (${report.objects} objects, as last deployed)`)
      break
    case 'deployed':
      lines.push('platform fonts: deployed — the target did not hold this mirror')
      break
    case 'would-deploy':
      lines.push('platform fonts: would deploy — the target does not hold this mirror')
      break
    case 'stale':
      lines.push('platform fonts: STALE and NOT deployed (--no-fonts) — this deploy serves the old fonts')
      break
    case 'blocked':
      lines.push(
        `platform fonts: BLOCKED — the target does not hold this mirror, and ${report.missing.length} object(s) the manifest ` +
          `names are not staged${report.mode === 'dry-run' ? ', so a real deploy would stop here' : ''}`,
      )
      break
    case 'unstaged':
      lines.push(
        'platform fonts: NOT deployed — no mirror is staged in this checkout, so local dev serves no ' +
          'platform fonts. Stage it with `1c fonts mirror --repo <google/fonts> --quality 9`.',
      )
      break
    case 'unknown':
      lines.push('platform fonts: unknown — the deploy record could not be read')
      break
  }
  for (const d of report.destinations) {
    lines.push(`  ${d.name.padEnd(28)} ${d.state === 'current' ? 'current' : since(d)}`)
  }
  if (report.outcome === 'blocked') {
    for (const m of report.missing.slice(0, 5)) lines.push(`  not staged: ${m}`)
    if (report.missing.length > 5) lines.push(`  …and ${report.missing.length - 5} more`)
    lines.push(`  Stage them first: ${restageHint(report.missing)}`)
  }
  if (report.delivery) lines.push(formatPublishReport(report.delivery))
  return lines.join('\n')
}

/**
 * [[REQ-412]] — the decision as a capability-report row, in the shape
 * `bin/deploy.d/lib/probe.mjs` prints, so the fonts appear in the ONE place an
 * operator reads what this deployment can and cannot do.
 */
export function fontsCapabilityRow(report: FontsDeployReport): Record<string, unknown> {
  const fresh = ['unchanged', 'deployed', 'no-mirror', 'no-store'].includes(report.outcome)
  const verdict: Record<FontsDeployOutcome, string> = {
    unchanged: 'capable',
    deployed: 'capable',
    'would-deploy': 'would deploy',
    stale: 'STALE',
    blocked: 'BLOCKED',
    unstaged: 'absent',
    unknown: 'unproven',
    'no-mirror': 'absent',
    'no-store': 'absent',
  }
  return {
    credential: 'platform fonts',
    verdict: verdict[report.outcome],
    can: fresh && report.objects > 0 ? [`serve the ${report.objects} mirrored objects in fonts/platform.json`] : [],
    cannot: fresh
      ? []
      : [formatFontsDeployReport({ ...report, delivery: undefined }).split('\n')[0].replace(/^platform fonts: /, '')],
    expiry: 'n/a — a font mirror does not expire; it is compared with the manifest on every deploy',
    effect: fresh
      ? ''
      : 'pages may render fallback faces for any font the manifest changed since the last font deploy',
  }
}

const mb = (bytes: number): string => `${(bytes / 1_000_000).toFixed(1)}MB`

/** Human rendering of a mirror run — what moved, what did not, and what is missing. */
export function formatMirrorReport(report: MirrorReport): string {
  const lines = [
    `fonts mirror — ${report.families} families, ${mb(report.bytes)} of woff2`,
    `  ${report.written} file(s) converted and written, ${report.unchanged} unchanged (not transferred)`,
    `  manifest: ${MANIFEST_REL}    staged bytes: ${MIRROR_DIR_REL}/ (gitignored — publish with \`1c fonts publish\`)`,
  ]
  if (report.written === 0 && report.failures.length === 0) {
    lines.push('  nothing moved — the catalogue and the checkout agree with the manifest')
  }
  // Reported rather than dropped: a live site may be serving one of these right
  // now, so their manifest entries were retained.
  const retained = (label: string, families: string[]): void => {
    if (families.length === 0) return
    lines.push('')
    lines.push(`${label} — entries RETAINED, because a live site may be serving them:`)
    for (const family of families) lines.push(`  ${family}`)
  }
  retained('Gone from the upstream checkout', report.removedUpstream)
  retained('No longer in the catalogue', report.delisted)

  if (report.failures.length > 0) {
    lines.push('')
    lines.push(`${report.failures.length} famil${report.failures.length === 1 ? 'y' : 'ies'} could not be mirrored:`)
    for (const failure of report.failures) lines.push(`  ${failure.family} — ${failure.reason}`)
  }
  return lines.join('\n')
}

/**
 * Human rendering of a publish OR a seed run — one account of a delivery,
 * whichever target made it ([[REQ-315]]).
 *
 * The stores are listed by name because the local bucket is per app directory:
 * a surface absent from this list will 404 the fonts the one above it renders,
 * and that has to be readable here rather than discovered in a browser.
 */
export function formatPublishReport(report: PublishReport): string {
  const local = report.stores !== undefined
  const lines = [
    `fonts ${local ? 'seed' : 'publish'} — ${report.dryRun ? 'DRY RUN: ' : ''}${report.uploaded} object(s) ` +
      `${report.dryRun ? 'would be sent' : 'sent'}, ${report.unchanged} already current, ${mb(report.bytes)} staged`,
    `  bucket: ${report.bucket}${local ? ' (local — miniflare, on this machine)' : ''}`,
  ]
  for (const store of report.stores ?? []) lines.push(`  ${store.app.padEnd(14)} ${store.persist}`)
  if (report.missing.length > 0) {
    lines.push('')
    lines.push(
      `${report.missing.length} object(s) the manifest names are not staged — the mirror is incomplete:`,
    )
    for (const missing of report.missing.slice(0, 10)) lines.push(`  ${missing}`)
    if (report.missing.length > 10) lines.push(`  …and ${report.missing.length - 10} more`)
    lines.push('  Re-run `1c fonts mirror` to stage them.')
  }
  return lines.join('\n')
}
