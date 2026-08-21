/**
 * Reconciliation UATs — story-d0a8cfad "L1 layout substrate rendered safe by
 * construction", the criteria added by the REQ-107 upgrade that wired the
 * envelope validator to the **authoring** path.
 *
 *   AC-849  an authored page's L1 body is held to the safety envelope wherever a
 *           site definition is validated — not only where a capture is folded
 *   AC-850  an out-of-range axis, an unsafe image source, an over-cap tree and a
 *           duplicate node id are each rejected at authoring time
 *   AC-851  authoring-time validation and the emitter's own neutralisation are
 *           independent lines of defence, neither standing in for the other
 *
 * The story's other criteria are pinned elsewhere and are not re-asserted here:
 * AC-682/683/684/685/686/687/688/723 in `reconciliation-l1-substrate.test.ts`,
 * AC-725/726/727/728 in `reconciliation-l1-language.test.ts`,
 * AC-801/802/803/804/805 in `reconciliation-l1-shared-axis-groups.test.ts`, and
 * AC-806/807/829/830/831/832 in `reconciliation-l1-control-and-texture.test.ts`.
 *
 * Every probe here is engine-free. The boundaries driven are the two real entry
 * points an author actually meets: `validateSite` — the one validator every
 * consuming operation goes through (`tools/generate/src/store/loadSite.ts`) —
 * and the `1c` CLI commands (`cmdNew` / `cmdRender` / `cmdPublish`) over a real
 * on-disk workspace in a temporary directory.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  L1_ENVELOPE,
  validateL1,
  validateSite,
  type L1Document,
  type L1Node,
  type ValidationError,
} from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/index'
import { cmdNew, cmdPublish, cmdRender, cmdRevisions } from '../tools/generate/src/cli'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'

const WIDTHS = [320, 1280]

const tmpDirs: string[] = []
function freshCwd(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'recon-l1-authoring-'))
  tmpDirs.push(cwd)
  return cwd
}
afterAll(() => {
  for (const dir of tmpDirs) rmSync(dir, { recursive: true, force: true })
})

/** A container root wrapping `children` — the shape every authored page has. */
function rootOf(children: L1Node[]): L1Node {
  return { kind: 'container', layout: 'stack', children }
}

/** One page carrying `root` as its L1 body. */
function pageWith(root: L1Node, id = 'home'): Record<string, unknown> {
  return {
    id,
    slug: id === 'home' ? '' : id,
    title: id,
    modules: [],
    l1: { widths: WIDTHS, root } satisfies L1Document,
  }
}

/** One page carrying **no** L1 body at all — the untouched-by-the-gate case. */
function pageWithoutL1(id: string): Record<string, unknown> {
  return { id, slug: id, title: id, modules: [] }
}

/**
 * A site definition around `pages`. The base is the real `1c new` scaffold, so
 * the fixture is an authored site rather than a hand-restated theme that could
 * drift from the schema.
 */
function siteOf(pages: Record<string, unknown>[]): Record<string, unknown> {
  return { ...starterSiteJson('authoring'), pages }
}

/** The errors `validateSite` reports for a single-page definition around `root`. */
function errorsOf(root: L1Node): ValidationError[] {
  const result = validateSite(siteOf([pageWith(root)]))
  return result.ok ? [] : result.errors
}

