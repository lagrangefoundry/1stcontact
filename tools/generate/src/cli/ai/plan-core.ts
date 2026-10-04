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

/**
 * [[REQ-364]] — what shape of answer an ask takes ([[DOC-65]] §6). The two choice
 * types carry `options`; any ask may also accept a document instead.
 */
export const ASK_INPUTS = [
  'text',
  'number',
  'currency',
  'phone',
  'email',
  'url',
  'date',
  'single_choice',
  'multi_choice',
  'upload',
] as const
/** The inputs an answer is picked from rather than typed. */
export const CHOICE_INPUTS: readonly string[] = ['single_choice', 'multi_choice']
/**
 * When an ask's answer is needed. IT ORDERS THE LIST AND NEVER HIDES AN ASK: a
 * question on the panel costs the client nothing until they choose to answer it.
 */
export const NEEDED_BY = ['first_pass', 'revision', 'prelaunch'] as const
export const ASK_STATUSES = ['open', 'answered', 'skipped', 'withdrawn'] as const
/**
 * [[BUG-196]] — what an upload ask's files are FOR: the Library's two roles. `site`
 * is something the client wants on the site (photographs, a logo) and is
 * republishable as it lands; `reference` is background reading. Absent reads as
 * `reference`, so nothing lands on the site's side unasked.
 */
export const UPLOAD_ROLES = ['site', 'reference'] as const
/** Who an answer is recorded as coming from: the client, or the agent that filled it. */
export const CLIENT = 'client'
export const ASK_ANSWERERS: readonly string[] = [CLIENT, 'consultant', 'coordinator']
/** [[REQ-378]] — who put a site on the comp board. */
export const COMP_SOURCES = ['consultant', CLIENT] as const

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
  /** [[REQ-378]] — the comps (reference uids) that shaped it. */
  comps?: string[]
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
  /**
   * [[REQ-379]] — the host saw one of its triggers happen, and nobody has asked or
   * answered it since. Cleared by asking or answering it.
   */
  due?: { trigger: string; at: string }
}

/**
 * [[REQ-379]] — the moments of a build the host can see for itself, recorded so
 * a milestone falls due once for the moment that caused it and a stale phase can
 * be told from a current one.
 */
export interface PlanMilestones {
  /** When the first builder session that wrote the site completed. */
  first_pass_at?: string
  /** Builder sessions that completed after that one. */
  revision_rounds?: number
  /** When Publish was first opened. */
  publish_opened_at?: string
}

export interface PlanTask {
  id: string
  title: string
  status: string
  depends_on?: string[]
  decisions?: string[]
}

/**
 * A question waiting for the client ([[REQ-364]], [[DOC-65]] §6).
 *
 * TWO OWNERS. The agent owns the wording, the input and the reason; the client owns
 * the answer. An agent edit never overwrites an answer the client gave.
 */
export interface PlanAsk {
  id: string
  prompt: string
  /** One line, shown to the client: why it matters. */
  why: string
  input: string
  options?: string[]
  /** "Or upload a document instead." */
  accepts_upload?: boolean
  /** [[BUG-196]] — what its uploads are for. Absent is `reference`. */
  upload_role?: string
  /** [[BUG-196]] — whether one pick may carry several files. Absent: only for a `site` ask. */
  multiple?: boolean
  needed_by: string
  /** The agent cannot proceed without it. */
  blocking: boolean
  status: string
  /** A typed value, or the option(s) picked. */
  answer?: string | string[]
  /**
   * The material ticket uid of an uploaded file that answers it — or, when one
   * pick carried several files ([[BUG-196]]), every one of their uids.
   */
  answer_material?: string | string[]
  /** `client`, or the agent that filled it in from client material. */
  answered_by?: string
  answered_at?: string
  /** What the client's answer replaced, when they changed it. */
  previous_answer?: string | string[]
  /**
   * [[BUG-200]] — the options the client has ticked on a multi-choice ask and not
   * yet finished with. NOT AN ANSWER: the ask keeps its status and attribution, so
   * it is still counted as open and the agent is not told until they press Done.
   */
  draft?: string[]
  withdrawn_reason?: string
}

/**
 * A site on the comp board ([[REQ-378]]): a comparable site the client and the
 * consultant are looking at before the first build.
 *
 * A POINTER TO A CAPTURE, NOT A COPY OF ONE. Every comp is a `reference` ticket
 * made by `capture_site`, and the client's likes and dislikes live on that ticket.
 * The plan holds which captures are on the board, who put them there, and who last
 * wrote the notes and when — the attribution the next turn's notice is read from,
 * exactly as `answered_by` is for an ask. The title and address are kept here too,
 * so the per-turn reminder can name a comp without reading its ticket.
 */
export interface PlanComp {
  reference: string
  title: string
  url: string
  source: string
  added_at: string
  /** Who last wrote the comp's likes and dislikes: `client`, or the agent. */
  notes_by?: string
  notes_at?: string
}

/** A comp as its reference ticket holds it ([[REQ-378]]). */
export interface CompRecord {
  reference: string
  title: string
  url: string
  likes: string[]
  dislikes: string[]
}

/**
 * The host's side of the comp board's notes ([[REQ-378]]): the reference tickets
 * the plan points at. Absent where the host keeps no tickets, which leaves the
 * board unavailable rather than half-working.
 */
