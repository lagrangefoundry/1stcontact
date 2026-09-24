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
import { runMirror, MANIFEST_REL, MIRROR_DIR_REL, type MirrorReport } from '../fonts/mirror'
import { runPublish, type PublishReport } from '../fonts/publish'
import { localStores, runSeed } from '../fonts/seed'

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