describe('story-d0a8cfad — the authoring path is held to the L1 safety envelope', () => {
  it('test_UAT_AC849_authored_page_body_clears_the_envelope_on_every_consuming_path', async () => {
    // ── The gate is one validation, not two half-gates ────────────────────────
    // A font size an order of magnitude past the legible ceiling is *shape*-legal
    // (a finite number on a typed axis) and only the envelope catches it. This is
    // the class REQ-107 names: the authoring path is the one with a human or an
    // AI free-typing numbers into a JSON file, and it was the path with no bounds.
    const overrun = L1_ENVELOPE.fontSizePx.max + 1
    const outOfEnvelope = rootOf([{ kind: 'text', text: 'Headline', axes: { fontSizePx: overrun } }])

    const rejected = validateSite(siteOf([pageWith(outOfEnvelope)]))
    expect(rejected.ok).toBe(false)
    const errors = rejected.ok ? [] : rejected.errors
    // Reported against the page that carries it, not as a detached document path.
    expect(errors.map((e) => e.path)).toContain('/pages/0/l1/root/children/0/axes/fontSizePx')
    expect(errors[0].message).toContain(String(overrun))

    // The same definition with the value returned to range is accepted — the gate
    // is a boundary check, not a blanket refusal of authored L1.
    const inEnvelope = rootOf([{ kind: 'text', text: 'Headline', axes: { fontSizePx: 48 } }])
    expect(validateSite(siteOf([pageWith(inEnvelope)])).ok).toBe(true)

    // The *shape* half of the same single gate still applies: an unknown key on a
    // `.strict()` axis bag is refused by the schema in the very same call.
    const freeform = validateSite(
      siteOf([pageWith(rootOf([{ kind: 'text', text: 'x', axes: { style: 'color:red' } } as unknown as L1Node]))]),
    )
    expect(freeform.ok).toBe(false)

    // ── A page carrying no L1 body is unaffected ──────────────────────────────
    expect(validateSite(siteOf([pageWithoutL1('about')])).ok).toBe(true)
    // …and in a multi-page definition the violation names *which* page is at fault
    // rather than being smeared across the pages that are fine.
    const multi = validateSite(siteOf([pageWithoutL1('about'), pageWith(outOfEnvelope, 'home')]))
    expect(multi.ok).toBe(false)
    const multiPaths = multi.ok ? [] : multi.errors.map((e) => e.path)
    expect(multiPaths).toContain('/pages/1/l1/root/children/0/axes/fontSizePx')
    expect(multiPaths.every((p) => p.startsWith('/pages/1/l1/'))).toBe(true)

    // ── The real render entry point over a real on-disk site ──────────────────
    // `1c render` is the command an author actually runs, and the command that
    // accepted seven passes of un-enveloped authored documents before REQ-107.
    const cwd = freshCwd()
    const { draftDir } = cmdNew('authored', { cwd })
    const homePath = path.join(draftDir, 'pages', 'home.json')
    const page = JSON.parse(readFileSync(homePath, 'utf8')) as { l1: L1Document }

    // Baseline: the scaffolded, in-envelope draft renders.
    await expect(cmdRender('authored', { cwd })).resolves.toBeTruthy()

    // Push one axis out of envelope on disk and re-render: the command refuses,
    // naming the offending node's path inside the page.
    const bad = structuredClone(page)
    bad.l1.root = outOfEnvelope
    writeFileSync(homePath, JSON.stringify(bad, null, 2))
    await expect(cmdRender('authored', { cwd })).rejects.toThrow(
      /\/pages\/0\/l1\/root\/children\/0\/axes\/fontSizePx/,
    )

    // Publishing the same draft refuses identically and writes nothing — the
    // guarantee holds for every consuming operation, not just for rendering.
    await expect(cmdPublish('authored', { cwd })).rejects.toThrow(
      /\/pages\/0\/l1\/root\/children\/0\/axes\/fontSizePx/,
    )
    expect(await cmdRevisions('authored', { cwd })).toEqual([])

    // Returned to envelope, the same on-disk site renders and publishes again.
    const good = structuredClone(page)
    good.l1.root = inEnvelope
    writeFileSync(homePath, JSON.stringify(good, null, 2))
    await expect(cmdRender('authored', { cwd })).resolves.toBeTruthy()
    await expect(cmdPublish('authored', { cwd })).resolves.toBeTruthy()
    expect(await cmdRevisions('authored', { cwd })).toHaveLength(1)
  })

  it('test_UAT_AC850_range_url_over_cap_and_duplicate_id_each_rejected_when_authored', () => {
    // The four classes a hand-authored page can carry. Three of them have *no*
    // second line of defence at all — the emitter renders them without complaint
    // — so authoring-time validation is where they are caught or nowhere.

    // (a) an out-of-range numeric axis — a weight past the CSS font-weight range.
    const weight = errorsOf(
      rootOf([{ kind: 'text', text: 'x', axes: { fontWeight: L1_ENVELOPE.fontWeight.max + 1 } }]),
    )
    expect(weight.map((e) => e.path)).toContain('/pages/0/l1/root/children/0/axes/fontWeight')
    expect(weight.some((e) => e.message.includes('out of range'))).toBe(true)
    expect(
      validateSite(siteOf([pageWith(rootOf([{ kind: 'text', text: 'x', axes: { fontWeight: 700 } }]))])).ok,
    ).toBe(true)

    // (b) an unsafe image source — a scheme outside the allowlist.
    const unsafe = errorsOf(rootOf([{ kind: 'image', src: 'javascript:alert(1)', alt: 'x' }]))
    const srcError = unsafe.find((e) => e.path === '/pages/0/l1/root/children/0/src')
    expect(srcError, JSON.stringify(unsafe)).toBeDefined()
    expect(srcError!.message).toContain('not an allowed URL')
    expect(
      validateSite(siteOf([pageWith(rootOf([{ kind: 'image', src: '/assets/logo.png', alt: 'x' }]))])).ok,
    ).toBe(true)

    // (c) an over-cap tree — the cap is what stops a malformed authored document
    // hanging a browser, so it is a robustness bound rather than a matter of taste.
    const overCap: L1Node[] = Array.from({ length: L1_ENVELOPE.maxNodes + 1 }, (_, i) => ({
      kind: 'text' as const,
      text: `run-${i}`,
    }))
    const oversize = errorsOf(rootOf(overCap))
    const capError = oversize.find((e) => e.path === '/pages/0/l1/root')
    expect(capError, JSON.stringify(oversize.slice(0, 3))).toBeDefined()
    expect(capError!.message).toContain(`exceeds cap ${L1_ENVELOPE.maxNodes}`)
    // Root + (maxNodes - 1) children = exactly the cap, which is admitted.
    const atCap: L1Node[] = Array.from({ length: L1_ENVELOPE.maxNodes - 1 }, (_, i) => ({
      kind: 'text' as const,
      text: `run-${i}`,
    }))
    expect(validateSite(siteOf([pageWith(rootOf(atCap))])).ok).toBe(true)

    // (d) a duplicate node id — two nodes claiming the same DOM id break same-page
    // anchor navigation (the browser takes the first) and the label↔control
    // association a mounted behavior module depends on. Reported at the *second*
    // node's id path, naming the repeated value.
    const dupe = errorsOf(
      rootOf([
        { kind: 'text', id: 'signup', text: 'Sign up' },
        { kind: 'text', id: 'signup', text: 'Sign up again' },
      ]),
    )
    const dupeError = dupe.find((e) => e.message.includes("duplicate node id 'signup'"))
    expect(dupeError, JSON.stringify(dupe)).toBeDefined()
    expect(dupeError!.path).toBe('/pages/0/l1/root/children/1/id')
    expect(
      validateSite(
        siteOf([
          pageWith(
            rootOf([
              { kind: 'text', id: 'signup', text: 'Sign up' },
              { kind: 'text', id: 'signup-again', text: 'Sign up again' },
            ]),
          ),
        ]),
      ).ok,
    ).toBe(true)
  })

  it('test_UAT_AC851_emitter_neutralisation_and_authoring_validation_catch_different_classes', () => {
    // ── The emitter still neutralises on its own ──────────────────────────────
    // Handed a document that never passed site-definition validation, the sole
    // emitter must still publish nothing unsafe. Defence in depth is the argument
    // for KEEPING this check, not for skipping the earlier gate.
    const unsafeDoc: L1Document = {
      widths: WIDTHS,
      root: rootOf([
        { kind: 'image', src: 'javascript:alert(1)', alt: 'unsafe' },
        { kind: 'text', text: 'Click', link: { href: 'javascript:alert(2)' } },
      ]),
    }
    const html = renderL1Document(unsafeDoc).html
    expect(html).not.toContain('javascript:')
    // An off-allowlist image source emits an empty source…
    expect(html).toContain('src=""')
    // …and an off-allowlist link target emits no link at all.
    expect(html).not.toContain('href=')

    // The same definition raises the author-facing answer too: BOTH offending
    // fields are named, so one definition produces both lines of defence.
    const unsafeErrors = errorsOf(unsafeDoc.root)
    const unsafePaths = unsafeErrors.map((e) => e.path)
    expect(unsafePaths).toContain('/pages/0/l1/root/children/0/src')
    expect(unsafePaths).toContain('/pages/0/l1/root/children/1/link/href')

    // ── The earlier gate covers what the emitter cannot ───────────────────────
    // Each of these renders *without objection* — no emitter can neutralise them,
    // and the defect would surface only in the published output. Validation is the
    // only place they are caught.
    const undetectableByEmitter: { label: string; root: L1Node }[] = [
      {
        label: 'out-of-range axis',
        root: rootOf([
          { kind: 'text', text: 'Headline', axes: { fontSizePx: L1_ENVELOPE.fontSizePx.max + 1 } },
        ]),
      },
      {
        label: 'over-cap node count',
        root: rootOf(
          Array.from({ length: L1_ENVELOPE.maxNodes + 1 }, (_, i) => ({
            kind: 'text' as const,
            text: `run-${i}`,
          })),
        ),
      },
      {
        label: 'duplicate node id',
        root: rootOf([
          { kind: 'text', id: 'signup', text: 'Sign up' },
          { kind: 'text', id: 'signup', text: 'Sign up again' },
        ]),
      },
    ]

    for (const { label, root } of undetectableByEmitter) {
      const doc: L1Document = { widths: WIDTHS, root }
      // The emitter renders it and reports nothing wrong…
      const emitted = renderL1Document(doc)
      expect(emitted.html.length, label).toBeGreaterThan(0)
      // …while the same definition is refused at authoring time.
      expect(validateL1(doc).ok, label).toBe(false)
      expect(validateSite(siteOf([pageWith(root)])).ok, label).toBe(false)
    }

    // The duplicate id is the sharpest illustration: the rule existed before
    // REQ-107 and simply never fired on an authored page — the emitted HTML
    // happily carries both ids, which is not a control.
    const dupeHtml = renderL1Document({
      widths: WIDTHS,
      root: undetectableByEmitter[2].root,
    }).html
    expect(dupeHtml.match(/id="signup"/g) ?? []).toHaveLength(2)
  })
})