export interface CompDeps {
  /** The capture as a comp, or `null` when this business holds no such capture. */
  get(reference: string): Promise<CompRecord | null>
  /** Replace the likes and/or dislikes held on the reference ticket. */
  note(reference: string, notes: { likes?: string[]; dislikes?: string[] }): Promise<CompRecord>
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
  /** [[REQ-364]] — the questions waiting for the client. */
  asks: PlanAsk[]
  /** [[REQ-378]] — the comp board: comparable sites, in the order they were added. */
  comps: PlanComp[]
  /** [[REQ-379]] — what the host has seen of the build. Absent until it has seen anything. */
  milestones?: PlanMilestones
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
  /** [[REQ-378]] — the reference tickets the comp board points at. */
  comps?: CompDeps
}

type Params = Record<string, unknown>
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/** A refusal under a code the declaration declares. */
const refuse = (code: string, message: string): Error => ledgerError(code, message)

/**
 * [[REQ-379]] — the features a client is offered, in their words. Data, in
 * `plan-seed.json`, so the list changes without a code change.
 */
export const FEATURE_CATALOGUE: readonly string[] = planSeed.feature_catalogue

/** [[REQ-379]] — the seeded ask whose answer is the plan's `functionality`. */
export const FEATURES_ASK = 'features'

/** The asks a new plan starts with, their `options_from` resolved against the seed. */
function seedAsks(): PlanAsk[] {
  const lists: Record<string, readonly string[]> = { feature_catalogue: FEATURE_CATALOGUE }
  return planSeed.asks.map(({ options_from, ...a }) => ({
    ...a,
    ...(options_from ? { options: [...(lists[options_from] ?? [])] } : {}),
    status: 'open',
  }))
}

/**
 * [[REQ-379]] — the features ask's answer, written through to `functionality`.
 *
 * A PICKED FEATURE IS WANTED, and a catalogue feature this answer used to pick and
 * no longer does is not wanted — so changing the answer moves the list with it. A
 * feature recorded any other way (`set_feature`, or off the catalogue) is left as
 * it is: the answer speaks only for what it offered.
 */
function featuresAnswered(fields: PlanFields, ask: PlanAsk): void {
  if (ask.id !== FEATURES_ASK || ask.status !== 'answered' || !Array.isArray(ask.answer)) return
  const picked = new Set(ask.answer)
  for (const feature of ask.options ?? []) {
    const existing = fields.functionality.find((f) => f.feature === feature)
    if (picked.has(feature)) {
      if (existing) existing.status = 'wanted'
      else fields.functionality.push({ feature, status: 'wanted' })
    } else if (existing?.status === 'wanted') {
      existing.status = 'not_wanted'
    }
  }
}

/**
 * [[REQ-379]] — the triggers the host fires itself, because it can see them
 * happen. The seed's other trigger names (`before_fan_out`, `vague_dissatisfaction`,
 * …) are judgements, and stay the coordinator's to raise.
 */
export const FIRST_PASS_COMPLETE = 'first_pass_complete'
export const REVISION_ROUND_FINISHED = 'revision_round_finished'
export const BEFORE_PUBLISH = 'before_publish'

/** Every check `trigger` names falls due at `at`. */
function fallDue(fields: PlanFields, trigger: string, at: string): void {
  for (const c of fields.checks) {
    if (c.triggers.includes(trigger)) c.due = { trigger, at }
  }
}

/**
 * [[REQ-379]] — a builder session finished having written the site.
 *
 * THE FIRST IS THE FIRST PASS, and every later one is a revision round: the host
 * cannot tell a "revision" from any other piece of work, and it does not need to —
 * what the checks ask about is the site as it now stands, which every completed
 * session has changed.
 */
export function builderSessionCompleted(plan: Plan, at: string): Plan {
  const next = copy(plan)
  const m = (next.fields.milestones = next.fields.milestones ?? {})
  if (!m.first_pass_at) {
    m.first_pass_at = at
    fallDue(next.fields, FIRST_PASS_COMPLETE, at)
  } else {
    m.revision_rounds = (m.revision_rounds ?? 0) + 1
    fallDue(next.fields, REVISION_ROUND_FINISHED, at)
  }
  checkPlan(next.fields)
  return next
}

/**
 * [[REQ-379]] — the client opened Publish.
 *
 * ONCE, the first time: the pre-publish checks are about a site going out, and a
 * site already out that is published again does not need them asked again.
 */
export function publishOpened(plan: Plan, at: string): Plan {
  const next = copy(plan)
  const m = (next.fields.milestones = next.fields.milestones ?? {})
  if (m.publish_opened_at) return next
  m.publish_opened_at = at
  fallDue(next.fields, BEFORE_PUBLISH, at)
  checkPlan(next.fields)
  return next
}

/**
 * [[REQ-379]] — the phase the build has visibly reached, and what shows it, or
 * `null` when the plan's own phase is not behind it.
 */
export function phaseBehind(fields: PlanFields): { expected: string; because: string } | null {
  const m = fields.milestones ?? {}
  const seen: [string, string] | null = m.publish_opened_at
    ? ['prelaunch', 'Publish has been opened']
    : (m.revision_rounds ?? 0) > 0
      ? ['revision', 'the first pass is built and revisions have started']
      : m.first_pass_at
        ? ['first_pass', 'pages have been built']
        : null
  if (!seen) return null
  const rank = (phase: string): number => (PHASES as readonly string[]).indexOf(phase)
  return rank(fields.phase) < rank(seen[0]) ? { expected: seen[0], because: seen[1] } : null
}

