// @vitest-environment jsdom
/**
 * story-0ea74f39 — **the Contacts tab draws two independent axes**.
 *
 * What the operator is SHOWN: a stage label on every row and a Member badge only
 * on members, two facets (stage, access) that narrow one list and combine, and a
 * stylesheet keyed on the axis rather than any of its values. Mounted against the
 * actually-installed builder components; the only double is the HTTP transport,
 * because that is the network. The origin half is the workers sibling.
 */

import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => {
  element: HTMLElement
  refresh: () => Promise<void>
}

if (!WEBUI_INSTALLED) console.warn(`contact axes suite skipped: ${WEBUI_SKIP_REASON}`)

const BUILDER_CSS = path.resolve(__dirname, '../apps/control-app/src/builder/builder.css')

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

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

interface Person {
  id: string
  email: string
  displayName: string | null
  status: string
  invitedAt: string | null
  firstSeenAt: string | null
  lastSeenAt: string | null
  termsAcceptedAt: string | null
  pipelineStage: string
  createdAt: string
}

const person = (over: Partial<Person> & { id: string; email: string }): Person => ({
  displayName: null,
  status: 'active',
  invitedAt: null,
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  pipelineStage: 'lead',
  createdAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

/** The four corners of two two-valued axes, in list order. */
const INVITED_NON_MEMBER = person({
  id: 'usr_1',
  email: 'ivan@example.test',
  displayName: 'Ivan',
  invitedAt: '2026-09-01T10:00:00.000Z',
  pipelineStage: 'invited',
})
const LEAD_MEMBER = person({
  id: 'usr_2',
  email: 'sam@example.test',
  displayName: 'Sam',
  firstSeenAt: '2026-09-02T09:00:00.000Z',
  termsAcceptedAt: '2026-09-02T09:00:01.000Z',
})
const INVITED_MEMBER = person({
  id: 'usr_3',
  email: 'mena@example.test',
  displayName: 'Mena',
  invitedAt: '2026-09-01T10:00:00.000Z',
  pipelineStage: 'invited',
  termsAcceptedAt: '2026-09-02T09:00:01.000Z',
})
const LEAD_NEITHER = person({ id: 'usr_4', email: 'cara@example.test', displayName: 'Cara' })

const FOUR = [INVITED_NON_MEMBER, LEAD_MEMBER, INVITED_MEMBER, LEAD_NEITHER]

function transportOver(people: Person[]) {
  const rows = people.map((p) => ({ ...p }))
  return {
    list: async () => ({ people: rows.map((p) => ({ ...p })), canInvite: true, canFulfil: false }),
    item: async (id: string) => ({ person: { ...rows.find((p) => p.id === id)! }, operates: [], grants: [] }),
    saveStatus: async () => ({}),
    grant: async () => ({}),
    revoke: async () => ({}),
    invite: async () => ({}),
    fulfil: async () => ({}),
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createPeoplePanel } = await import('../apps/control-app/src/builder/people.js'))
  }
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
})

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

async function mount(people: Person[] = FOUR) {
  const panel = createPeoplePanel({ storage: memoryStorage(), transport: transportOver(people) })
  root.append(panel.element)
  await panel.refresh()
  return panel
}

const rows = () => [...root.querySelectorAll('.builder-people__row')] as HTMLElement[]
const who = () => [...root.querySelectorAll('.builder-people__who')].map((n) => n.textContent)
const facet = (axis: string) =>
  root.querySelector(`.builder-people__facet[data-axis="${axis}"]`) as HTMLSelectElement

async function choose(axis: string, value: string) {
  facet(axis).value = value
  facet(axis).dispatchEvent(new Event('change'))
  await settle()
}

