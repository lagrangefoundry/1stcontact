import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdPublish, cmdRender } from '../tools/generate/src/cli/commands'
import { run } from '../tools/generate/src/cli'
import type { L1Node } from '../packages/site-schema/src/index'

/**
 * story-af36c2cb — **one emitter, so an adjustment paints here exactly as it
 * will on the page.**
 *
 * The edit channel is a render *mode* threaded through the sole emitter, not a
 * second renderer and not an editing surface painting its own preview. So a
 * picture's framing, shape, colour adjustment and rotation cannot appear one way
 * to the operator adjusting them and another way to the visitor — the two
 * channels are one renderer reading one document.
 *
 * That makes this AC an assertion about the *architecture*, not about
 * arithmetic: it is true by construction today, and the day someone adds a
 * second emitter (the anticipated one being drag-time feedback, where a
 * pointer-move cannot afford a server round-trip) is the day it can stop being
 * true. This test is the tripwire on that day.
 *
 * Deliberately scoped to **paint**. The channel's whole purpose is that it does
 * not *work*, so behaviour differs by design — no behaviour bundle, no motion
 * code, no pointer-driven accent, no untriggered reveal. Those are absences of
 * MOTION, asserted elsewhere in this story (AC-948, AC-949), and they are not
 * licence for a picture's own typed axes to paint differently. Hence the
 * comparison below is of one node's framing / shape / colour-adjustment /
 * transform declarations, never of the two channels' whole output.
 *
 * The adjustment is applied through the ORDINARY EDITING PATH — the same
 * `copy set` entry point the modal and the AI drive — rather than by writing
 * axes into the fixture by hand. A parity claim about what an operator sees is
 * worth nothing if the operator's own write path is not the one that produced it.
 */

/** The picture under test: the only image on the seeded page, at address `0.0`. */
const PICTURE = '0.0'
/** Copy beside it, so both channels are visibly rendering the same page. */
const PAGE_COPY = 'One document, one emitter.'

/** The paint declarations this AC is about: framing, shape, colour, rotation. */
const PAINT = /^(object-fit|object-position|filter|clip-path|transform)\s*:/

const homeJsonPath = (cwd: string, slug: string): string =>
  path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')

/** A page carrying one picture and one run of copy. */
function seedPage(cwd: string, slug: string): void {
  const homePath = homeJsonPath(cwd, slug)
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [
      { kind: 'image', id: 'hero', src: '/assets/hero.jpg', alt: 'The hero' },
      { kind: 'text', text: PAGE_COPY, axes: { fontSizePx: 20 } },
    ],
  }
  home.l1 = { ...(home.l1 as Record<string, unknown>), root }
  home.modules = []
  writeFileSync(homePath, `${JSON.stringify(home, null, 2)}\n`)
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string }
}

/** Drive the real `1c` entry point — argv in, envelope out. */
async function cli(cwd: string, ...argv: string[]): Promise<CliResult> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const out: string[] = []
  process.chdir(cwd)
  process.exitCode = 0
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run([...argv, '--json'])
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
  }
  process.exitCode = 0
  return JSON.parse(out[out.length - 1]) as CliResult
}

/**
 * Every paint declaration the picture receives in one rendered document.
 *
 * The class is read off the `<img>` element in THAT document rather than assumed
 * to be the same in both, so the comparison cannot pass by reading one channel's
 * rule twice. Rules are collected across the whole stylesheet — base rules and
 * any responsive ones alike — in source order, so a declaration appearing at one
 * width in one channel and another width in the other is a difference, not a
 * match.
 */
