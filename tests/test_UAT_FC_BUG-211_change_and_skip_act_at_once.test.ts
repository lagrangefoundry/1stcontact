// @vitest-environment jsdom
/**
 * [[BUG-211]] — **Change and Skip act on their card at once.**
 *
 * A browser gives a clicked button focus, and the panel keeps a card that holds
 * focus as drawn so a redraw never loses typing. The button clicked must not
 * count: each click here FOCUSES THE BUTTON FIRST, as a browser does, then clicks.
 * THE REAL BUILDER in jsdom, with only the plan transport replaced; what is read
 * is the card the client sees.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`BUG-211 suites skipped: ${WEBUI_SKIP_REASON}`)

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
  let view = { stages: STAGES, asks }
  return {
    fetchPlan: async () => view,
    answerAsk: async (body: Record<string, any>) => {
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
    uploadMaterial: async () => ({ uid: 'material-1' }),
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

/** Click as a browser does: the button takes focus, then the click lands. */
const press = (button: HTMLElement) => {
  button.focus()
  button.click()
}

async function mounted(asks: Record<string, unknown>[]) {
  const app = mountBuilder(root, { sites: SITES, storage: memoryStorage(), chatTransport, planTransport: planTransport(asks) })
  await settle()
  return app
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-211 — Change and Skip act on their card at once', () => {
  it('test_UAT_FC_BUG-211_change_opens_the_editor_straight_away', async () => {
    const app = await mounted([ask('licence', { status: 'answered', answer: 'GS-1', answered_by: 'client' })])
    expect(card(app, 'licence').querySelector('input.plan-ask__input')).toBeNull()

    press(card(app, 'licence').querySelector('.plan-ask__change') as HTMLElement)

    const input = card(app, 'licence').querySelector('input.plan-ask__input') as HTMLInputElement | null
    expect(input).toBeTruthy()
    expect(input!.value).toBe('GS-1')
    expect(card(app, 'licence').textContent).toContain('Why licence matters.')
  })

  it('test_UAT_FC_BUG-211_skip_on_a_reopened_card_shows_it_skipped_with_the_editor_closed', async () => {
    const app = await mounted([ask('licence', { status: 'answered', answer: 'GS-1', answered_by: 'client' })])
    press(card(app, 'licence').querySelector('.plan-ask__change') as HTMLElement)
    expect(card(app, 'licence').querySelector('.plan-ask__editor')).toBeTruthy()

    press(card(app, 'licence').querySelector('.plan-ask__skip') as HTMLElement)
    await settle()

    const now = card(app, 'licence')
    expect(now.dataset.status).toBe('skipped')
    expect(now.querySelector('.plan-ask__value')!.textContent).toBe('Skipped')
    expect(now.querySelector('.plan-ask__editor')).toBeNull()
  })

  it('test_UAT_FC_BUG-211_a_field_being_typed_in_still_survives_a_redraw', async () => {
    const app = await mounted([ask('licence', { status: 'answered', answer: 'GS-1', answered_by: 'client' }), ask('fee')])
    press(card(app, 'licence').querySelector('.plan-ask__change') as HTMLElement)
    const typing = card(app, 'licence').querySelector('input.plan-ask__input') as HTMLInputElement
    typing.focus()
    typing.value = 'GS-2 half typ'

    // Another card's answer redraws the panel while the client is mid-word.
    const fee = card(app, 'fee').querySelector('input.plan-ask__input') as HTMLInputElement
    fee.value = '£60'
    fee.dispatchEvent(new Event('change'))
    typing.focus()
    await settle()

    expect(card(app, 'licence').querySelector('input.plan-ask__input')).toBe(typing)
    expect(typing.value).toBe('GS-2 half typ')
  })
})