/** Every selector in a stylesheet, comments stripped. */
function selectorsOf(css: string): string[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const out: string[] = []
  for (const match of stripped.matchAll(/([^{}]+)\{/g)) {
    const prelude = match[1].trim()
    if (prelude.startsWith('@')) continue
    out.push(...prelude.split(',').map((s) => s.trim()).filter(Boolean))
  }
  return out
}

describe.skipIf(!WEBUI_INSTALLED)('story-0ea74f39 — the Contacts tab draws two axes', () => {
  it('test_UAT_AC2209_each_row_draws_stage_and_member_badge_separately', async () => {
    await mount()

    const drawn = rows().map((row) => ({
      stage: row.querySelector('.builder-people__stage')?.textContent ?? null,
      badge: row.querySelector('.builder-people__access')?.textContent ?? null,
    }))
    expect(drawn).toEqual([
      { stage: 'Invited', badge: null },
      { stage: 'Lead', badge: 'Member' },
      { stage: 'Invited', badge: 'Member' },
      { stage: 'Lead', badge: null },
    ])

    // The stage and the badge are two elements, never one.
    for (const row of rows()) {
      const stage = row.querySelector('.builder-people__stage')!
      const badge = row.querySelector('.builder-people__access')
      expect(stage).toBeTruthy()
      if (badge) expect(badge).not.toBe(stage)
      if (badge) expect(stage.contains(badge) || badge.contains(stage)).toBe(false)
    }

    // An unknown stage shows its own name.
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
    await mount([person({ id: 'usr_9', email: 'q@example.test', pipelineStage: 'qualified' })])
    expect(root.querySelector('.builder-people__stage')?.textContent).toBe('qualified')
  })

  it('test_UAT_AC2210_two_facets_narrow_independently_and_combine', async () => {
    await mount()

    const options = (axis: string) =>
      [...facet(axis).options].map((o) => o.textContent)
    expect(options('pipeline')).toEqual(['Any stage', 'Lead', 'Invited'])
    expect(options('access')).toEqual(['Anyone', 'Member', 'Not a member'])
    expect(facet('pipeline')).not.toBe(facet('access'))

    // Each facet alone.
    await choose('pipeline', 'invited')
    expect(who()).toEqual(['Ivan', 'Mena'])
    await choose('pipeline', 'lead')
    expect(who()).toEqual(['Sam', 'Cara'])
    await choose('pipeline', '')
    await choose('access', 'member')
    expect(who()).toEqual(['Sam', 'Mena'])
    await choose('access', 'not_member')
    expect(who()).toEqual(['Ivan', 'Cara'])

    // Combined: "invited and never came".
    await choose('pipeline', 'invited')
    await choose('access', 'not_member')
    expect(who()).toEqual(['Ivan'])

    // Combined: "signed up and never asked".
    await choose('pipeline', 'lead')
    await choose('access', 'member')
    expect(who()).toEqual(['Sam'])

    // Reset both: everyone, each once.
    await choose('pipeline', '')
    await choose('access', '')
    expect(who()).toEqual(['Ivan', 'Sam', 'Mena', 'Cara'])
    expect(new Set(who()).size).toBe(who().length)
  })

  it('test_UAT_AC2211_styling_is_keyed_on_the_axis_never_a_value', async () => {
    await mount()

    // Elements on the same axis share one class set whatever value they show.
    const classSets = (selector: string) =>
      new Set([...root.querySelectorAll(selector)].map((n) => n.className))
    const stageClasses = classSets('.builder-people__stage')
    expect(stageClasses.size).toBe(1)
    const stageTexts = new Set([...root.querySelectorAll('.builder-people__stage')].map((n) => n.textContent))
    expect(stageTexts).toEqual(new Set(['Lead', 'Invited']))
    expect(classSets('.builder-people__access').size).toBe(1)
    expect(facet('pipeline').className).toBe(facet('access').className)

    // No class anywhere in the tab names an axis value.
    const VALUE = /^(lead|invited|member|not[-_]?member|not|qualified)$/i
    for (const node of root.querySelectorAll('[class]')) {
      for (const cls of node.classList) {
        for (const part of cls.split(/[^a-zA-Z0-9]+/)) {
          expect(VALUE.test(part), `class "${cls}" names a value`).toBe(false)
        }
      }
    }

    // The shipped stylesheet: axis selectors exist, value selectors do not.
    const selectors = selectorsOf(fs.readFileSync(BUILDER_CSS, 'utf8'))
    expect(selectors).toContain('.builder-people__stage')
    expect(selectors).toContain('.builder-people__access')
    expect(selectors).toContain('.builder-people__facet')
    const VALUE_TOKEN = /(^|[^a-zA-Z0-9])(lead|invited|member|not_member|not-member)([^a-zA-Z0-9]|$)/i
    const offenders = selectors.filter((s) => VALUE_TOKEN.test(s))
    expect(offenders).toEqual([])
  })
})
