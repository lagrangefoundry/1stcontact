// @vitest-environment jsdom
/**
 * [[BUG-216]] — **A card that takes an upload has an Uploaded button.**
 *
 * Files reach the Library by routes that never answer a card — dragged onto the
 * chat or the Library. Uploaded tells the card so, as an answer the agent hears,
 * instead of leaving the client only Skip. THE REAL BUILDER in jsdom, with only the
 * plan transport replaced; what is read is the card and what was sent.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`BUG-216 suites skipped: ${WEBUI_SKIP_REASON}`)

const SITES = [{ site: 'alpha', latest: null }]
const settle = async (n = 10) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
}

function memoryStorage() {
  const map = new Map<string, string>()
  return {
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

const ask = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  prompt: `${id}?`,
  why: `Why ${id} matters.`,
  input: 'text',
  needed_by: 'first_pass',
  blocking: false,
  status: 'open',
  ...extra,
})

const STAGES = [{ id: 'first_draft', label: 'First draft', state: 'in_progress' }]

/** A plan transport whose answers apply to the view it serves, as the server's do. */
function planTransport(asks: Record<string, unknown>[]) {
  const calls: Record<string, any>[] = []
  const uploads: unknown[] = []
  let view = { stages: STAGES, asks }
  return {
    calls,
    uploads,
    fetchPlan: async () => view,
    answerAsk: async (body: Record<string, any>) => {
      calls.push(body)
      view = {
        ...view,
        asks: view.asks.map((a: Record<string, any>) =>
          a.id !== body.ask
            ? a
            : body.action === 'skip'
              ? { ...a, status: 'skipped', answer: undefined, answered_by: 'client' }
              : { ...a, status: 'answered', answer: body.answer, answered_by: 'client' },
        ),
      }
      return view
    },
    uploadMaterial: async (body: unknown) => {
      uploads.push(body)
      return { uid: 'material-1' }
    },
  }
}

const chatTransport = {
  openSession: async (slug: string) => ({ sessionId: `site-${slug}`, turns: [], ready: true }),
  streamPrompt: async function* () {
    yield { kind: 'done' }
  },
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
  }
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

const card = (app: Handle, id: string): HTMLElement => app.planPanel.element.querySelector(`[data-ask="${id}"]`)

async function mounted(asks: Record<string, unknown>[]) {
  const transport = planTransport(asks)
  const app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), chatTransport, planTransport: transport })
  await settle()
  return { app, transport }
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-216 — upload cards have an Uploaded button', () => {
  it('test_UAT_FC_BUG-216_uploaded_answers_the_card_without_an_upload', async () => {
    const { app, transport } = await mounted([ask('photos', { input: 'upload', upload_role: 'site', multiple: true })])
    const uploaded = card(app, 'photos').querySelector('button.plan-ask__uploaded') as HTMLButtonElement
    expect(uploaded).toBeTruthy()
    expect(uploaded.textContent).toBe('Uploaded')

    uploaded.focus()
    uploaded.click()
    await settle()

    expect(transport.calls).toEqual([{ site: 'alpha', ask: 'photos', action: 'answer', answer: 'Uploaded to the Library' }])
    expect(transport.uploads).toEqual([])
    const now = card(app, 'photos')
    expect(now.dataset.status).toBe('answered')
    expect(now.querySelector('.plan-ask__value')!.textContent).toBe('Uploaded to the Library')
    expect(now.querySelector('.plan-ask__editor')).toBeNull()
  })

  it('test_UAT_FC_BUG-216_only_cards_that_take_an_upload_have_it', async () => {
    const { app } = await mounted([ask('menu', { accepts_upload: true }), ask('licence')])
    expect(card(app, 'menu').querySelector('button.plan-ask__uploaded')).toBeTruthy()
    expect(card(app, 'menu').querySelector('.plan-ask__skip')).toBeTruthy()
    expect(card(app, 'licence').querySelector('button.plan-ask__uploaded')).toBeNull()
  })
})
