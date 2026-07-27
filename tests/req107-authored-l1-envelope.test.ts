/**
 * REQ-107 — an authored L1 document must clear the envelope, not just the shape.
 *
 * `pageSchema`'s `l1: l1DocumentSchema.optional()` is the *shape* check: typed
 * axes, closed enums, `.strict()` objects, hex-only colours. The *envelope* —
 * numeric ranges (`L1_ENVELOPE`), the URL-scheme allowlist, the node-count cap,
 * geometry-track well-formedness, unique node ids — lives in `validateL1`, and
 * before this ticket ran at exactly two call sites, both on the **reproduction**
 * path (`l1/fold.ts`, `l1/probes.ts`). Nothing on the authoring or render path
 * called it.
 *
 * That was backwards. A reproduced document derives its values mechanically from
 * a capture; the *authoring* path is the one with a human or an AI free-typing
 * numbers and URLs into a JSON file — and it was the path with no envelope. The
 * consequence was observed on REQ-95: seven passes of authored xgd.dev documents
 * bypassed the envelope entirely, and when REQ-106 added the duplicate-id rule an
 * authored page with two `id="signup"` nodes rendered without complaint. The rule
 * existed and simply never fired.
 *
 * These UATs drive real entry points — `validateSite` (the one validator all four
 * DOC-7 §6.5 layers consume) and `1c render` over a real on-disk workspace:
 *
 *   - AC-1  an out-of-envelope `page.l1` fails validation, with every envelope
 *           path prefixed into the page (`/pages/0/l1/root/...`), not detached.
 *   - AC-2  each of the four classes with no second line of defence — an
 *           out-of-range numeric axis, an unsafe `image.src`, an over-cap node
 *           count, a duplicate node id — is rejected at authoring time.
 *   - AC-3  the renderer keeps its own independent `isSafeUrl` degradation; this
 *           ticket ADDS a line of defence, it does not replace one.
 *   - AC-4  every `storage/sites/**` document passes the envelope — the control
 *           that was missing when REQ-95's documents drifted out of it unnoticed.
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import type { L1Document, L1Node, ValidationError } from '@1stcontact/site-schema'
import { L1_ENVELOPE, validateL1, validateSite } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/l1/render'
import { cmdNew, cmdRender } from '../tools/generate/src/cli'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'

const tmpDirs: string[] = []
function freshCwd(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'req107-'))
  tmpDirs.push(cwd)
  return cwd
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

const WIDTHS = [320, 1280]

/**
 * A site definition whose single page carries `root` as its L1 body. The base is
 * the real `1c new` scaffold, so the fixture is an authored site rather than a
 * hand-restated theme that could drift from the schema.
 */
function siteWith(root: L1Node): Record<string, unknown> {
  return {
    ...starterSiteJson('req107'),
    pages: [
      {
        id: 'home',
        slug: '',
        title: 'Home',
        modules: [],
        l1: { widths: WIDTHS, root } satisfies L1Document,
      },
    ],
  }
}

/** A container root wrapping `children` — the shape every authored page has. */
function rootOf(children: L1Node[]): L1Node {
  return { kind: 'container', layout: 'stack', children }
}

function errorsOf(root: L1Node): ValidationError[] {
  const result = validateSite(siteWith(root))
  return result.ok ? [] : result.errors
}

