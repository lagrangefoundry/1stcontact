/**
 * REQ-356 — the site plan: one living record per site that the consultant and
 * the coordinator both work from ([[DOC-64]] §5).
 *
 * A FOURTH SURFACE, for the reason `ledger-core.ts` gives for being a third. The
 * ledger reaches one conversation's own record; this reaches one SITE's, which
 * outlives every conversation about it. The two meet in exactly one place: the
 * decision log is the plan body's `## Decision log` section, and `record_decision`
 * appends there — so a site built over several sessions keeps one log rather than
 * a partial one per session.
 *
 * THE RULES LIVE HERE, NOT IN THE TICKET STORE. The store's type pack checks a
 * field's top-level shape (`list`, `object`) and nothing inside it, and its
 * custom validators are a string DSL with no reach into a list. So the three
 * invariants REQ-356 names are enforced by {@link checkPlan}, which every write
 * through {@link planOperations} passes before the host is handed anything to
 * store. The AI's only way to write a plan is this surface — the ticket surface it
 * holds over the client's tickets reads and never writes.
 *
 * WHO MAY DO WHAT IS THE GRANT. The consultant and the coordinator are granted
 * different groups ({@link planInstanceConfig}); no operation takes a role. The
 * one rule that is about identity rather than authority — the coordinator is
 * never an answerer — is a rule about the DATA, enforced on every write whoever
 * made it, so it cannot be granted around.
 */
import planSeed from './plan-seed.json'
import planSurface from './plan-surface.json'
import { ledgerError } from './ledger-core'

/** The declaration, imported as data for the reason `toolbox-core.ts` gives. */
export const PLAN_DECLARATION = planSurface as unknown as Record<string, unknown>

/** The surface name, so nothing addresses it as a literal. */
export const PLAN_SURFACE = 'plan'

/**
 * What a plan is a plan OF. One shape, several seed lists: [[DOC-38]] §9's rule is
 * that a type exists where the shape differs and everything else is a field, so a
 * later marketing plan is a kind and not a type. This REQ delivers the site plan.
 */
export const PLAN_KINDS = ['site'] as const
export const SITE_PLAN = 'site'

export const PHASES = ['intake', 'first_pass', 'revision', 'prelaunch', 'live'] as const
export const AREAS = [
  'purpose',
  'messaging',
  'style',
  'imagery',
  'functionality',
  'liveness',
  'structure',
] as const
export const TIERS = ['concept', 'detail'] as const
export const DECISION_STATES = [
  'open',
  'defaulted',
  'proposed',
  'not_objected',
  'chosen',
  'delegated',
  'parked',
] as const
/** The states only a client's own answer can reach ([[DOC-64]] §5). */
export const CLIENT_STATES: readonly string[] = ['chosen', 'delegated', 'parked']
/** Who may answer a check. Never the coordinator ([[DOC-62]] §3). */
export const ANSWERERS: readonly string[] = ['alice', 'user']
export const VERDICTS = ['yes', 'not_sure', 'no'] as const
export const TASK_STATUSES = ['todo', 'doing', 'done', 'dropped'] as const
export const FEATURE_STATUSES = ['wanted', 'not_wanted', 'later'] as const

/** The body's sections, in the order a new plan has them. */
export const BRIEF_SECTION = 'Brief'
export const LOG_SECTION = 'Decision log'
export const NOTES_SECTION = 'Notes'
const SECTIONS = [BRIEF_SECTION, LOG_SECTION, NOTES_SECTION]

/** The declared code a write that breaks a plan rule is refused under. */
export const PLAN_INVALID = 'PLAN_INVALID'

/** Which role a grant is for. */
export type PlanRole = 'consultant' | 'coordinator'

export interface PlanDecision {
  id: string
  title: string
  area: string
  tier: string
  /** How it is expected to be settled: ask, talk, show, offer ([[DOC-64]] §6). */
  settle?: string
  state: string
  value?: string
  /** Ever chosen from alternatives the client could see? */
  compared: boolean
  parked_reason?: string
  /** The client's own words, attached when they settled it. */
  answer?: { quote: string; at: string }
  /** The `### Decision N` entry in the body that records it. */
  log?: number
}

