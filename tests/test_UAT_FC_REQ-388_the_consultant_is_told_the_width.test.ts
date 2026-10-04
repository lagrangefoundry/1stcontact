import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import {
  openSession,
  resetAiHost,
  setModelClient,
  streamPrompt,
  type HostDeps,
} from '../tools/generate/src/cli/ai/host-core'
import { primingConfig, readClientView } from '../tools/generate/src/cli/ai/roles'
import type { FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { encodePng } from '../tools/generate/src/cli/png'
import type { BrowserDriver, CapturedResponse, Viewport } from '../tools/generate/src/cli/capture/types'
import { makeFsSite } from './support/site-factory'
import type { SiteFixture } from './support/site-factory'
import { calls, says, scriptedClient, turnTailText } from './support/scripted-model-client'

/**
 * [[REQ-388]] — **the consultant is told which width the client is viewing the
 * draft at, and can look at exactly that width.**
 *
 * WHAT MAKES THIS EVIDENCE. Through the real host: `openSession` /
 * `streamPrompt`, the real manager, the real `priming.json`, the real digest
 * provider over a real filesystem store, and the real `screenshot` operation of
 * the real fidelity surface. Two things are doubles, both the system's external
 * boundaries: the Anthropic client (the network) and the browser — which records
 * the width it was asked to lay the page out at, because that width is the claim.
 *
 *   1  a turn that reports a width has the digest STATE it, naming which of the
 *      site's own layouts it sits between; a turn that reports none says nothing
 *   2  `screenshot` at `viewport: "client"` is taken at the reported width, and
 *      refuses by name on a turn that reported none
 *   3  a malformed report is not a width (the route refuses it)
 *   4  the priming names the client-width rule, in both declared orders
 */

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const SLUG = 'req388'
const ORIGIN = 'https://app.example.test'

const HOME: Record<string, unknown> = {
  id: 'home',
  slug: 'home',
  title: 'Home',
  modules: [],
  l1: {
    widths: [320, 375, 768, 1024, 1280, 1440],
    background: '#ffffff',
    textColor: '#111111',
    root: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      children: [{ kind: 'text', text: 'Fresh bread, every morning', axes: { fontSizePx: 48 } }],
    },
  },
}

/** The browser double: answers a plain page at whatever width it is asked for, and records the width. */
class WidthDriver implements BrowserDriver {
  static widths: number[] = []
  async navigate(_url: string, _viewport?: Viewport): Promise<void> {}
  async screenshot(viewport?: Viewport): Promise<Uint8Array> {
    const width = viewport?.width ?? 1280
    WidthDriver.widths.push(width)
    const height = 400
    return encodePng({ data: new Uint8Array(width * height * 3).fill(240), width, height, channels: 3 })
  }
  async query<T>(): Promise<T> {
    return [] as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<html><body></body></html>'
  }
  async close(): Promise<void> {}
}

let site: SiteFixture
let host: HostDeps

beforeEach(async () => {
  site = makeFsSite({ slug: SLUG, pages: { 'home.json': HOME } })
  WidthDriver.widths = []
  const lib = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as Untyped
  host = {
    lib: lib as HostDeps['lib'],
    store: site.store,
    archive: new lib.NullArchive(),
    junctions: lib.memoryJunctions(),
    audit: null,
    apiKey: 'test-key-not-a-real-one',
    fidelity: (slug: string): FidelityDeps => ({
      slug,
      origin: ORIGIN,
      references: memoryReferenceStore(),
      driverFactory: async () => new WidthDriver(),
      guardedDriver: () => async () => new WidthDriver(),
    }),
  } as HostDeps
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  site.dispose?.()
})

/** The text of every tool result handed back to the model on this request. */
function toolResults(req: Untyped): string {
  const out: string[] = []
  for (const message of req.messages) {
    if (!Array.isArray(message.content)) continue
    for (const block of message.content) {
      if (block?.type !== 'tool_result') continue
      const inner = Array.isArray(block.content) ? block.content : [{ type: 'text', text: String(block.content ?? '') }]
      for (const part of inner) if (part?.type === 'text') out.push(part.text)
    }
  }
  return out.join('\n')
}

