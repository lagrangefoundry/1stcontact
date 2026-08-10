// @vitest-environment jsdom
/**
 * story-e674c60a — **the toolbar as derived state, and a control's lifetime**.
 *
 * BUG-33's reconciliation: the strip re-derives on *both* halves of what the
 * pane is displaying (mode **and** site), and a control the strip replaces is
 * released with it. Both properties are load-bearing in `toolbar.js` and
 * neither had a criterion; the gap surfaced as four red assertions in the
 * builder suites rather than as a documented divergence.
 *
 * - **AC-1110** (new) — a replaced control stops reacting, so a workspace held
 *   open accumulates no updaters writing to detached elements.
 * - **AC-970** (widened) — the trigger is a mode change *or* a site change, and
 *   every control is rebuilt against the state current at that moment. The
 *   mode half and the unknown-action report are already covered by
 *   `reconciliation-builder-workspace-chrome`; this file carries the site half
 *   the criterion gained, and asserts it against the same real composition.
 *
 * Mounted against the ACTUALLY-INSTALLED shared `webui-*` components, never
 * stand-ins — same gate and same reasoning as the sibling chrome suites.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const SITES = [
  { slug: 'alpha', latest: null },
  { slug: 'beta', latest: 1 },
]

/** The controls `app.js` declares for both of its document-oriented modes. */
const DECLARED = ['site-selector', 'mode-toggle', 'open-new-tab', 'publish']

/**
 * `app.js` imports the webui components by bare specifier, so it is loaded
 * dynamically: on a machine without them a static import would fail the whole
 * file at transform time rather than reporting a skip.
 */
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`story-e674c60a toolbar suites skipped: ${WEBUI_SKIP_REASON}`)

/** A `Storage`-shaped map, so a second mount can restore what the first wrote. */
function memoryStorage() {
  const map = new Map<string, string>()
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  }
}

/**
 * Count live subscriptions **at the panel**.
 *
 * AC-1110 is explicit that the count must be taken here rather than inferred
 * from what is on screen: an accumulating updater writes to a detached element
 * and leaves a correct-looking strip, which is exactly how it escaped notice.
 *
 * The real panel is instrumented in place — nothing is mocked or substituted.
 * Wrapping after mount is deliberate: the toolbar's own two subscriptions are
 * taken once at construction and never repeated, so what this measures is
 * precisely the quantity the criterion is about — whether a *re-derivation*
 * leaves anything behind.
 */
type PanelListener = (value: unknown) => void

function countSubscriptions(panel: { on: (e: string, cb: PanelListener) => () => void }) {
  const real = panel.on
  const counter = { live: 0 }
  panel.on = (event: string, cb: PanelListener) => {
    const off = real(event, cb)
    counter.live += 1
    let released = false
    return () => {
      if (!released) {
        released = true
        counter.live -= 1
      }
      off()
    }
  }
  return counter
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
  }
  // jsdom ships neither; the split primitive observes its container.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
  globalThis.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as never
})

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