/** Why a check fell due, as the digest says it. */
const DUE_BECAUSE: Record<string, string> = {
  [FIRST_PASS_COMPLETE]: 'the first pass is built',
  [REVISION_ROUND_FINISHED]: 'a round of revisions has finished',
  [BEFORE_PUBLISH]: 'Publish has been opened',
}

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
      asks: seedAsks(),
      comps: [],
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
    if (c.due !== undefined && !(filled(c.due.trigger) && filled(c.due.at))) {
      bad(`check ${c.id} is due without saying what made it due and when`)
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
  checkAsks(fields.asks ?? [], bad)
  const comps = new Set<string>()
  for (const c of fields.comps ?? []) {
    if (!filled(c.reference)) bad('a comp has no reference')
    if (comps.has(c.reference)) bad(`comp ${c.reference} is on the board twice`)
    comps.add(c.reference)
    if (!(COMP_SOURCES as readonly string[]).includes(c.source)) {
      bad(`comp ${c.reference} has unknown source ${JSON.stringify(c.source)}`)
    }
  }
}

const filled = (v: unknown): boolean => typeof v === 'string' && v.trim() !== ''

/** Every material an ask's answer cites, one or several ([[BUG-196]]). */
export function askMaterials(a: Pick<PlanAsk, 'answer_material'>): string[] {
  const m = a.answer_material
  return (Array.isArray(m) ? m : m === undefined ? [] : [m]).filter(filled)
}

/** What an upload ask's files are for: its own role, or `reference` ([[BUG-196]]). */
export const uploadRole = (a: Pick<PlanAsk, 'upload_role'>): string => a.upload_role ?? 'reference'

/** Whether one pick may carry several files: as set, or by default for a `site` ask ([[BUG-196]]). */
export const takesSeveral = (a: Pick<PlanAsk, 'multiple' | 'upload_role'>): boolean =>
  a.multiple ?? uploadRole(a) === 'site'

/** The answer an ask holds is one its input can produce. */
export function answerFits(ask: Pick<PlanAsk, 'input' | 'options'>, answer: unknown): string | null {
  if (ask.input === 'multi_choice') {
    // [[BUG-200]] — NONE IS AN ANSWER: "none of these" is the client saying so.
    if (!Array.isArray(answer)) return 'takes a list of its options'
    const off = answer.find((a) => !(ask.options ?? []).includes(String(a)))
    return off === undefined ? null : `has no option ${JSON.stringify(off)}`
  }
  if (typeof answer !== 'string' || answer.trim() === '') return 'takes a non-empty answer'
  if (ask.input === 'single_choice' && !(ask.options ?? []).includes(answer)) {
    return `has no option ${JSON.stringify(answer)}`
  }
  if (ask.input === 'number' && !Number.isFinite(Number(answer.replace(/,/g, '')))) {
    return 'takes a number'
  }
  return null
}

/**
 * [[REQ-364]] — the asks' rules: closed vocabularies, options where a choice needs
 * them, an answer only where one was given and only one the input could produce, a
 * skip only from the client, and a reason on every withdrawal, so a later turn
 * knows why it must not ask again.
 */
