import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import { openSession, resetAiHost, setModelClient, streamPrompt, type HostDeps } from '../tools/generate/src/cli/ai/host-core'
import { readClientView } from '../tools/generate/src/cli/ai/roles'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import type { FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { makeFsSite, type SiteFixture } from './support/site-factory'
import { says, scriptedClient, turnTailText } from './support/scripted-model-client'

/**
 * [[BUG-250]] — **with Looks open, the consultant is told which look the client
 * is looking at**, on BUG-246's pane line.
 *
 * Through the real host — `openSession` / `streamPrompt`, the real manager, the
 * real `priming.json` and the real digest over a real filesystem store — with
 * only the Anthropic client doubled. The builder's half (what it sends) is
 * `test_UAT_FC_BUG-250_looks_mode.test.ts`.
 */

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const SLUG = 'bug250'
const HOME: Record<string, unknown> = {
  id: 'home',
  slug: 'home',
  title: 'Home',
  modules: [],
  l1: {
    widths: [375, 768, 1280],
    background: '#ffffff',
    textColor: '#111111',
    root: { kind: 'container', id: 'root', layout: 'stack', children: [{ kind: 'text', text: 'Arc welding' }] },
  },
}

let site: SiteFixture
let host: HostDeps

beforeEach(async () => {
  site = makeFsSite({ slug: SLUG, pages: { 'home.json': HOME } })
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
      origin: 'https://app.example.test',
      references: memoryReferenceStore(),
      driverFactory: async () => {
        throw new Error('no browser in this suite')
      },
      guardedDriver: () => async () => {
        throw new Error('no browser in this suite')
      },
    }),
  } as HostDeps
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  site.dispose?.()
})

async function turn(sessionId: string, text: string, view?: Untyped): Promise<void> {
  for await (const _e of streamPrompt(sessionId, text, { cwd: site.cwd! }, host, undefined, view)) void _e
}

describe('BUG-250 — the digest names the look shown', () => {
  it('test_UAT_FC_BUG-250_looks_open_is_named_with_the_look', async () => {
    const client = scriptedClient([says('Right.')])
    setModelClient(client)
    const { sessionId } = await openSession(SLUG, { cwd: site.cwd! }, host)

    await turn(sessionId, 'which do you think', { width: 1280, mode: 'desktop', pane: 'looks', look: 'Workwear' })
    expect(turnTailText(client.seen[0])).toContain('The client is looking at: Looks (the "Workwear" look).')
  })

  it('test_UAT_FC_BUG-250_a_malformed_look_report_is_not_a_view', () => {
    expect(readClientView({ width: 812, mode: 'fit', pane: 'looks', look: ' Coastal ' })).toEqual({
      width: 812,
      mode: 'fit',
      pane: 'looks',
      look: 'Coastal',
    })
    expect(readClientView({ width: 812, mode: 'fit', pane: 'looks', look: '' })).toBeNull()
    expect(readClientView({ width: 812, mode: 'fit', pane: 'looks', look: 7 })).toBeNull()
    expect(readClientView({ width: 812, mode: 'fit', pane: 'looks', look: 'x'.repeat(121) })).toBeNull()
  })
})
