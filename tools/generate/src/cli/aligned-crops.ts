/**
 * `1c aligned-crops` (REQ-78) — the AI perceptual judge's eyes.
 *
 * Whole-page pixel diff is corrupted by cumulative vertical drift: a few px of
 * accumulated spacing shifts everything below, so a fixed-y-window overlay ends up
 * comparing a heading against a text field (gigabyte perceptual regions #1/#4 were
 * pure drift artefacts). The fix — the manual pass that found the REQ-77 card-gap
 * defect — is to crop the SAME element in the reference and in our render, each
 * aligned to its OWN position, so drift is removed and like is compared with like.
 *
 * This packages that pass: pick section anchors, pair them by text, and emit
 * `<name>-ref.png` / `<name>-ours.png` crop pairs plus an `index.md` (per-area drift
 * + the value-diff deltas in that window) for the AI to view and rule perceptible /
 * not, per the good-enough criteria (structural gate + per-aligned-element perceptual
 * gate). The pure logic (anchor pick, pairing, crop windows) is unit-testable; the
 * browser + sharp IO is the orchestrator.
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import playwright from 'playwright'
import sharp from 'sharp'
import { cmdRender } from './commands'
import { startServe } from './serve'
import type { GlobalOptions } from './commands'

/** `{x,y,width,height}` in document (CSS) pixels at the target viewport. */
export interface Box {
  x: number
  y: number
  width: number
  height: number
}
/** A candidate section anchor from the reference manifest. */
export interface AnchorEl {
  text: string
  role: string
  box: Box
}
/** One drift-aligned crop window: same element, its own top in each render. */
export interface AlignedArea {
  name: string
  anchor: string
  /** Crop top (px) in the reference / our screenshot — each the element's OWN y. */
  refTop: number
  oursTop: number
  /** oursY − refY: how far the element drifted (diagnostic, not a defect). */
  drift: number
  width: number
  height: number
}

/** Roles that mark a section start — the default anchors (a heading per section). */
const ANCHOR_ROLES = new Set(['heading'])

/** Normalise text for pairing: trim, collapse whitespace, mask 4-digit years. */
export function normText(t: string): string {
  return t.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\d{4}/g, '####')
}

/** kebab-case, truncated slug for a crop filename. */
export function areaSlug(text: string): string {
  return text.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 24).toLowerCase()
}

/**
 * Pick the reference anchors: an explicit `areas` list (matched by text prefix) or,
 * by default, every heading-role element. Returned in document order (by y).
 */
export function pickAnchors(refEls: AnchorEl[], areas?: string[]): AnchorEl[] {
  let chosen: AnchorEl[]
  if (areas && areas.length > 0) {
    chosen = areas
      .map((a) => refEls.find((e) => normText(e.text).startsWith(normText(a))))
      .filter((e): e is AnchorEl => !!e)
  } else {
    chosen = refEls.filter((e) => ANCHOR_ROLES.has(e.role))
  }
  return [...chosen].sort((a, b) => a.box.y - b.box.y)
}

/**
 * Pair each anchor to our element of the same text and compute its crop window:
 * full viewport width, from `pad` above the anchor down to just past the NEXT anchor
 * (capped at `maxH`), with each side using its OWN element top so drift is removed.
 * Anchors with no match in our render are dropped (they surface elsewhere as a
 * missing-element structural finding).
 */
export function alignedAreas(
  anchors: AnchorEl[],
  oursBoxByText: Map<string, Box>,
  opts: { viewportWidth: number; pad?: number; maxH?: number },
): AlignedArea[] {
  const pad = opts.pad ?? 40
  const maxH = opts.maxH ?? 460
  const paired = anchors
    .map((a) => ({ anchor: a, ours: oursBoxByText.get(normText(a.text)) }))
    .filter((p): p is { anchor: AnchorEl; ours: Box } => !!p.ours)
  return paired.map((p, i) => {
    const next = paired[i + 1]
    const span = next ? next.anchor.box.y - p.anchor.box.y + pad : maxH
    const height = Math.max(120, Math.min(span, maxH))
    return {
      name: areaSlug(p.anchor.text),
      anchor: p.anchor.text,
      refTop: Math.max(0, Math.round(p.anchor.box.y - pad)),
      oursTop: Math.max(0, Math.round(p.ours.y - pad)),
      drift: Math.round(p.ours.y - p.anchor.box.y),
      width: opts.viewportWidth,
      height: Math.round(height),
    }
  })
}

/** Load the reference manifest's elements (text/role/box) at a viewport width. */
export function refAnchorsAt(bundleDir: string, viewportWidth: number): AnchorEl[] {
  const mani = JSON.parse(readFileSync(path.join(bundleDir, 'multistate.json'), 'utf8'))
  const proj = (mani.projections as Array<{ viewport?: { width?: number }; state?: string; manifest?: { elements?: unknown[] } }>).find(
    (p) => p.viewport?.width === viewportWidth && p.state === 'rest',
  )
  if (!proj?.manifest?.elements) throw new Error(`aligned-crops: ref bundle has no ${viewportWidth}px rest projection`)
  return (proj.manifest.elements as Array<{ text?: string; role?: string; box?: Box }>)
    .filter((e) => e.text && e.box)
    .map((e) => ({ text: e.text as string, role: e.role ?? 'body', box: e.box as Box }))
}