function checkAsks(asks: PlanAsk[], bad: (message: string) => never): void {
  const ids = new Set<string>()
  for (const a of asks) {
    if (!filled(a.id)) bad('an ask has no id')
    if (ids.has(a.id)) bad(`two asks are called ${a.id}`)
    ids.add(a.id)
    if (!filled(a.prompt)) bad(`ask ${a.id} has no prompt`)
    if (!filled(a.why)) bad(`ask ${a.id} has no reason: the client is told why it matters`)
    if (!(ASK_INPUTS as readonly string[]).includes(a.input)) bad(`ask ${a.id} has unknown input ${JSON.stringify(a.input)}`)
    if (CHOICE_INPUTS.includes(a.input)) {
      if (!Array.isArray(a.options) || a.options.length < 2 || !a.options.every(filled)) {
        bad(`ask ${a.id} is a ${a.input} and needs at least two options`)
      }
    }
    if (!(NEEDED_BY as readonly string[]).includes(a.needed_by)) {
      bad(`ask ${a.id} has unknown needed_by ${JSON.stringify(a.needed_by)}`)
    }
    if (typeof a.blocking !== 'boolean') bad(`ask ${a.id} must say whether it is blocking`)
    if (a.upload_role !== undefined && !(UPLOAD_ROLES as readonly string[]).includes(a.upload_role)) {
      bad(`ask ${a.id} has unknown upload_role ${JSON.stringify(a.upload_role)}`)
    }
    if (a.multiple !== undefined && typeof a.multiple !== 'boolean') bad(`ask ${a.id} must say multiple as true or false`)
    if (!(ASK_STATUSES as readonly string[]).includes(a.status)) bad(`ask ${a.id} has unknown status ${JSON.stringify(a.status)}`)
    if (a.answered_by !== undefined && !ASK_ANSWERERS.includes(a.answered_by)) {
      bad(`ask ${a.id} cannot be answered by ${JSON.stringify(a.answered_by)}`)
    }
    if (a.status === 'answered') {
      if (!a.answered_by || !filled(a.answered_at)) bad(`ask ${a.id} is answered without saying by whom and when`)
      const hasMaterial = askMaterials(a).length > 0
      if (a.answer === undefined && !hasMaterial) bad(`ask ${a.id} is answered with neither an answer nor a document`)
      if (a.answer !== undefined) {
        const wrong = answerFits(a, a.answer)
        if (wrong) bad(`ask ${a.id} ${wrong}`)
      }
      if (hasMaterial && a.answer === undefined && !(a.accepts_upload || a.input === 'upload')) {
        bad(`ask ${a.id} does not take a document`)
      }
    }
    if (a.status === 'skipped' && a.answered_by !== CLIENT) bad(`only the client skips ask ${a.id}`)
    if (a.draft !== undefined) {
      if (a.input !== 'multi_choice') bad(`ask ${a.id} is a ${a.input} and keeps no draft`)
      const wrong = answerFits(a, a.draft)
      if (wrong) bad(`ask ${a.id}'s draft ${wrong}`)
    }
    if (a.status === 'withdrawn' && !filled(a.withdrawn_reason)) bad(`ask ${a.id} cannot be withdrawn without a reason`)
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
  due_checks: { id: string; question: string; trigger: string }[]
  tasks: { done: number; total: number; doing: string[]; next: string[] }
  asks: { open: { id: string; prompt: string; needed_by: string; blocking: boolean }[]; answered: string[]; skipped: string[] }
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
    // [[REQ-379]] — FALLEN DUE AND NOT YET RAISED: the host saw the moment, and
    // nobody has asked or answered since.
    due_checks: fields.checks
      .filter((c) => c.due)
      .map((c) => ({ id: c.id, question: c.question, trigger: c.due!.trigger })),
    tasks: {
      done: done.size,
      total: live.length,
      doing: live.filter((t) => t.status === 'doing').map((t) => t.title),
      next: live
        .filter((t) => t.status === 'todo' && (t.depends_on ?? []).every((dep) => done.has(dep)))
        .map((t) => t.title),
    },
    // [[REQ-364]] — WITHDRAWN ASKS ARE LEFT OUT, and stay in the plan with their
    // reason for whoever reads the plan itself.
    asks: {
      open: orderedAsks(fields.asks ?? [])
        .filter((a) => a.status === 'open')
        .map((a) => ({ id: a.id, prompt: a.prompt, needed_by: a.needed_by, blocking: a.blocking })),
      answered: (fields.asks ?? []).filter((a) => a.status === 'answered').map((a) => a.id),
      skipped: (fields.asks ?? []).filter((a) => a.status === 'skipped').map((a) => a.id),
    },
  }
}

/**
 * Asks in the order the client sees them: by `needed_by`, blocking first within
 * each, and otherwise as the agent added them.
 */
export function orderedAsks(asks: PlanAsk[]): PlanAsk[] {
  const rank = (a: PlanAsk): number =>
    (NEEDED_BY as readonly string[]).indexOf(a.needed_by) * 2 + (a.blocking ? 0 : 1)
  return asks
    .map((a, i) => ({ a, i }))
    .sort((x, y) => rank(x.a) - rank(y.a) || x.i - y.i)
    .map(({ a }) => a)
}

/** What the client's plan panel draws ([[REQ-364]]). */
export interface PanelView {
  phase: string
  asks: Omit<PlanAsk, 'withdrawn_reason' | 'previous_answer'>[]
  /** [[REQ-378]] — the comp board, as the plan holds it; the host adds the notes. */
  comps: PlanComp[]
}

/**
 * The plan as the client's panel draws it: the phase, and every ask that has not
 * been withdrawn, in the order the client sees them.
 *
 * A PROJECTION, so the panel holds no state of its own: it is redrawn from this
 * every time the plan may have moved.
 */
export function panelView(fields: PlanFields): PanelView {
  return {
    phase: fields.phase,
    // [[BUG-196]] — AN UPLOAD ASK'S ROLE AND ITS ONE-OR-SEVERAL ARE RESOLVED HERE,
    // defaults included, so the panel reads them and never re-derives the rule.
    asks: orderedAsks((fields.asks ?? []).filter((a) => a.status !== 'withdrawn')).map(
      ({ withdrawn_reason: _w, previous_answer: _p, ...shown }) =>
        shown.accepts_upload || shown.input === 'upload'
          ? { ...shown, upload_role: uploadRole(shown), multiple: takesSeveral(shown) }
          : shown,
    ),
    comps: fields.comps ?? [],
  }
}

/** One or several uploaded documents, counted and named ([[BUG-196]]). */
export function documentsText(uids: string[]): string {
  return uids.length === 1 ? `document ${uids[0]}` : `${uids.length} documents (${uids.join(', ')})`
}