export interface PlanCheckAnswer {
  by: string
  verdict: string
  note?: string
}

export interface PlanCheck {
  id: string
  question: string
  triggers: string[]
  asked_at?: string
  answers: PlanCheckAnswer[]
}

export interface PlanTask {
  id: string
  title: string
  status: string
  depends_on?: string[]
  decisions?: string[]
}

export interface PlanFields {
  kind: string
  /** The store-minted site key ([[DOC-45]] §6) — sites carry no slug. */
  site_key: string
  phase: string
  brief: Record<string, unknown>
  functionality: { feature: string; status: string }[]
  decisions: PlanDecision[]
  checks: PlanCheck[]
  tasks: PlanTask[]
}

/** A plan as the host stores it: structured frontmatter, free-text body. */
export interface Plan {
  fields: PlanFields
  body: string
}

/**
 * The host's side of the plan.
 *
 * TWO VERBS AND NO TICKET VOCABULARY, for `LedgerDeps`' reason. `write` takes a
 * CHANGE rather than a value because the host is the only thing that knows the
 * stored version: it reads, applies the change, and stores with compare-and-set.
 * Where the site has no plan yet the host creates the seeded one ({@link seedPlan})
 * first, so the first write and every later one are the same call.
 *
 * An implementation raises `CONFLICT` when the plan moved underneath a write.
 */
export interface PlanDeps {
  /**
   * The site's plan. A host that stores plans creates the seeded one on first
   * read; `null` only from a host that cannot.
   */
  read(): Promise<Plan | null>
  /** Apply a change to the plan (seeding it when absent); answer what was stored. */
  write(change: (plan: Plan) => Plan): Promise<Plan>
  /** The clock. Absent is the wall clock. */
  now?: () => string
}

type Params = Record<string, unknown>
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** A refusal under a code the declaration declares. */
const refuse = (code: string, message: string): Error => ledgerError(code, message)

/** What a new site's plan holds before anybody has said anything. */
export function seedPlan(siteKey: string): Plan {
  return {
    fields: {
      kind: SITE_PLAN,
      site_key: siteKey,
      phase: planSeed.phase,
      brief: {},
      functionality: [],
      decisions: planSeed.decisions.map((d) => ({ ...d, state: 'open', compared: false })),
      checks: planSeed.checks.map((c) => ({ ...c, triggers: [...c.triggers], answers: [] })),
      tasks: [],
    },
    body: SECTIONS.map((name) => `## ${name}`).join('\n\n'),
  }
}

/** Where a `## name` section starts and ends in a body, or `null`. */
function sectionBounds(body: string, name: string): { start: number; end: number } | null {
  const lines = body.split('\n')
  const at = lines.findIndex((line) => line.trim() === `## ${name}`)
  if (at < 0) return null
  let end = lines.length
  for (let i = at + 1; i < lines.length; i += 1) {
    // LEVEL TWO EXACTLY: a `### Decision N` entry is inside its section.
    if (/^## (?!#)/.test(lines[i])) {
      end = i
      break
    }
  }
  return { start: at, end }
}

/** One section's text, heading excluded; `''` when the body has no such section. */
export function planSection(body: string, name: string): string {
  const bounds = sectionBounds(body ?? '', name)
  if (!bounds) return ''
  return (body ?? '')
    .split('\n')
    .slice(bounds.start + 1, bounds.end)
    .join('\n')
    .trim()
}

/**
 * The body with `text` appended to the end of one section.
 *
 * A MISSING SECTION IS ADDED AT THE END rather than refused: the body is free
 * text a person can edit, and losing a decision because somebody deleted a
 * heading would be the worse outcome.
 */
export function appendToSection(body: string, name: string, text: string): string {
  const lines = (body ?? '').split('\n')
  const bounds = sectionBounds(body ?? '', name)
  if (!bounds) return `${(body ?? '').replace(/\s+$/, '')}\n\n## ${name}\n\n${text.trim()}`.trim()
  const inside = lines.slice(bounds.start + 1, bounds.end).join('\n').trim()
  const section = [`## ${name}`, '', ...(inside ? [inside, ''] : []), text.trim()]
  const after = lines.slice(bounds.end)
  return [...lines.slice(0, bounds.start), ...section, ...(after.length ? ['', ...after] : [])]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
}