function paintOf(html: string, alt: string): string[] {
  const img = new RegExp(`<img[^>]*alt="${alt}"[^>]*>`).exec(html)
  if (!img) throw new Error(`no <img alt="${alt}"> in the rendered document`)
  const cls = /class="([^"]*)"/.exec(img[0])?.[1]
  if (!cls) throw new Error(`the picture carries no class to look its paint up by`)
  const out: string[] = []
  for (const one of cls.split(/\s+/).filter(Boolean)) {
    const re = new RegExp(`\\.${one}\\s*\\{([^}]*)\\}`, 'g')
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null) {
      for (const decl of m[1].split(';').map((d) => d.trim()).filter(Boolean)) {
        if (PAINT.test(decl)) out.push(decl)
      }
    }
  }
  return out
}

describe('story-af36c2cb — one emitter: the edit channel paints as the page does', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'edit-paint-parity-'))
    cmdNew('acme', { cwd })
    seedPage(cwd, 'acme')
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  // ── AC-1135 ───────────────────────────────────────────────────────────────
  // A picture's framing, shape, colour adjustment and rotation paint identically
  // in the edit channel and the shipped channels.
  it('test_UAT_AC1135_a_picture_paints_identically_in_the_edit_and_shipped_channels', async () => {
    // Through the ORDINARY editing path: a fill mode, an off-centre pan, a
    // reduced saturation, a rotation and a generated (seeded) shape — the whole
    // set an operator can reach, applied the way an operator applies it.
    const saved = await cli(
      cwd,
      'copy',
      'set',
      'acme',
      'home',
      PICTURE,
      '--values',
      JSON.stringify({
        objectFit: 'cover',
        objectPositionXPct: 30,
        objectPositionYPct: 20,
        saturatePct: 40,
        rotateDeg: 12,
        shape: 'blob',
      }),
    )
    expect(saved.ok, JSON.stringify(saved.error)).toBe(true)

    // One definition, rendered through the edit channel and through BOTH shipped
    // channels — the operator's channel against the reviewer's and the visitor's.
    const editHtml = readFileSync(
      path.join((await cmdRender('acme', { cwd, edit: true })).outDir, 'index.html'),
      'utf8',
    )
    const previewHtml = readFileSync(
      path.join((await cmdRender('acme', { cwd })).outDir, 'index.html'),
      'utf8',
    )
    const publishedHtml = readFileSync(
      path.join(
        (await cmdPublish('acme', { cwd, now: '2026-01-01T00:00:00.000Z' })).outDir,
        'index.html',
      ),
      'utf8',
    )

    // Sanity: all three really are rendering the same page.
    for (const html of [editHtml, previewHtml, publishedHtml]) {
      expect(html).toContain(PAGE_COPY)
    }

    // THE CLAIM: nothing about how the picture's own typed axes paint differs
    // between the channel an operator edits in and the channels a reviewer and a
    // visitor receive.
    const edit = paintOf(editHtml, 'The hero')
    expect(edit, 'edit vs preview').toEqual(paintOf(previewHtml, 'The hero'))
    expect(edit, 'edit vs published').toEqual(paintOf(publishedHtml, 'The hero'))

    // NOT VACUOUSLY EQUAL. Two empty sets compare equal, so the criterion would
    // pass while proving nothing — assert the adjustment is genuinely in the
    // rendered output. The pan and the saturation are the two the criterion
    // names by hand.
    const joined = edit.join(' | ')
    expect(joined).toContain('object-position: 30% 20%')
    expect(joined).toMatch(/filter:[^|]*saturate\(0\.4\)/)

    // ...and the rest of the set the criterion is stated over: the fill mode, the
    // clipped outline the renderer built from the seeded shape, and the rotation.
    expect(joined).toContain('object-fit: cover')
    expect(joined).toMatch(/clip-path: polygon\(/)
    expect(joined).toMatch(/transform:[^|]*rotate\(12deg\)/)

    // ONE colour-adjustment declaration, never one per function — the order its
    // functions compose in is the renderer's, so a second emitter reproducing it
    // as several declarations would paint a different picture.
    expect(edit.filter((d) => d.startsWith('filter:'))).toHaveLength(1)
  })
})