/** An answer as one line of text. An empty multi-choice is "none of these" ([[BUG-200]]). */
export function answerText(answer: string | string[] | undefined): string {
  return Array.isArray(answer) ? (answer.length ? answer.join(', ') : 'none of these') : (answer ?? '')
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
  // [[REQ-379]] — FACTS THE HOST SAW, FIRST, because they are the things a session
  // left to itself forgets: the phase it never moved, the milestone it never raised.
  const behind = phaseBehind(f)
  if (behind) {
    lines.push(`The phase is behind the build: it still says ${f.phase}, but ${behind.because}. Move it on to ${behind.expected} with set_phase.`)
  }
  for (const c of panel.due_checks) {
    lines.push(`Due: ask the client "${c.question}" (${c.id}) — ${DUE_BECAUSE[c.trigger] ?? c.trigger}. Record that you asked with ask_check and their answer with record_check_answer.`)
  }
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
  if (panel.asks.open.length) {
    lines.push(
      `Waiting for the client on the panel (${panel.asks.open.length}): ${list(panel.asks.open.map((a) => `${a.id}${a.blocking ? ' (blocking)' : ''}`))}.`,
    )
  }
  const known = (f.asks ?? []).filter((a) => a.status === 'answered')
  if (known.length) {
    lines.push(
      `Answered: ${list(known.map((a) => `${a.id} = ${a.answer !== undefined ? JSON.stringify(answerText(a.answer)) : documentsText(askMaterials(a))}`))}.`,
    )
  }
  if (panel.asks.skipped.length) lines.push(`The client skipped: ${list(panel.asks.skipped)}.`)
  const comps = f.comps ?? []
  if (comps.length) {
    lines.push(
      `Sites you are comparing (${comps.length}): ${list(comps.map((c) => `${c.title} [${c.reference}]${c.source === CLIENT ? ' (the client added it)' : ''}`))}.`,
    )
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

function askIn(fields: PlanFields, id: string): PlanAsk {
  const found = (fields.asks ?? []).find((a) => a.id === id)
  if (!found) throw refuse('UNKNOWN_ASK', `the plan has no ask ${JSON.stringify(id)}`)
  return found
}

const answeredByClient = (a: PlanAsk): boolean => a.status === 'answered' && a.answered_by === CLIENT

/**
 * What the client may do to an ask from the panel ([[REQ-364]]). `draft` keeps the
 * ticks on a multi-choice ask they have not finished with ([[BUG-200]]).
 */
export const CLIENT_ACTIONS = ['answer', 'skip', 'draft'] as const

/**
 * The client answering or skipping an ask from the panel ([[REQ-364]]).
 *
 * THE CLIENT'S HALF OF THE OWNERSHIP RULE, and the only path that writes
 * `answered_by: client`. Changing an answer is answering again: what it replaces
 * is kept as `previous_answer`, so the agent is told "changed from … to …" rather
 * than hearing about a fact it thinks it already has.
 *
 * Pure, like every operation here: it changes a copy, checks it, and answers it, so
 * a refused answer leaves the plan as it was.
 */
export function clientAnswer(
  plan: Plan,
  input: { ask: string; action: string; answer?: unknown; answer_material?: unknown },
  at: string,
): Plan {
  const next = copy(plan)
  next.fields.asks = next.fields.asks ?? []
  const a = askIn(next.fields, input.ask)
  if (a.status === 'withdrawn') throw refuse('ASK_WITHDRAWN', `ask ${a.id} is no longer needed`)
  // [[BUG-200]] — A DRAFT IS NOT AN ANSWER. It changes nothing but the ticks: not
  // the status, so the ask is still counted as open, and not `answered_at`, so the
  // agent hears nothing until the client presses Done and answers with them all.
  if (input.action === 'draft') {
    if (a.input !== 'multi_choice') throw refuse(PLAN_INVALID, `${a.id} is a ${a.input} and saves on pick`)
    if (!Array.isArray(input.answer)) throw refuse(PLAN_INVALID, `a draft of ${a.id} is a list of its options`)
    a.draft = input.answer.map(String)
    checkPlan(next.fields)
    return next
  }
  delete a.draft
  const prior = a.status === 'answered' ? a.answer : undefined
  if (input.action === 'skip') {
    a.status = 'skipped'
    delete a.answer
    delete a.answer_material
  } else if (input.action === 'answer') {
    // ONE FILE OR SEVERAL ([[BUG-196]]): one is kept as a string, as it always was.
    const several = Array.isArray(input.answer_material)
      ? input.answer_material.map(str).filter((m): m is string => m !== undefined)
      : []
    const material = several.length > 1 ? several : (several[0] ?? str(input.answer_material))
    const typed = Array.isArray(input.answer) ? input.answer.map(String) : str(input.answer)
    if (typed === undefined && material === undefined) {
      throw refuse(PLAN_INVALID, `an answer to ${a.id} needs a value or a document`)
    }
    a.status = 'answered'
    if (typed !== undefined) a.answer = typed
    else delete a.answer
    if (material !== undefined) a.answer_material = material
    else delete a.answer_material
  } else {
    throw refuse(PLAN_INVALID, `unknown action ${JSON.stringify(input.action)}`)
  }
  a.answered_by = CLIENT
  a.answered_at = at
  if (prior !== undefined) a.previous_answer = prior
  else delete a.previous_answer
  featuresAnswered(next.fields, a)
  checkPlan(next.fields)
  return next
}

/** One ask the client changed, as the next turn's notice reports it ([[REQ-364]]). */
export interface ClientChange {
  id: string
  status: string
  answer?: string | string[]
  previous?: string | string[]
  /** Every material the answer cites — several when one pick carried several files. */
  material?: string[]
  at: string
}

/**
 * What the client did on the panel after `since`, oldest first ([[REQ-364]]).
 *
 * ONLY THE CLIENT'S. `answered_by` is the attribution, so an agent's own fill — and
 * every wording edit, which never touches it — is left out by construction rather
 * than by remembering who wrote what.
 */
export function clientChangesSince(fields: PlanFields, since: string): ClientChange[] {
  return (fields.asks ?? [])
    .filter((a) => a.answered_by === CLIENT && (a.status === 'answered' || a.status === 'skipped'))
    .filter((a) => typeof a.answered_at === 'string' && a.answered_at > since)
    .map((a) => ({
      id: a.id,
      status: a.status,
      ...(a.answer !== undefined ? { answer: a.answer } : {}),
      ...(a.previous_answer !== undefined ? { previous: a.previous_answer } : {}),
      ...(askMaterials(a).length ? { material: askMaterials(a) } : {}),
      at: a.answered_at as string,
    }))
    .sort((x, y) => x.at.localeCompare(y.at))
}

/**
 * The bound on the plan-answers notice, in characters — `DELTA_BUDGET_CHARS`'
 * reason: it rides a turn, so its cost is bounded in the thing it spends.
 */
export const PLAN_ANSWERS_BUDGET_CHARS = 600
/** The shortest a value is cut to before entries start being left for `read_plan`. */
const MIN_VALUE_CHARS = 12

const clip = (text: string, max: number): string =>
  text.length <= max ? text : `${text.slice(0, Math.max(1, max - 1))}…`

/**
 * The notice line, or `null` when the client did nothing on the panel.
 *
 * THE COUNT IS ALWAYS EXACT AND THE VALUES ARE WHAT GET CUT, for `deltaLine`'s
 * reason: a value is recoverable by reading the plan and the magnitude is not.
 * Values shrink first; only when even the shortest cut cannot fit every ask does
 * the line name as many as fit and send the reader to `read_plan` for the rest.
 */
export function clientChangesLine(changes: ClientChange[], budget = PLAN_ANSWERS_BUDGET_CHARS): string | null {
  if (changes.length === 0) return null
  const noun = changes.length === 1 ? 'question' : 'questions'
  const head = `Your client updated ${changes.length} ${noun} on the plan panel since your last turn: `
  const tail = '.'
  const render = (c: ClientChange, max: number): string => {
    const v = (x: string | string[] | undefined): string => JSON.stringify(clip(answerText(x), max))
    if (c.status === 'skipped') return `skipped ${c.id}`
    // HOW MANY ARRIVED IS SAID, NEVER CUT ([[BUG-196]]): a pick of six photographs
    // reads as six, so the agent knows to look at all of them.
    const doc = c.material ? ` (${documentsText(c.material)})` : ''
    const what = c.answer !== undefined ? `${v(c.answer)}${doc}` : documentsText(c.material ?? [])
    return c.previous !== undefined ? `changed ${c.id} from ${v(c.previous)} to ${what}` : `answered ${c.id}: ${what}`
  }
  const room = budget - head.length - tail.length
  for (let max = 200; max >= MIN_VALUE_CHARS; max = Math.floor(max / 2)) {
    const all = changes.map((c) => render(c, max)).join('; ')
    if (all.length <= room) return `${head}${all}${tail}`
  }
  const shown: string[] = []
  let used = 0
  for (const c of changes) {
    const one = render(c, MIN_VALUE_CHARS)
    if (used + one.length + 2 > room - 40 && shown.length > 0) break
    shown.push(one)
    used += one.length + 2
  }
  return `${head}${shown.join('; ')} — and ${changes.length - shown.length} more (read_plan for them)${tail}`
}

/** One comp whose notes the client wrote after a cursor ([[REQ-378]]). */
export interface ClientCompChange {
  reference: string
  title: string
  at: string
}

/**
 * The comps whose likes and dislikes the client wrote after `since`, oldest first
 * ([[REQ-378]]). `notes_by` is the attribution, for `clientChangesSince`'s reason.
 */
export function clientCompChangesSince(fields: PlanFields, since: string): ClientCompChange[] {
  return (fields.comps ?? [])
    .filter((c) => c.notes_by === CLIENT && typeof c.notes_at === 'string' && c.notes_at > since)
    .map((c) => ({ reference: c.reference, title: c.title, at: c.notes_at as string }))
    .sort((x, y) => x.at.localeCompare(y.at))
}

/** One comp and its notes as a notice entry: `Title: likes …; dislikes …`. */
export function compNotesText(comp: Pick<CompRecord, 'title' | 'likes' | 'dislikes'>): string {
  const part = (label: string, items: string[]): string =>
    `${label} ${items.length ? items.map((x) => JSON.stringify(x)).join(', ') : 'nothing yet'}`
  return `${comp.title} — ${part('likes', comp.likes)}; ${part('dislikes', comp.dislikes)}`
}

/**
 * The notice line for comp notes the client wrote, or `null` ([[REQ-378]]).
 * Bounded like {@link clientChangesLine}: the count is exact and the notes are
 * what get cut.
 */
export function clientCompNotesLine(comps: CompRecord[], budget = PLAN_ANSWERS_BUDGET_CHARS): string | null {
  if (comps.length === 0) return null
  const head = `Your client updated their likes and dislikes on ${comps.length} comp${comps.length === 1 ? '' : 's'} since your last turn: `
  const all = comps.map(compNotesText).join(' | ')
  const room = budget - head.length - 1
  return all.length <= room ? `${head}${all}.` : `${head}${clip(all, room - 30)} (read_plan for the rest).`
}

const compIn = (fields: PlanFields, reference: string): PlanComp => {
  const found = (fields.comps ?? []).find((c) => c.reference === reference)
  if (!found) throw refuse('UNKNOWN_COMP', `the comp board has no ${JSON.stringify(reference)}`)
  return found
}

/**
 * Put a capture on the comp board ([[REQ-378]]). Already there is not an error: it
 * answers the entry as it stands, so adding the same site twice is harmless.
 */
export function addComp(
  plan: Plan,
  comp: Pick<CompRecord, 'reference' | 'title' | 'url'>,
  source: string,
  at: string,
): { plan: Plan; comp: PlanComp } {
  const next = copy(plan)
  const comps = (next.fields.comps = next.fields.comps ?? [])
  const held = comps.find((c) => c.reference === comp.reference)
  if (held) return { plan: next, comp: held }
  const entry: PlanComp = { reference: comp.reference, title: comp.title, url: comp.url, source, added_at: at }
  comps.push(entry)
  checkPlan(next.fields)
  return { plan: next, comp: entry }
}

/** Record who wrote a comp's notes, and when ([[REQ-378]]). */
export function notedComp(plan: Plan, reference: string, by: string, at: string): Plan {
  const next = copy(plan)
  const c = compIn(next.fields, reference)
  c.notes_by = by
  c.notes_at = at
  return next
}

/** Take a comp off the board ([[REQ-378]]). Its capture stays in the Library. */
export function removeComp(plan: Plan, reference: string): Plan {
  const next = copy(plan)
  compIn(next.fields, reference)
  next.fields.comps = next.fields.comps.filter((c) => c.reference !== reference)
  return next
}

/** Text items as a note list: strings, trimmed, empties dropped. */
export function noteList(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined
  const items = Array.isArray(value) ? value : String(value).split(/\n|;/)
  return items.map((x) => String(x).trim()).filter((x) => x !== '')
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
export function planOperations(
  deps: PlanDeps,
  role: PlanRole = 'consultant',
): Record<string, (p: Params) => Promise<Untyped>> {
  const now = (): string => (deps.now ? deps.now() : new Date().toISOString())
  /** [[REQ-378]] — a capture this business holds, or a refusal that says why not. */
  const compRecord = async (reference: string): Promise<CompRecord> => {
    if (!deps.comps) throw refuse('NO_COMPS', 'this host keeps no comp board')
    const held = reference ? await deps.comps.get(reference) : null
    if (!held) {
      throw refuse('UNKNOWN_COMP', `${JSON.stringify(reference)} is not a capture this business holds; capture_site the address first`)
    }
    return held
  }
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
      const read = answer(plan ?? seedPlan(''))
      // [[REQ-378]] — THE NOTES LIVE ON THE REFERENCE TICKETS, so the plan's read
      // carries them: the comp board as the client sees it, notes and all.
      const comps = plan?.fields.comps ?? []
      if (comps.length && deps.comps) {
        read.comps = await Promise.all(
          comps.map(async (c) => {
            const held = await deps.comps!.get(c.reference)
            return { ...c, likes: held?.likes ?? [], dislikes: held?.dislikes ?? [] }
          }),
        )
      }
      return read
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
        // [[REQ-378]] — the comps that shaped it, each one on the board.
        if (Array.isArray(p.comps)) {
          const refs = p.comps.map(String)
          for (const ref of refs) compIn(plan.fields, ref)
          d.comps = refs
        }
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
        // [[REQ-379]] — ANSWERED IS RAISED: it is no longer due.
        delete c.due
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
        delete c.due
        return { check: c }
      }),
    record_check_answer: (p) =>
      change((plan) => {
        const c = checkIn(plan.fields, String(p.check))
        const by = String(p.by)
        c.answers = c.answers.filter((a) => a.by !== by)
        c.answers.push({ by, verdict: String(p.verdict), ...(str(p.note) ? { note: str(p.note) } : {}) })
        delete c.due
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

    // ── asks: both roles ([[REQ-364]]) ───────────────────────────────────────
    set_ask: (p) =>
      change((plan) => {
        const asks = (plan.fields.asks = plan.fields.asks ?? [])
        const id = str(p.ask) ?? ''
        let a = asks.find((x) => x.id === id)
        if (!a) {
          // A NEW ASK NEEDS WHAT EVERY ASK HAS, so the panel never shows one it
          // cannot draw or explain.
          if (!id || !str(p.prompt) || !str(p.why) || !str(p.input)) {
            throw refuse('UNKNOWN_ASK', `the plan has no ask ${JSON.stringify(id)}; to add one, give it an id, a prompt, a reason and an input`)
          }
          a = { id, prompt: '', why: '', input: '', needed_by: 'first_pass', blocking: false, status: 'open' }
          asks.push(a)
        } else if (a.status === 'withdrawn') {
          // WITHDRAWN IS REMEMBERED so a later turn does not ask again by accident;
          // asking again on purpose says so.
          if (p.reopen !== true) {
            throw refuse('ASK_WITHDRAWN', `ask ${id} was withdrawn (${a.withdrawn_reason}); pass reopen to ask it again`)
          }
          a.status = 'open'
          delete a.withdrawn_reason
        }
        // THE WORDING IS THE AGENT'S AND THE ANSWER IS NOT: nothing below touches
        // `answer`, `status` or who answered.
        if (str(p.prompt)) a.prompt = str(p.prompt)!
        if (str(p.why)) a.why = str(p.why)!
        if (str(p.input)) a.input = str(p.input)!
        if (Array.isArray(p.options)) a.options = p.options.map(String)
        if (typeof p.accepts_upload === 'boolean') a.accepts_upload = p.accepts_upload
        if (str(p.upload_role)) a.upload_role = str(p.upload_role)!
        if (typeof p.multiple === 'boolean') a.multiple = p.multiple
        if (str(p.needed_by)) a.needed_by = str(p.needed_by)!
        if (typeof p.blocking === 'boolean') a.blocking = p.blocking
        return { ask: a }
      }),
    withdraw_ask: (p) =>
      change((plan) => {
        const a = askIn(plan.fields, String(p.ask))
        // THE CLIENT'S ANSWER STAYS: it is a fact they gave, whatever the site
        // now needs.
        if (answeredByClient(a)) throw refuse('ASK_ANSWERED', `the client has answered ${a.id}; it stays as their answer`)
        a.status = 'withdrawn'
        a.withdrawn_reason = str(p.reason)
        return { ask: a }
      }),
    fill_ask: (p) =>
      change((plan) => {
        const a = askIn(plan.fields, String(p.ask))
        if (a.status === 'withdrawn') throw refuse('ASK_WITHDRAWN', `ask ${a.id} was withdrawn (${a.withdrawn_reason})`)
        if (answeredByClient(a)) throw refuse('ASK_ANSWERED', `the client has answered ${a.id}; their answer stands`)
        // THE DECLARED TYPE IS A STRING, so a multi-choice fill arrives as one line.
        const typed = Array.isArray(p.answer)
          ? p.answer.map(String)
          : a.input === 'multi_choice' && str(p.answer)
            ? str(p.answer)!.split(';').map((x) => x.trim()).filter(Boolean)
            : str(p.answer)
        a.status = 'answered'
        if (typed !== undefined) a.answer = typed
        else delete a.answer
        a.answer_material = str(p.material)
        // THE ANSWERER IS THE GRANT, NOT A PARAMETER — `answer_check`'s rule.
        a.answered_by = role
        a.answered_at = now()
        delete a.previous_answer
        delete a.draft
        featuresAnswered(plan.fields, a)
        return { ask: a }
      }),

    // ── the comp board: both roles ([[REQ-378]]) ────────────────────────────
    add_comp: async (p) => {
      const held = await compRecord(String(p.reference ?? ''))
      return change((plan) => {
        const { plan: next, comp } = addComp(plan, held, 'consultant', now())
        plan.fields.comps = next.fields.comps
        return { comp }
      })
    },
    note_comp: async (p) => {
      const reference = String(p.reference ?? '')
      const plan = await deps.read()
      compIn(plan?.fields ?? seedPlan('').fields, reference)
      await compRecord(reference)
      const notes = { likes: noteList(p.likes), dislikes: noteList(p.dislikes) }
      if (notes.likes === undefined && notes.dislikes === undefined) {
        throw refuse(PLAN_INVALID, 'give likes, dislikes or both')
      }
      const stored = await deps.comps!.note(reference, notes)
      await change((current) => {
        current.fields.comps = notedComp(current, reference, role, now()).fields.comps
        return {}
      })
      return { comp: stored }
    },
    remove_comp: (p) =>
      change((plan) => {
        const reference = String(p.reference ?? '')
        plan.fields.comps = removeComp(plan, reference).fields.comps
        return { removed: reference }
      }),
  }
}

/** The groups each role is granted ([[DOC-64]] §5's "who writes what"). */
export function planInstanceConfig(role: PlanRole): Record<string, unknown> {
  const work = role === 'consultant' ? 'PlanWork' : 'CoordinatePlan'
  // [[REQ-364]] — BOTH ROLES KEEP ASKS: either can be the one maintaining the
  // panel, so turning the room on or off changes who keeps it and not how.
  // [[REQ-379]] — AND BOTH KEEP THE MILESTONES, for the same reason: with the room
  // off there is no coordinator, and a phase only the coordinator could move never
  // moved (EPIC-19 Finding 18).
  return { [PLAN_SURFACE]: { groups: ['ReadPlan', 'KeepBrief', work, 'KeepAsks', 'KeepMilestones', 'KeepComps'] } }
}

const bound = new WeakMap<object, Promise<Untyped>>()

function planToolboxClass(lib: Untyped): Promise<Untyped> {
  return Promise.resolve(lib).then((mod: Untyped) => {
    const existing = bound.get(mod as object)
    if (existing) return existing
    const built = Promise.resolve(
      class PlanToolbox extends mod.ToolboxSurface {
        constructor(deps: PlanDeps, role: PlanRole) {
          super(PLAN_DECLARATION)
          for (const [op, run] of Object.entries(planOperations(deps, role))) {
            ;(this as unknown as Params)[op] = run
          }
        }
      },
    )
    bound.set(mod as object, built)
    return built
  })
}

/**
 * The surface, bound to one site's plan and to the role it is granted to — which is
 * what an agent's fill is recorded as.
 */
export async function planSurfaceFor(
  lib: Untyped,
  deps: PlanDeps,
  role: PlanRole = 'consultant',
): Promise<Untyped> {
  const PlanToolbox = await planToolboxClass(lib)
  return new PlanToolbox(deps, role)
}
