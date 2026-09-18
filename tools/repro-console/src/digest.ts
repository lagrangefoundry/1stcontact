/**
 * The derived facts a round would otherwise spend its reads deriving
 * ([[REQ-261]] behavior 7).
 *
 * A round has no `Bash`, deliberately ([[REQ-256]] behavior 3), so it cannot
 * query a 4,000-line `multistate.json` — it reads it and greps it. That is the
 * right trade and this does not reopen it. The cheaper half of the same problem
 * is the console's: it is already writing the evidence directory, it already has
 * every file parsed, and where a round predictably needs a COUNTED fact the
 * console can count it once and let the round read one line.
 *
 * The first live round is the worked example. It spent four tool calls
 * establishing that the string `"src"` occurs zero times in the reference
 * manifest, and three more establishing that the one mirrored image IS named
 * there — under `backgroundImageUrl`, not `src`. Both are arithmetic over a file
 * the console has open.
 *
 * ## An addition, never a replacement
 *
 * The one rule is that a claim comes from the captured file. A digest that stood
 * IN for the evidence would be the console reconstructing on the round's behalf,
 * which is precisely the habit [[DOC-19]] says produces reconstructions. So:
 * every path this digest derives from is still handed to the round, the prompt
 * says the digest is arithmetic rather than a source, and every section of it
 * names the file it was computed from so a claim can be taken back there.
 *
 * ## Counted, not interpreted
 *
 * Nothing here decides anything. There is no ranking of what matters, no
 * hypothesis, no "this looks like". Counts, paths and inventories — the facts
 * that are expensive to gather and cheap to check.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { provenanceOf } from './bundle'

/** Where the digest is written, inside the round's own directory. */
export const DIGEST_FILE = 'evidence-digest.md'

/** Nothing is listed without a bound, and a bound is always said out loud. */
const MAX_DELTAS = 60
const MAX_REGIONS = 20
const MAX_KEYS = 50
const MAX_PATHS_PER_ASSET = 12
const MAX_LANDED = 30

/** The parsed evidence, or `undefined` where a file was missing or unreadable. */
export interface DigestInput {
  n: number
  gate?: unknown
  valuesDiff?: unknown
  regions?: unknown
  capture?: unknown
  manifest?: unknown
  page?: unknown
  /** The reference bundle this iteration measured against. */
  bundleDir?: string
  /**
   * The engine commits that landed AFTER this reference was captured
   * ([[REQ-272]] part 2, item 3), newest first, one line each.
   *
   * Computed by the console because it is the console that has a shell. This is
   * the arithmetic a round should never pay for: the question "had the fixes I
   * am measuring already landed when this oracle was taken" cost one observed
   * round $7.70 and 78 turns to answer, and every input to it — the bundle's own
   * `capturedAt` and the engine's own log — was on this disk the whole time.
   */
  landedSince?: string[]
}

// ── generic JSON arithmetic ──────────────────────────────────────────────────

/**
 * Walk every value in a JSON document, path-templated.
 *
 * `[]` stands for every index of an array, so `sections[].background.image`
 * aggregates across the sections rather than producing one path per section.
 * That is what makes an occurrence list short enough to read.
 */
function walk(value: unknown, visit: (pathTemplate: string, key: string, leaf: unknown) => void, at = ''): void {
  if (Array.isArray(value)) {
    for (const entry of value) {
      // An array element is visited under an EMPTY key: it carries no field
      // name of its own, and attributing its parent's name to each of them
      // would count that name once per element in the censuses.
      visit(`${at}[]`, '', entry)
      walk(entry, visit, `${at}[]`)
    }
    return
  }
  if (typeof value !== 'object' || value === null) return
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const here = at ? `${at}.${key}` : key
    visit(here, key, entry)
    walk(entry, visit, here)
  }
}

/**
 * How often each KEY NAME occurs in a document, commonest first.
 *
 * By name rather than by path, because the question it answers is "does this
 * document have such a field at all" — the question that cost the first round
 * four reads. A key absent from the census occurs zero times.
 */
