import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import { openSession, resetAiHost, setModelClient, streamPrompt, type HostDeps } from '../tools/generate/src/cli/ai/host-core'
import { primingConfig, readClientView } from '../tools/generate/src/cli/ai/roles'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import type { FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { makeFsSite, type SiteFixture } from './support/site-factory'
import { says, scriptedClient, turnTailText } from './support/scripted-model-client'

/**
 * [[BUG-246]] — **the consultant is told which pane the client has open and which
 * they have never opened, and is primed to link to the right one.**
 *
 * Through the real host — `openSession` / `streamPrompt`, the real manager, the
 * real `priming.json` and the real digest over a real filesystem store — with
 * only the Anthropic client doubled. The builder's half (what it sends) is the
 * suite beside this one.
 *
 *   1  a turn reporting Comparisons open has the digest say so, with the number
 *      of sites, and name the panes not yet opened; a turn reporting none says
 *      nothing
 *   2  a malformed pane report is not a view (the route refuses it)
 *   3  the priming carries the link-when-elsewhere rule, the first-time
 *      where-it-lives line and the unambiguous-names rule, in both orders
 */

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const SLUG = 'bug246'
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

describe('BUG-246 — the digest states the pane the client has open', () => {
  it('test_UAT_FC_BUG-246_comparisons_open_is_named_with_the_unopened_panes', async () => {
    const client = scriptedClient([says('Right.'), says('Still right.')])
    setModelClient(client)
    const { sessionId } = await openSession(SLUG, { cwd: site.cwd! }, host)

    await turn(sessionId, 'what next', {
      width: 1280,
      mode: 'desktop',
      pane: 'comparisons',
      comps: 4,
      unopened: ['edit', 'story'],
    })
    await turn(sessionId, 'and now?')

    const told = turnTailText(client.seen[0])
    expect(told).toContain('The client is looking at: Comparisons (4 sites).')
    expect(told).toContain('Not yet opened: Edit, Story.')
    // A turn that reported nothing says nothing — never the last turn's pane.
    expect(turnTailText(client.seen[1])).not.toContain('The client is looking at')
  })

  it('test_UAT_FC_BUG-246_a_malformed_pane_report_is_not_a_view', () => {
    expect(readClientView({ width: 812, mode: 'fit', pane: 'story', unopened: ['comparisons'] })).toEqual({
      width: 812,
      mode: 'fit',
      pane: 'story',
      unopened: ['comparisons'],
    })
    expect(readClientView({ width: 812, mode: 'fit', pane: 'board' })).toBeNull()
    expect(readClientView({ width: 812, mode: 'fit', unopened: ['story', 'attic'] })).toBeNull()
    expect(readClientView({ width: 812, mode: 'fit', comps: -1 })).toBeNull()
  })
})

describe('BUG-246 — the consultant is primed to link to the right pane', () => {
  it('test_UAT_FC_BUG-246_the_priming_names_the_link_where_it_lives_and_names_rules', () => {
    for (const withCorpus of [true, false]) {
      const entries = primingConfig(withCorpus).priming as Array<{ text?: unknown }>
      const told = entries.map((e) => (typeof e.text === 'string' ? e.text : '')).join('\n')
      expect(told, `withCorpus=${withCorpus}`).toMatch(/on a view they are\s+not\s+looking at, include a show_client link/)
      expect(told).toMatch(/The\s+story board is under Story, beside View and Edit above the preview\./)
      expect(told).toMatch(/never\s+"the board" alone/)
    }
  })
})