describe('REQ-107 — the authoring path clears the L1 envelope', () => {
  it('test_UAT_FC_REQ-107_out_of_envelope_page_fails_with_page_prefixed_paths', () => {
    // A font size an order of magnitude past the legible ceiling: shape-legal
    // (a finite number on a typed axis) but far outside `L1_ENVELOPE.fontSizePx`.
    const overrun = L1_ENVELOPE.fontSizePx.max + 1
    const root = rootOf([
      { kind: 'text', text: 'Headline', axes: { fontSizePx: overrun } },
    ])

    // The shape check alone accepts it — that is precisely the gap.
    expect(validateSite({ ...siteWith(root), pages: [] }).ok).toBe(true)

    // AC-1: with the envelope wired in, the same document is rejected…
    const result = validateSite(siteWith(root))
    expect(result.ok).toBe(false)
    const errors = result.ok ? [] : result.errors

    // …and every error is anchored INSIDE the page that carries it, so an author
    // (or an AI self-correcting per DOC-8 §6) is pointed at the actual location
    // rather than at a detached `/root/...` with no page context.
    expect(errors.length).toBeGreaterThan(0)
    for (const e of errors) expect(e.path.startsWith('/pages/0/l1/')).toBe(true)
    expect(errors.map((e) => e.path)).toContain('/pages/0/l1/root/children/0/axes/fontSizePx')
    expect(errors[0].message).toContain(String(overrun))

    // A page whose l1 IS in envelope still validates — the gate is not a blanket
    // rejection of authored L1.
    const fine = rootOf([{ kind: 'text', text: 'Headline', axes: { fontSizePx: 48 } }])
    expect(validateSite(siteWith(fine)).ok).toBe(true)
  })

  it('test_UAT_FC_REQ-107_range_url_nodecount_and_duplicate_id_rejected_when_authored', () => {
    // AC-2 — the four classes the ticket names. The first three have no second
    // line of defence at all; the fourth (an unsafe URL) has the renderer's, and
    // is checked here for the author-facing error the renderer cannot produce.

    // (a) out-of-range numeric axis — a weight past the CSS range.
    const weight = errorsOf(
      rootOf([{ kind: 'text', text: 'x', axes: { fontWeight: L1_ENVELOPE.fontWeight.max + 1 } }]),
    )
    expect(weight.map((e) => e.path)).toContain('/pages/0/l1/root/children/0/axes/fontWeight')

    // (b) unsafe `image.src` — a `javascript:` URL off the scheme allowlist.
    const unsafe = errorsOf(
      rootOf([{ kind: 'image', src: 'javascript:alert(1)', alt: 'x' }]),
    )
    expect(unsafe.map((e) => e.path)).toContain('/pages/0/l1/root/children/0/src')
    expect(unsafe[0].message).toContain('not an allowed URL')

    // (c) over-cap node count — a flat tree past `L1_ENVELOPE.maxNodes`. The cap
    // is what stops a malformed authored document hanging a browser.
    const many: L1Node[] = Array.from({ length: L1_ENVELOPE.maxNodes + 1 }, (_, i) => ({
      kind: 'text' as const,
      text: `run-${i}`,
    }))
    const oversize = errorsOf(rootOf(many))
    expect(oversize.some((e) => e.message.includes('exceeds cap'))).toBe(true)
    expect(oversize.some((e) => e.path === '/pages/0/l1/root')).toBe(true)

    // (d) duplicate node id — REQ-106's rule, the one that existed and never
    // fired on an authored page. Two `id="signup"` nodes break `#anchor`
    // navigation and the `for`↔`id` association the REQ-96 control contract needs.
    const dupe = errorsOf(
      rootOf([
        { kind: 'text', id: 'signup', text: 'Sign up' },
        { kind: 'text', id: 'signup', text: 'Sign up again' },
      ]),
    )
    const dupeError = dupe.find((e) => e.message.includes("duplicate node id 'signup'"))
    expect(dupeError, JSON.stringify(dupe)).toBeDefined()
    expect(dupeError!.path).toBe('/pages/0/l1/root/children/1/id')
  })

  it('test_UAT_FC_REQ-107_render_entry_point_refuses_an_out_of_envelope_authored_page', async () => {
    // AC-1 through the real CLI: an out-of-envelope draft on disk must not render.
    // `1c render` is the command an author actually runs, and it is the command
    // that silently accepted seven passes of un-enveloped xgd.dev documents.
    const cwd = freshCwd()
    const { draftDir } = cmdNew('authored', { cwd })
    const homePath = path.join(draftDir, 'pages', 'home.json')
    const page = JSON.parse(readFileSync(homePath, 'utf8')) as { l1: L1Document }

    // The scaffolded skeleton renders as-is — establishes the baseline.
    await expect(cmdRender('authored', { cwd })).resolves.toBeTruthy()

    // Now push one axis out of envelope and re-render.
    const bad = structuredClone(page)
    bad.l1.root = rootOf([
      { kind: 'text', text: 'Too big', axes: { fontSizePx: L1_ENVELOPE.fontSizePx.max + 500 } },
    ])
    writeFileSync(homePath, JSON.stringify(bad, null, 2))

    await expect(cmdRender('authored', { cwd })).rejects.toThrow(
      /\/pages\/0\/l1\/root\/children\/0\/axes\/fontSizePx/,
    )
  })

  it('test_UAT_FC_REQ-107_renderer_keeps_its_independent_unsafe_url_degradation', () => {
    // AC-3 — defence in depth is the argument for KEEPING the renderer check, not
    // for skipping the validator. So the renderer must still neutralise an unsafe
    // URL on its own, with no validator in the call path: if the envelope were
    // ever bypassed (a direct `renderL1Document` caller, a future code path), the
    // emitted HTML must still carry no `javascript:` sink.
    const doc: L1Document = {
      widths: WIDTHS,
      root: rootOf([
        { kind: 'image', src: 'javascript:alert(1)', alt: 'unsafe' },
        { kind: 'text', text: 'Click', link: { href: 'javascript:alert(2)' } },
      ]),
    }
    // The validator rejects it (the new line of defence)…
    expect(validateL1(doc).ok).toBe(false)

    // …and the renderer, handed it anyway, degrades rather than emitting it.
    const html = renderL1Document(doc).html
    expect(html).not.toContain('javascript:')
    expect(html).toContain('src=""')
    // An unsafe href degrades to the plain element — no anchor is emitted for it.
    expect(html).not.toContain('href=')
  })

  it('test_UAT_FC_REQ-107_every_stored_site_document_is_in_envelope', () => {
    // AC-4 — the standing control. Turning an unenforced check on is only
    // meaningful if the committed corpus is held to it: this is the test that
    // would have caught REQ-95's drift at the pass it happened, instead of by
    // reading emitted HTML seven passes later.
    const root = path.join(process.cwd(), 'storage', 'sites')
    const checked: string[] = []

    for (const slug of readdirSync(root)) {
      const sources = [path.join(root, slug, 'draft')]
      const revisions = path.join(root, slug, 'revisions')
      if (existsSync(revisions)) {
        for (const id of readdirSync(revisions)) sources.push(path.join(revisions, id))
      }
      for (const source of sources) {
        const pagesDir = path.join(source, 'pages')
        if (!existsSync(pagesDir)) continue
        for (const file of readdirSync(pagesDir).filter((f) => f.endsWith('.json'))) {
          const rel = path.relative(root, path.join(pagesDir, file))
          const page = JSON.parse(readFileSync(path.join(pagesDir, file), 'utf8')) as {
            l1?: unknown
          }
          if (page.l1 === undefined) continue
          const result = validateL1(page.l1)
          const detail = result.ok
            ? ''
            : result.errors.map((e) => `${e.path}: ${e.message}`).join('\n')
          expect(result.ok, `${rel} is out of L1 envelope:\n${detail}`).toBe(true)
          checked.push(rel)
        }
      }
    }

    // The assertion above is vacuous if nothing was scanned — pin that the corpus
    // actually contains authored L1 documents, so a path change cannot turn this
    // control into a no-op that passes forever.
    expect(checked.length).toBeGreaterThan(0)
  })
})