/** How many `### Decision N` entries a log section holds. */
export function logEntries(body: string): number {
  return (planSection(body, LOG_SECTION).match(/^### Decision \d+\s*$/gm) ?? []).length
}

/**
 * The plan's rules, checked on every write ([[REQ-356]]).
 *
 * 1. A check is answered by `alice` or `user` and by nobody else — the coordinator
 *    has no opinion of the site, by construction.
 * 2. A decision reaches `chosen`, `delegated` or `parked` only with the client's
 *    answer attached.
 * 3. `parked` carries the reason it was parked.
 *
 * Plus the closed vocabularies and the references a task makes, so a plan that
 * passes is one every reader can project without guarding.
 */
export function checkPlan(fields: PlanFields): void {
  const bad = (message: string): never => {
    throw refuse(PLAN_INVALID, message)
  }
  if (!(PLAN_KINDS as readonly string[]).includes(fields.kind)) bad(`unknown plan kind ${JSON.stringify(fields.kind)}`)
  if (!(PHASES as readonly string[]).includes(fields.phase)) bad(`unknown phase ${JSON.stringify(fields.phase)}`)
  for (const f of fields.functionality) {
    if (!(FEATURE_STATUSES as readonly string[]).includes(f.status)) {
      bad(`feature ${f.feature} has unknown status ${JSON.stringify(f.status)}`)
    }
  }
  const decisionIds = new Set<string>()
  for (const d of fields.decisions) {
    if (decisionIds.has(d.id)) bad(`two decisions are called ${d.id}`)
    decisionIds.add(d.id)
    if (!(DECISION_STATES as readonly string[]).includes(d.state)) {
      bad(`decision ${d.id} has unknown state ${JSON.stringify(d.state)}`)
    }
    if (!(AREAS as readonly string[]).includes(d.area)) bad(`decision ${d.id} has unknown area ${d.area}`)
    if (!(TIERS as readonly string[]).includes(d.tier)) bad(`decision ${d.id} has unknown tier ${d.tier}`)
    if (CLIENT_STATES.includes(d.state) && !(d.answer && d.answer.quote.trim() !== '')) {
      bad(`decision ${d.id} cannot be ${d.state} without the client's answer attached`)
    }
    if (d.state === 'parked' && !(d.parked_reason && d.parked_reason.trim() !== '')) {
      bad(`decision ${d.id} cannot be parked without a reason`)
    }
  }
  for (const c of fields.checks) {
    for (const a of c.answers) {
      if (!ANSWERERS.includes(a.by)) {
        bad(`check ${c.id} cannot be answered by ${JSON.stringify(a.by)}: only alice or the user answer`)
      }
      if (!(VERDICTS as readonly string[]).includes(a.verdict)) {
        bad(`check ${c.id} has unknown verdict ${JSON.stringify(a.verdict)}`)
      }
    }
  }
  const taskIds = new Set(fields.tasks.map((t) => t.id))
  for (const t of fields.tasks) {
    if (!(TASK_STATUSES as readonly string[]).includes(t.status)) {
      bad(`task ${t.id} has unknown status ${JSON.stringify(t.status)}`)
    }
    for (const dep of t.depends_on ?? []) {
      if (!taskIds.has(dep)) bad(`task ${t.id} depends on ${dep}, which is not a task`)
      if (dep === t.id) bad(`task ${t.id} depends on itself`)
    }
    for (const id of t.decisions ?? []) {
      if (!decisionIds.has(id)) bad(`task ${t.id} names decision ${id}, which is not a decision`)
    }
  }
}

/**
 * What the client is shown, and what a session is told: the frontmatter,
 * projected ([[REQ-356]] — "the panel").
 *
 * READ-ONLY AND DERIVED, so it can never disagree with the plan it came from.
 */
export function planPanel(fields: PlanFields): {
  phase: string
  decisions: Record<string, string[]>
  open_checks: { id: string; question: string; answered_by: string[] }[]
  tasks: { done: number; total: number; doing: string[]; next: string[] }
} {
  const decisions: Record<string, string[]> = {}
  for (const state of DECISION_STATES) decisions[state] = []
  for (const d of fields.decisions) {
    const label = d.state === 'parked' && d.parked_reason ? `${d.title} (${d.parked_reason})` : d.title
    decisions[d.state].push(label)
  }
  const live = fields.tasks.filter((t) => t.status !== 'dropped')
  const done = new Set(live.filter((t) => t.status === 'done').map((t) => t.id))
  return {
    phase: fields.phase,
    decisions,
    // ASKED AND NOT YET ANSWERED BY BOTH: a check the client answered and the
    // consultant did not is still open, because the client has not heard the
    // expert's view of it.
    open_checks: fields.checks
      .filter((c) => c.asked_at && !(ANSWERERS.every((by) => c.answers.some((a) => a.by === by))))
      .map((c) => ({ id: c.id, question: c.question, answered_by: c.answers.map((a) => a.by) })),
    tasks: {
      done: done.size,
      total: live.length,
      doing: live.filter((t) => t.status === 'doing').map((t) => t.title),
      next: live
        .filter((t) => t.status === 'todo' && (t.depends_on ?? []).every((dep) => done.has(dep)))
        .map((t) => t.title),
    },
  }
}

/**
 * The bound on the per-turn plan entry, in characters — `MAX_DIGEST_CHARS`' reason
 * and figure: it rides every turn, so it has to pay for itself.
 */
export const MAX_PLAN_REMINDER_CHARS = 2_000

/**
 * The plan as a session is told it on every turn, or `null` without one.
 *
 * WHAT IS UNSETTLED FIRST, because that is what the entry is for: a decision
 * nobody has made, or one that was only defaulted, is the thing a session left to
 * itself forgets. Settled decisions are named, not explained — the log explains.
 */
export function planReminder(plan: Plan | null): string | null {
  if (!plan) return null
  const f = plan.fields
  const panel = planPanel(f)
  const list = (items: string[]): string => items.join('; ')
  const lines = ['### The site plan', '', `Phase: ${f.phase}.`]
  const brief = f.brief as Record<string, unknown>
  const briefBits = [
    typeof brief.business === 'string' ? `business: ${brief.business}` : '',
    typeof brief.site_job === 'string' ? `the site's job: ${brief.site_job}` : '',
    typeof brief.quality_bar === 'string' ? `quality bar: ${brief.quality_bar}` : '',
  ].filter(Boolean)
  if (briefBits.length) lines.push(`Brief — ${briefBits.join('; ')}.`)
  const order: [string, string][] = [
    ['open', 'Not yet decided'],
    ['defaulted', 'Defaulted, never really chosen'],
    ['proposed', 'Proposed, awaiting the client'],
    ['not_objected', 'Seen, not objected to'],
    ['parked', 'Parked'],
    ['delegated', 'Left to you'],
    ['chosen', 'Chosen by the client'],
  ]
  for (const [state, label] of order) {
    if (panel.decisions[state].length) lines.push(`${label}: ${list(panel.decisions[state])}.`)
  }
  for (const c of panel.open_checks) {
    lines.push(`Asked and awaiting an answer: "${c.question}"${c.answered_by.length ? ` (answered by ${c.answered_by.join(', ')})` : ''}.`)
  }
  if (panel.tasks.total) {
    const bits = [`${panel.tasks.done} of ${panel.tasks.total} done`]
    if (panel.tasks.doing.length) bits.push(`doing: ${list(panel.tasks.doing)}`)
    if (panel.tasks.next.length) bits.push(`next: ${list(panel.tasks.next)}`)
    lines.push(`Tasks — ${bits.join('; ')}.`)
  }
  const text = lines.join('\n')
  return text.length <= MAX_PLAN_REMINDER_CHARS
    ? text
    : `${text.slice(0, MAX_PLAN_REMINDER_CHARS - 40).replace(/\s+\S*$/, '')}\n(read_plan for the rest)`
}

// ── operations ──────────────────────────────────────────────────────────────

/** The brief's keys, by how a write sets them: trimmed text, or a value as given. */
const BRIEF_TEXT_KEYS = ['business', 'site_job', 'quality_bar']
const BRIEF_VALUE_KEYS = ['audiences', 'goal', 'existing_site', 'constraints']

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined)

function decisionIn(fields: PlanFields, id: string): PlanDecision {
  const found = fields.decisions.find((d) => d.id === id)
  if (!found) throw refuse('UNKNOWN_DECISION', `the plan has no decision ${JSON.stringify(id)}`)
  return found
}

function checkIn(fields: PlanFields, id: string): PlanCheck {
  const found = fields.checks.find((c) => c.id === id)
  if (!found) throw refuse('UNKNOWN_CHECK', `the plan has no check ${JSON.stringify(id)}`)
  return found
}

function taskIn(fields: PlanFields, id: string): PlanTask {
  const found = fields.tasks.find((t) => t.id === id)
  if (!found) throw refuse('UNKNOWN_TASK', `the plan has no task ${JSON.stringify(id)}`)
  return found
}

/** A deep copy, so a change that throws halfway leaves nothing half-applied. */
const copy = (plan: Plan): Plan => JSON.parse(JSON.stringify(plan)) as Plan

/** The next free id with a prefix: `t1`, `t2`, … */
function nextId(prefix: string, taken: string[]): string {
  let n = taken.length + 1
  while (taken.includes(`${prefix}${n}`)) n += 1
  return `${prefix}${n}`
}

/** A `### Decision N` entry for a client's answer, in the ledger's format. */
function clientEntry(index: number, d: PlanDecision, quote: string): string {
  const what = d.state === 'parked'
    ? `${d.title}: parked — ${d.parked_reason}.`
    : d.state === 'delegated'
      ? `${d.title}: left to the consultant.`
      : `${d.title}: ${d.value ?? 'chosen'}.`
  return [`### Decision ${index}`, '', what, '', `**The client said:** "${quote}"`].join('\n')
}

/** What `read_plan` answers: the plan as stored, and its projection. */
const answer = (plan: Plan): Record<string, unknown> => ({
  plan: plan.fields,
  body: plan.body,
  panel: planPanel(plan.fields),
})

/**
 * How long one string in a write's confirmation may be ([[REQ-361]]). A
 * confirmation names what was written; it is not a second copy of it.
 */
export const CONFIRMATION_CLIP = 200

/** `value` with every string in it clipped to {@link CONFIRMATION_CLIP}. */
function clipped(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.length <= CONFIRMATION_CLIP ? value : `${value.slice(0, CONFIRMATION_CLIP)}… [${value.length} characters]`
  }
  if (Array.isArray(value)) return value.map(clipped)
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clipped(v)]))
  }
  return value
}