async function turn(sessionId: string, text: string, view?: Untyped): Promise<void> {
  for await (const _e of streamPrompt(sessionId, text, { cwd: site.cwd! }, host, undefined, view)) void _e
}

describe('REQ-388 — the digest states the width the client is viewing', () => {
  it('test_UAT_FC_REQ-388_a_reported_width_is_stated_against_the_sites_layouts', async () => {
    const client = scriptedClient([says('Right.'), says('Still right.')])
    setModelClient(client)
    const { sessionId } = await openSession(SLUG, { cwd: site.cwd! }, host)

    await turn(sessionId, 'the header wraps', { width: 812, height: 640, mode: 'fit' })
    await turn(sessionId, 'and now?')

    // Stated as a fact, in the per-turn tail, naming the two of the site's own
    // layouts it falls between — with the builder's name for each it has one.
    expect(turnTailText(client.seen[0])).toContain(
      'Your client is viewing the draft at 812px (Fit pane) — between the 768px (tablet) and 1024px layouts.',
    )
    // A turn that reported nothing says nothing — never the last turn's width.
    expect(turnTailText(client.seen[1])).not.toContain('viewing the draft at')
  })

  it('test_UAT_FC_REQ-388_a_fixed_setting_is_named_as_the_layout_it_is', async () => {
    const client = scriptedClient([says('Right.')])
    setModelClient(client)
    const { sessionId } = await openSession(SLUG, { cwd: site.cwd! }, host)
    await turn(sessionId, 'how is the phone', { width: 375, mode: 'phone' })
    expect(turnTailText(client.seen[0])).toContain(
      'Your client is viewing the draft at 375px (Phone) — exactly the 375px (phone) layout.',
    )
  })

  it('test_UAT_FC_REQ-388_a_malformed_report_is_not_a_width', () => {
    // The route refuses `null` with a 400 and passes `undefined` through as "none".
    expect(readClientView(undefined)).toBeUndefined()
    expect(readClientView({ width: 812, mode: 'fit' })).toEqual({ width: 812, mode: 'fit' })
    expect(readClientView({ width: -3, mode: 'fit' })).toBeNull()
    expect(readClientView({ width: 812, mode: 'watch' })).toBeNull()
    expect(readClientView('812')).toBeNull()
  })
})

describe('REQ-388 — screenshot can look at the client width', () => {
  it('test_UAT_FC_REQ-388_screenshot_at_client_is_taken_at_the_reported_width', async () => {
    const client = scriptedClient([
      calls('screenshot', { of: { kind: 'draft', viewport: 'client' } }),
      says('That is what you see.'),
    ])
    setModelClient(client)
    const { sessionId } = await openSession(SLUG, { cwd: site.cwd! }, host)
    await turn(sessionId, 'the header wraps', { width: 812, height: 640, mode: 'fit' })

    // The browser was asked for the client's width, not the desktop default…
    expect(WidthDriver.widths).toEqual([812])
    // …and the picture says which width it is of.
    expect(toolResults(client.seen[1])).toContain("at the client's width (812px)")
  })

  it('test_UAT_FC_REQ-388_screenshot_at_client_refuses_when_no_width_was_reported', async () => {
    const client = scriptedClient([
      calls('screenshot', { of: { kind: 'draft', viewport: 'client' } }),
      says('I will name a width.'),
    ])
    setModelClient(client)
    const { sessionId } = await openSession(SLUG, { cwd: site.cwd! }, host)
    await turn(sessionId, 'how does it look')

    expect(WidthDriver.widths).toEqual([])
    expect(toolResults(client.seen[1])).toContain("your client's width was not reported with this turn")
  })
})

describe('REQ-388 — the consultant is told how to judge', () => {
  it('test_UAT_FC_REQ-388_the_priming_names_the_client_width_rule_in_both_orders', () => {
    for (const withCorpus of [true, false]) {
      const entries = primingConfig(withCorpus).priming as Array<{ text?: unknown }>
      const told = entries.map((e) => (typeof e.text === 'string' ? e.text : '')).join('\n')
      expect(told, `withCorpus=${withCorpus}`).toContain('they mean the width they are')
      expect(told).toContain('viewport: "client"')
      expect(told).toMatch(/say which width the change was made\s+for/)
    }
  })
})