describe.skipIf(!WEBUI_INSTALLED)('story-e674c60a toolbar re-derivation and control lifetime', () => {
  it('test_UAT_AC1110_a_replaced_control_stops_reacting_and_nothing_accumulates', () => {
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage() })

    // The probe is the control that keeps itself current: its target follows
    // the displayed document, so "did it react?" is directly observable.
    const captured = app.toolbar.get('open-new-tab') as HTMLAnchorElement
    expect(captured).toBeTruthy()

    // ── the replaced control is frozen at the moment it was replaced ────────
    // One change, so the strip is re-derived and `captured` is replaced.
    app.panel.setMode('edit')
    const frozen = captured.getAttribute('href')
    expect(app.toolbar.get('open-new-tab')).not.toBe(captured)

    // A second change: the replaced control must not follow it.
    app.panel.setSite('beta')
    const live = app.toolbar.get('open-new-tab') as HTMLAnchorElement

    expect(captured.getAttribute('href')).toBe(frozen)
    expect(live.getAttribute('href')).toBe(app.panel.getSrc())
    // Not vacuous: the displayed document genuinely moved between the two.
    expect(app.panel.getSrc()).not.toBe(frozen)

    // ── re-deriving N times leaves exactly one live updater, not N ──────────
    const subs = countSubscriptions(app.panel)

    app.panel.setMode('view')
    const afterOne = subs.live
    // Non-vacuity: there IS a subscription being counted, so a toolbar that
    // subscribed to nothing at all could not pass this by staying at zero.
    expect(afterOne).toBeGreaterThan(0)

    const detached: HTMLAnchorElement[] = []
    for (let i = 0; i < 20; i += 1) {
      detached.push(app.toolbar.get('open-new-tab') as HTMLAnchorElement)
      app.panel.setMode(i % 2 === 0 ? 'edit' : 'view')
    }

    // Twenty further re-derivations, and the count at the panel has not grown:
    // each strip released what the previous one held.
    expect(subs.live).toBe(afterOne)
    expect(detached).toHaveLength(20)

    // And every one of those replaced controls is inert — a change after the
    // fact moves the control on screen and none of the survivors.
    const frozenHrefs = detached.map((el) => el.getAttribute('href'))
    app.panel.setSite('alpha')
    expect(detached.map((el) => el.getAttribute('href'))).toEqual(frozenHrefs)
    expect((app.toolbar.get('open-new-tab') as HTMLAnchorElement).getAttribute('href')).toBe(
      app.panel.getSrc(),
    )

    // ── tearing the chrome down releases the strip the same way ─────────────
    const lastLive = app.toolbar.get('open-new-tab') as HTMLAnchorElement
    const hrefAtTeardown = lastLive.getAttribute('href')
    app.toolbar.destroy()

    // Nothing the strip held is still registered on the panel.
    expect(subs.live).toBe(0)
    expect(app.toolbar.ids()).toEqual([])

    // The panel still works — so this is the strip having been released, not
    // the panel having stopped emitting.
    app.panel.setSite('beta')
    expect(app.panel.getSrc()).not.toBe(hrefAtTeardown)
    expect(lastLive.getAttribute('href')).toBe(hrefAtTeardown)
    // The destroyed strip did not re-derive either.
    expect(app.toolbar.ids()).toEqual([])

    // Mounting the chrome again does not leave the previous strip reacting
    // alongside it: only the new one follows what is displayed.
    const secondRoot = document.createElement('div')
    document.body.append(secondRoot)
    const remounted = mountBuilder(secondRoot, { sites: SITES, storage: memoryStorage() })

    remounted.panel.setMode('edit')
    const remountedLink = remounted.toolbar.get('open-new-tab') as HTMLAnchorElement
    expect(remountedLink.getAttribute('href')).toBe(remounted.panel.getSrc())
    expect(lastLive.getAttribute('href')).toBe(hrefAtTeardown)
  })

  it('test_UAT_AC970_a_site_change_re_derives_the_whole_strip_against_the_current_site', () => {
    const storage = memoryStorage()
    const app = mountBuilder(root, { sites: SITES, storage })
    const stripEl = app.toolbar.element

    // Exactly the controls the active mode declares — no more and no fewer.
    expect(app.toolbar.ids()).toEqual(DECLARED)

    // ── a SITE change re-derives the strip, not only a mode change ──────────
    const before = DECLARED.map((id) => app.toolbar.get(id))
    app.panel.setSite('beta')

    expect(app.toolbar.ids()).toEqual(DECLARED)
    // Fresh instances, compared by element identity — a strip that merely
    // looks the same cannot pass.
    const after = DECLARED.map((id) => app.toolbar.get(id))
    after.forEach((el, i) => expect(el).not.toBe(before[i]))
    // The strip itself persists through the re-derivation, keeping its place
    // in the layout; only its contents are replaced.
    expect(app.toolbar.element).toBe(stripEl)
    expect(stripEl.isConnected).toBe(true)

    // A control whose content depends on the site follows the site on screen —
    // here, a change made PROGRAMMATICALLY, with the selector never touched.
    expect((app.toolbar.get('site-selector') as HTMLSelectElement).value).toBe('beta')
    expect(app.panel.getSite()).toBe('beta')

    // ── the same, when the selector itself is what changed the site ─────────
    const selector = app.toolbar.get('site-selector') as HTMLSelectElement
    selector.value = 'alpha'
    selector.dispatchEvent(new Event('change'))

    expect(app.panel.getSite()).toBe('alpha')
    expect(app.toolbar.get('site-selector')).not.toBe(selector)
    expect((app.toolbar.get('site-selector') as HTMLSelectElement).value).toBe('alpha')

    // ── and when the workspace RESTORES a remembered site ───────────────────
    // The first mount persisted its site; a fresh mount over the same storage
    // restores it, and the strip must show the restored site rather than the
    // store's first entry.
    app.panel.setSite('beta')
    const secondRoot = document.createElement('div')
    document.body.append(secondRoot)
    const restored = mountBuilder(secondRoot, { sites: SITES, storage })

    expect(restored.panel.getSite()).toBe('beta')
    expect((restored.toolbar.get('site-selector') as HTMLSelectElement).value).toBe('beta')

    // ── asking for what is already displayed re-derives nothing ─────────────
    const settled = DECLARED.map((id) => restored.toolbar.get(id))
    restored.panel.setSite(restored.panel.getSite())
    restored.panel.setMode(restored.panel.getMode())
    expect(DECLARED.map((id) => restored.toolbar.get(id))).toEqual(settled)
  })
})