export function keyCensus(document: unknown): Array<[string, number]> {
  const counts = new Map<string, number>()
  // Array elements arrive under an empty key and are not field names.
  walk(document, (_pathTemplate, key) => {
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

/** How often each value of one key occurs — `kind`, `role`, and their like. */
export function valueCensus(document: unknown, wanted: string): Array<[string, number]> {
  const counts = new Map<string, number>()
  walk(document, (_pathTemplate, key, leaf) => {
    if (key !== wanted || typeof leaf !== 'string') return
    counts.set(leaf, (counts.get(leaf) ?? 0) + 1)
  })
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

/** Every path whose string value mentions `needle`, and how many times. */
export function stringOccurrences(document: unknown, needle: string): Array<[string, number]> {
  const counts = new Map<string, number>()
  walk(document, (pathTemplate, _key, leaf) => {
    if (typeof leaf !== 'string' || !leaf.includes(needle)) return
    counts.set(pathTemplate, (counts.get(pathTemplate) ?? 0) + 1)
  })
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

// ── the digest ───────────────────────────────────────────────────────────────

const IMAGE_SUFFIX = /\.(png|jpe?g|gif|webp|avif|svg)$/i

interface Asset {
  kind?: string
  src?: string
  localPath?: string
}

/** The mirrored assets that are images, however the capture labelled them. */
function imageAssets(capture: unknown): Asset[] {
  const assets = (capture as { assets?: unknown })?.assets
  if (!Array.isArray(assets)) return []
  return (assets as Asset[]).filter(
    (asset) => asset?.kind === 'image' || (typeof asset?.localPath === 'string' && IMAGE_SUFFIX.test(asset.localPath)),
  )
}

function bullets(rows: string[], cap: number, more: string): string {
  if (!rows.length) return '_none._'
  const shown = rows.slice(0, cap).map((row) => `- ${row}`)
  if (rows.length > cap) shown.push(`- …and ${rows.length - cap} more — ${more}`)
  return shown.join('\n')
}

/**
 * The digest, as markdown.
 *
 * Pure: it takes parsed documents and returns text, so what it says is testable
 * without a reproduction, a browser or a disk.
 */
/**
 * BUG-99 — the best lead on one side of a region, in one phrase.
 *
 * `nothing` is a real answer and the most informative one there is: a region the
 * reference has a node under and the reproduction does not is something we
 * failed to draw.
 */
function leadPhrase(side: unknown): string {
  const leads = Array.isArray(side) ? (side as Array<Record<string, unknown>>) : []
  const lead = leads[0]
  if (!lead) return '_nothing_'
  const what = lead.text ? `“${String(lead.text)}”` : String(lead.src ?? lead.role ?? lead.kind ?? 'node')
  const overlap = (lead.overlap ?? {}) as Record<string, unknown>
  const pct = typeof overlap.ofRegion === 'number' ? ` (${Math.round(overlap.ofRegion * 100)}% of region)` : ''
  return `${what}${pct}`
}

/**
 * WHEN THIS REFERENCE WAS TAKEN, AND WHAT LANDED SINCE ([[REQ-272]] part 2).
 *
 * First section of the digest, because it is the one that can invalidate every
 * section under it. A residual measured against an oracle older than the fix for
 * it is a fix waiting on a re-capture, not an outstanding gap — and a round that
 * files it as a gap has filed a ticket for work that is already done.
 *
 * `refold` cannot close that window and never will: it re-derives the fold from
 * the oracle the OLD extractor wrote, so an axis a capture fix added is absent
 * from it by construction. Only [recapture] moves it, which is why this says so
 * rather than leaving the round to work it out.
 *
 * SAID EVEN WHEN THERE IS NOTHING TO SAY. A bundle with no `capturedAt` gets a
 * line stating that, because "this reference cannot say when it was taken" is
 * itself a finding about the instrument and one worth a bug ticket.
 */
function referenceSection(input: DigestInput): string[] {
  const { capturedAt, captureSchema } = provenanceOf(input.capture)
  const landed = input.landedSince ?? []
  const out = [
    '## The reference this round measured against (`capture.json`)',
    '',
    input.bundleDir ? `- bundle: \`${input.bundleDir}\`` : '- bundle: _not recorded._',
    capturedAt
      ? `- captured at: \`${capturedAt}\``
      : '- captured at: **this bundle carries no capture time** — it predates the stamp, so nothing can tell how old the oracle under every number below is.',
    captureSchema === undefined
      ? '- capture schema: **unstamped** ([[REQ-270]]) — read as schema 1, so any axis the extractor learned to record since is absent from this oracle whatever the fold now does with it.'
      : `- capture schema: \`${captureSchema}\``,
    '',
  ]
  if (!capturedAt) {
    out.push('_No capture time, so what landed since it cannot be listed._', '')
    return out
  }
  if (!landed.length) {
    out.push(
      'Nothing has landed in the engine since this reference was captured, so every residual below is measured by the instrument that is running now.',
      '',
    )
    return out
  }
  out.push(
    `**${landed.length} commit(s) have landed in the engine since this reference was captured.** A residual below may already be fixed and merely not re-captured: \`1c refold\` re-derives the fold from the oracle this bundle already holds and never re-runs the capture, so a CAPTURE-side fix is invisible here until the operator presses [recapture]. Check the ones that touch what you are about to file before you file it.`,
    '',
    bullets(landed, MAX_LANDED, 'read `git log` yourself if you need the tail'),
    '',
  )
  return out
}

export function buildDigest(input: DigestInput): string {
  const out: string[] = [
    `# Derived facts — iteration ${input.n}`,
    '',
    'Computed by the console from the files named in each heading. **This is arithmetic, not a source.**',
    'It exists so you do not have to spend reads counting. Anything you quote in a ticket, quote from the',
    'file it came from — the one rule binds this page exactly as hard as it binds the rest of the round.',
    '',
  ]

  // ── the reference's own provenance ─────────────────────────────────────────
  out.push(...referenceSection(input))

  // ── value deltas ───────────────────────────────────────────────────────────
  const deltas = ((input.valuesDiff as { deltas?: unknown })?.deltas ?? []) as Array<Record<string, unknown>>
  const matched = (input.valuesDiff as { matched?: unknown })?.matched
  const unmatched = (input.valuesDiff as { unmatched?: unknown })?.unmatched
  out.push(
    `## Value deltas — ${Array.isArray(deltas) ? deltas.length : 0} (\`values-diff.json\`)`,
    '',
    `matched ${String(matched ?? '?')} · unmatched ${String(unmatched ?? '?')}`,
    '',
    bullets(
      (Array.isArray(deltas) ? deltas : [])
        .slice()
        .sort((a, b) => Number(b.severity ?? 0) - Number(a.severity ?? 0))
        .map(
          (delta) =>
            `**${String(delta.tier ?? '?')}** \`${String(delta.property ?? delta.kind ?? '?')}\` on “${String(delta.text ?? delta.role ?? '?')}” — expected \`${String(delta.expected ?? '?')}\`, actual \`${String(delta.actual ?? '?')}\` (severity ${String(delta.severity ?? '?')})`,
        ),
      MAX_DELTAS,
      'read `values-diff.json`',
    ),
    '',
  )

  // ── ranked pixel regions ───────────────────────────────────────────────────
  const regionReport = input.regions as {
    meanDiff?: unknown
    pctOverThreshold?: unknown
    rankedBy?: unknown
    regions?: unknown
  }
  const regions = Array.isArray(regionReport?.regions) ? (regionReport.regions as Array<Record<string, unknown>>) : []
  out.push(
    `## Pixel regions — ${regions.length} ranked (\`regions.json\`)`,
    '',
    `mean ${String(regionReport?.meanDiff ?? '?')}/255 · ${String(regionReport?.pctOverThreshold ?? '?')}% of pixels over threshold` +
      (regionReport?.rankedBy ? ` · ranked by \`${String(regionReport.rankedBy)}\`, highest first` : ''),
    '',
    bullets(
      regions.map((region) => {
        const box = (region.bbox ?? {}) as Record<string, unknown>
        const geometry = `#${String(region.id)} (${String(box.x)}, ${String(box.y)}) ${String(box.w)}×${String(box.h)} · score ${String(region.score)} · mean ${String(region.meanDiff)} · \`region-${String(region.id)}-{ref,ours,diff}.png\``
        // BUG-99 — the leads, on the same line as the geometry they belong to.
        // The point of the digest is to save a read; a region whose sides name
        // different things (or where one names nothing) is the fact worth having
        // without opening the file.
        const nodes = region.nodes as { ref?: unknown; actual?: unknown } | undefined
        if (!nodes) return geometry
        return `${geometry}<br>under it — ref: ${leadPhrase(nodes.ref)} · ours: ${leadPhrase(nodes.actual)}`
      }),
      MAX_REGIONS,
      'read `regions.json`',
    ),
    '',
  )

  // ── asset attribution ──────────────────────────────────────────────────────
  const coverage = (input.gate as { coverage?: Record<string, unknown> })?.coverage
  const unreferenced = Array.isArray(coverage?.unreferencedImages) ? (coverage.unreferencedImages as string[]) : []
  const assets = imageAssets(input.capture)
  out.push(
    `## Mirrored images, and where the reference names them (\`capture.json\`, \`multistate.json\`)`,
    '',
    `the gate calls ${unreferenced.length} of ${assets.length} unreferenced${unreferenced.length ? `: ${unreferenced.join(', ')}` : ''}`,
    '',
  )
  if (!assets.length) {
    out.push('_this reference mirrored no images._', '')
  } else {
    for (const asset of assets) {
      const name = path.basename(asset.localPath ?? asset.src ?? '')
      const inCapture = stringOccurrences(input.capture, name)
      const inManifest = stringOccurrences(input.manifest, name)
      const inPage = stringOccurrences(input.page, name)
      out.push(
        `### \`${asset.localPath ?? name}\``,
        '',
        `- \`capture.json\` names it at: ${describePaths(inCapture)}`,
        `- \`multistate.json\` names it at: ${describePaths(inManifest)}`,
        `- the reproduction's own L1 names it at: ${describePaths(inPage)}`,
        '',
      )
    }
  }

  // ── key censuses ───────────────────────────────────────────────────────────
  out.push(
    '## Key census — the reference manifest (`multistate.json`)',
    '',
    'Every field name in the document and how often it occurs. **A name that is not here occurs zero times.**',
    '',
    bullets(
      keyCensus(input.manifest).map(([key, count]) => `\`${key}\` × ${count}`),
      MAX_KEYS,
      'the tail is all rarer than these',
    ),
    '',
    '## Key census — the capture (`capture.json`)',
    '',
    bullets(
      keyCensus(input.capture).map(([key, count]) => `\`${key}\` × ${count}`),
      MAX_KEYS,
      'the tail is all rarer than these',
    ),
    '',
  )

  // ── what the reproduction is made of ───────────────────────────────────────
  const kinds = valueCensus(input.page, 'kind')
  out.push(
    "## The reproduction's own L1 (`page.json`)",
    '',
    kinds.length
      ? `element kinds: ${kinds.map(([kind, count]) => `\`${kind}\` × ${count}`).join(' · ')}`
      : '_no `kind` fields — check the document really is the L1 page._',
    '',
  )

  return out.join('\n')
}

/** An occurrence list, or the fact that there is none — which is the finding. */
function describePaths(paths: Array<[string, number]>): string {
  if (!paths.length) return '**nowhere**'
  const shown = paths.slice(0, MAX_PATHS_PER_ASSET).map(([at, count]) => `\`${at}\`${count > 1 ? ` ×${count}` : ''}`)
  if (paths.length > MAX_PATHS_PER_ASSET) shown.push(`…+${paths.length - MAX_PATHS_PER_ASSET} more`)
  return shown.join(', ')
}

/** A JSON file, parsed, or `undefined` where it is missing or unreadable. */
function readJson(file: string): unknown {
  if (!existsSync(file)) return undefined
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return undefined
  }
}

export interface WriteDigestOptions {
  n: number
  /** The reference bundle — `capture.json` and `multistate.json` live here. */
  bundleDir: string
  /** What landed in the engine after this bundle was captured — see {@link DigestInput.landedSince}. */
  landedSince?: string[]
  /** Where `1c gate` wrote its report, the value deltas and the regions. */
  evidenceDir: string
  /** This iteration's copy of the reproduction's L1 document. */
  pageDocument: string
}

/**
 * Read what is on disk and produce the digest text.
 *
 * Every input is optional. A digest computed from three of the five files is
 * still worth writing — it says `_none._` where it has nothing, which is honest,
 * where refusing to write it at all would deny the round the parts that did
 * compute.
 */
export function digestFromDisk(opts: WriteDigestOptions): string {
  return buildDigest({
    n: opts.n,
    bundleDir: opts.bundleDir,
    ...(opts.landedSince ? { landedSince: opts.landedSince } : {}),
    gate: readJson(path.join(opts.evidenceDir, 'gate.json')),
    valuesDiff: readJson(path.join(opts.evidenceDir, 'values-diff.json')),
    regions: readJson(path.join(opts.evidenceDir, 'regions.json')),
    capture: readJson(path.join(opts.bundleDir, 'capture.json')),
    manifest: readJson(path.join(opts.bundleDir, 'multistate.json')),
    page: readJson(opts.pageDocument),
  })
}