/**
 * The operations, bound to one site's plan.
 *
 * EVERY WRITE IS ONE CHANGE, CHECKED. The change runs on a copy, {@link checkPlan}
 * runs on the result, and only then does the host store it — so a refused write
 * leaves the plan byte-identical.
 *
 * A WRITE CONFIRMS; IT DOES NOT ECHO ([[REQ-361]]). Each change returns what it
 * wrote — the decision, task or check as it now stands, the brief keys it set —
 * and nothing else. Every write used to answer the whole plan, 11–24 KB per call,
 * and a session that kept its plan current paid for that on every later request.
 * `read_plan` answers the document; the per-turn plan entry keeps the session
 * oriented in between.
 */
export function planOperations(deps: PlanDeps): Record<string, (p: Params) => Promise<Untyped>> {
  const now = (): string => (deps.now ? deps.now() : new Date().toISOString())
  const change = async (edit: (plan: Plan) => Record<string, unknown>): Promise<Record<string, unknown>> => {
    let written: Record<string, unknown> = {}
    await deps.write((current) => {
      const next = copy(current)
      written = edit(next)
      checkPlan(next.fields)
      return next
    })
    return clipped(written) as Record<string, unknown>
  }

  return {
    read_plan: async () => {
      const plan = await deps.read()
      // NO PLAN IS AN EMPTY ONE, not a refusal: a site nobody has planned yet has
      // the seed in front of it, and saying so is the useful answer.
      return answer(plan ?? seedPlan(''))
    },

    // ── the brief: both roles ────────────────────────────────────────────────
    update_brief: (p) =>
      change((plan) => {
        const brief = plan.fields.brief
        for (const key of BRIEF_TEXT_KEYS) {
          if (str(p[key])) brief[key] = str(p[key])
        }
        for (const key of BRIEF_VALUE_KEYS) {
          if (p[key] !== undefined && p[key] !== null) brief[key] = p[key]
        }
        if (str(p.quote)) plan.body = appendToSection(plan.body, BRIEF_SECTION, `> ${str(p.quote)}`)
        const set = [...BRIEF_TEXT_KEYS.filter((k) => str(p[k])), ...BRIEF_VALUE_KEYS.filter((k) => p[k] !== undefined && p[k] !== null)]
        return { brief: set, ...(str(p.quote) ? { quoted: true } : {}) }
      }),
    set_feature: (p) =>
      change((plan) => {
        const feature = str(p.feature) ?? ''
        const status = String(p.status)
        const existing = plan.fields.functionality.find((f) => f.feature === feature)
        if (existing) existing.status = status
        else plan.fields.functionality.push({ feature, status })
        return { feature: { feature, status } }
      }),
    add_note: (p) =>
      change((plan) => {
        const text = String(p.text ?? '')
        plan.body = appendToSection(plan.body, NOTES_SECTION, text)
        return { note: { section: NOTES_SECTION, characters: text.trim().length } }
      }),

    // ── the consultant ───────────────────────────────────────────────────────
    set_decision: (p) =>
      change((plan) => {
        const id = str(p.decision) ?? ''
        let d = plan.fields.decisions.find((x) => x.id === id)
        if (!d) {
          // A NEW DECISION NEEDS WHAT EVERY DECISION HAS, so the plan never holds
          // one a reader cannot place.
          if (!str(p.title) || !str(p.area) || !str(p.tier)) {
            throw refuse('UNKNOWN_DECISION', `the plan has no decision ${JSON.stringify(id)}; to add one, give it a title, an area and a tier`)
          }
          d = { id, title: str(p.title)!, area: str(p.area)!, tier: str(p.tier)!, state: 'open', compared: false }
          plan.fields.decisions.push(d)
        }
        // THE CONSULTANT PROPOSES; THE CLIENT SETTLES. Refused here as well as by
        // the declared enum, so the rule does not rest on one declaration.
        const state = str(p.state)
        if (state && !['open', 'defaulted', 'proposed'].includes(state)) {
          throw refuse(PLAN_INVALID, `only the client moves a decision to ${state}; propose it instead`)
        }
        if (str(p.value)) d.value = str(p.value)
        if (state) d.state = state
        if (typeof p.compared === 'boolean') d.compared = p.compared
        if (typeof p.log === 'number') d.log = p.log
        return { decision: d }
      }),
    set_task: (p) =>
      change((plan) => {
        const tasks = plan.fields.tasks
        const id = str(p.task)
        let t = id ? tasks.find((x) => x.id === id) : undefined
        if (!t) {
          if (!str(p.title)) throw refuse('UNKNOWN_TASK', `the plan has no task ${JSON.stringify(id ?? '')}; to add one, give it a title`)
          t = { id: id ?? nextId('t', tasks.map((x) => x.id)), title: str(p.title)!, status: 'todo' }
          tasks.push(t)
        }
        if (str(p.title)) t.title = str(p.title)!
        if (str(p.status)) t.status = str(p.status)!
        if (Array.isArray(p.depends_on)) t.depends_on = p.depends_on.map(String)
        if (Array.isArray(p.decisions)) t.decisions = p.decisions.map(String)
        return { task: t }
      }),
    answer_check: (p) =>
      change((plan) => {
        const c = checkIn(plan.fields, String(p.check))
        // THE ANSWERER IS THE GRANT, NOT A PARAMETER: this operation is the
        // consultant's, so what it records is the consultant's answer.
        c.answers = c.answers.filter((a) => a.by !== 'alice')
        c.answers.push({ by: 'alice', verdict: String(p.verdict), ...(str(p.note) ? { note: str(p.note) } : {}) })
        return { check: c }
      }),

    // ── the coordinator ──────────────────────────────────────────────────────
    record_client_answer: (p) =>
      change((plan) => {
        const d = decisionIn(plan.fields, String(p.decision))
        const state = String(p.state)
        const quote = str(p.quote)
        if (quote) d.answer = { quote, at: now() }
        // THE CLIENT'S STATES NEED THIS ANSWER, not one left over from an earlier
        // round — otherwise a quote about the palette last week would settle it
        // again today.
        else if (CLIENT_STATES.includes(state)) delete d.answer
        d.state = state
        if (str(p.value)) d.value = str(p.value)
        if (typeof p.compared === 'boolean') d.compared = p.compared
        if (state === 'parked') d.parked_reason = str(p.parked_reason)
        else delete d.parked_reason
        // A SETTLED DECISION IS LOGGED in the client's words, which is the
        // coordinator's half of the log: what the client said, not why.
        if (quote && CLIENT_STATES.includes(state)) {
          const index = logEntries(plan.body) + 1
          // Checked before rendering, so the entry never states a reason that
          // does not exist — `checkPlan` refuses the write either way.
          if (state !== 'parked' || d.parked_reason) {
            plan.body = appendToSection(plan.body, LOG_SECTION, clientEntry(index, d, quote))
            d.log = index
          }
        }
        return { decision: d }
      }),
    ask_check: (p) =>
      change((plan) => {
        const id = str(p.check)
        let c = id ? plan.fields.checks.find((x) => x.id === id) : undefined
        if (!c) {
          if (!str(p.question)) throw refuse('UNKNOWN_CHECK', `the plan has no check ${JSON.stringify(id ?? '')}; to ask a new one, give the question`)
          c = {
            id: id ?? nextId('c', plan.fields.checks.map((x) => x.id)),
            question: str(p.question)!,
            triggers: Array.isArray(p.triggers) ? p.triggers.map(String) : [],
            answers: [],
          }
          plan.fields.checks.push(c)
        }
        // A NEW ROUND: the answers to the last asking were about a site that has
        // since changed.
        c.asked_at = now()
        c.answers = []
        return { check: c }
      }),
    record_check_answer: (p) =>
      change((plan) => {
        const c = checkIn(plan.fields, String(p.check))
        const by = String(p.by)
        c.answers = c.answers.filter((a) => a.by !== by)
        c.answers.push({ by, verdict: String(p.verdict), ...(str(p.note) ? { note: str(p.note) } : {}) })
        return { check: c }
      }),
    set_task_status: (p) =>
      change((plan) => {
        const t = taskIn(plan.fields, String(p.task))
        t.status = String(p.status)
        return { task: t }
      }),
    set_phase: (p) =>
      change((plan) => {
        plan.fields.phase = String(p.phase)
        return { phase: plan.fields.phase }
      }),
  }
}

/** The groups each role is granted ([[DOC-64]] §5's "who writes what"). */
export function planInstanceConfig(role: PlanRole): Record<string, unknown> {
  const work = role === 'consultant' ? 'PlanWork' : 'CoordinatePlan'
  return { [PLAN_SURFACE]: { groups: ['ReadPlan', 'KeepBrief', work] } }
}

const bound = new WeakMap<object, Promise<Untyped>>()

function planToolboxClass(lib: Untyped): Promise<Untyped> {
  return Promise.resolve(lib).then((mod: Untyped) => {
    const existing = bound.get(mod as object)
    if (existing) return existing
    const built = Promise.resolve(
      class PlanToolbox extends mod.ToolboxSurface {
        constructor(deps: PlanDeps) {
          super(PLAN_DECLARATION)
          for (const [op, run] of Object.entries(planOperations(deps))) {
            ;(this as unknown as Params)[op] = run
          }
        }
      },
    )
    bound.set(mod as object, built)
    return built
  })
}

/** The surface, bound to one site's plan. */
export async function planSurfaceFor(lib: Untyped, deps: PlanDeps): Promise<Untyped> {
  const PlanToolbox = await planToolboxClass(lib)
  return new PlanToolbox(deps)
}