/** The reference screenshot for a viewport: per-width shot if present, else the desktop full shot. */
function refScreenshot(bundleDir: string, viewportWidth: number): string {
  const sized = path.join(bundleDir, `screenshot-${viewportWidth}.png`)
  if (existsSync(sized)) return sized
  const full = path.join(bundleDir, 'screenshot.full.png')
  if (!existsSync(full)) throw new Error(`aligned-crops: ref bundle has no screenshot for ${viewportWidth}px`)
  return full
}

/** Clamp a crop rect to the image so a bottom-edge window never overruns. */
async function cropTo(srcPng: string | Buffer, left: number, top: number, width: number, height: number, out: string): Promise<void> {
  const img = sharp(srcPng)
  const meta = await img.metadata()
  const iw = meta.width ?? width
  const ih = meta.height ?? top + height
  const w = Math.min(width, iw - left)
  const h = Math.min(height, ih - top)
  if (w <= 0 || h <= 0 || top >= ih) return
  await sharp(srcPng).extract({ left, top, width: w, height: h }).toFile(out)
}

export interface AlignedCropsOptions extends GlobalOptions {
  slug: string
  source?: 'draft' | 'published'
  refBundleDir: string
  viewportWidth: number
  areas?: string[]
  outDir: string
}

/**
 * Render our draft, screenshot it full-page, and emit drift-aligned ref/ours crop
 * pairs + an index for each section anchor. Returns the areas written.
 */
export async function cmdAlignedCrops(opts: AlignedCropsOptions): Promise<{ areas: AlignedArea[]; indexPath: string }> {
  const { slug, refBundleDir, viewportWidth, outDir } = opts
  const refEls = refAnchorsAt(refBundleDir, viewportWidth)
  const anchors = pickAnchors(refEls, opts.areas)
  if (anchors.length === 0) throw new Error('aligned-crops: no anchors found (no heading roles / --areas matched)')

  await cmdRender(slug, { source: opts.source ?? 'draft' })
  const serve = await startServe(slug, { source: opts.source ?? 'draft' })
  const browser = await playwright.chromium.launch()
  let oursPng: Buffer
  const oursBoxByText = new Map<string, Box>()
  try {
    const page = await browser.newPage({ viewport: { width: viewportWidth, height: 900 } })
    await page.goto(serve.url, { waitUntil: 'networkidle' })
    await page.evaluate(() => new Promise((r) => setTimeout(r, 300)))
    oursPng = await page.screenshot({ fullPage: true })
    const wanted = anchors.map((a) => a.text)
    const found = await page.evaluate((texts: string[]) => {
      const out: Record<string, { x: number; y: number; width: number; height: number }> = {}
      const norm = (t: string) => t.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\d{4}/g, '####')
      for (const t of texts) {
        const el = [...document.querySelectorAll('body *')].find(
          (e) => norm(e.textContent || '').startsWith(norm(t)) && (e as HTMLElement).offsetHeight > 0,
        )
        if (el) {
          const r = el.getBoundingClientRect()
          out[norm(t)] = { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), width: Math.round(r.width), height: Math.round(r.height) }
        }
      }
      return out
    }, wanted)
    for (const [k, v] of Object.entries(found)) oursBoxByText.set(k, v as Box)
  } finally {
    await browser.close()
    await new Promise<void>((r) => serve.server.close(() => r()))
  }

  const areas = alignedAreas(anchors, oursBoxByText, { viewportWidth })
  mkdirSync(outDir, { recursive: true })
  const refShot = refScreenshot(refBundleDir, viewportWidth)
  for (const a of areas) {
    await cropTo(refShot, 0, a.refTop, a.width, a.height, path.join(outDir, `${a.name}-ref.png`))
    await cropTo(oursPng, 0, a.oursTop, a.width, a.height, path.join(outDir, `${a.name}-ours.png`))
  }

  const lines = [
    `# aligned-crops — ${slug} @ ${viewportWidth}px`,
    '',
    'Drift-aligned ref/ours crop pairs. For each area: view `<name>-ref.png` beside',
    '`<name>-ours.png` and rule perceptible / not (would a user viewing the COPY ALONE',
    'notice or care?). `drift` is the element\'s vertical shift — a diagnostic, not a defect.',
    '',
    ...areas.map(
      (a) => `- **${a.anchor}** — drift ${a.drift >= 0 ? '+' : ''}${a.drift}px · \`${a.name}-ref.png\` ⇄ \`${a.name}-ours.png\``,
    ),
  ]
  const indexPath = path.join(outDir, 'index.md')
  writeFileSync(indexPath, lines.join('\n'))
  return { areas, indexPath }
}
