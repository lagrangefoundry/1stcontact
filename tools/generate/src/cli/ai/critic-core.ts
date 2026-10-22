/**
 * [[REQ-427]] — THE CRITIC: an independent review of the work, due at the end of
 * each big build and before publishing.
 *
 * WHY. The consultant signs off its own work. Its context is full of machinery and
 * its own momentum, so it judges a page by why it made it rather than by how a
 * customer sees it. Measurable layout faults are the layout check's job
 * ([[REQ-415]]); the critic is for judgement — does the headline sell, does the
 * hierarchy read, does it look like this trade, does the customer's path to
 * calling work.
 *
 * WHAT IS HERE IS PURE: the record the plan keeps (every critique, every finding
 * and the answer it got), when one falls due, what the hold owes, the brief the
 * critic is handed and the reading of its report. The host's half — the pictures
 * and the critic's own session — is `host-core.ts`'s `criticFor`.
 *
 * THE CRITIC IS GIVEN THE BRIEF AND THE RESULT, NEVER THE CONSULTANT'S REASONING:
 * {@link criticBrief} reads the plan and nothing else, so no phrase of the
 * consultant's conversation can reach it.
 */

import { boardOf, liveNotes } from './story-core'
import type { PlanDecision } from './plan-core'

/** The critic's role, on the site's session manager. */
export const CRITIC_ROLE = 'critic'

/** Its backend entry in `backends.json`: its own model, apart from the builder's. */
export const CRITIC_BACKEND = 'claude_critic'

/** The four lenses, in the order the report ranks ties. */
export const CRITIQUE_LENSES = ['purpose', 'messaging', 'style', 'function'] as const
export type CritiqueLens = (typeof CRITIQUE_LENSES)[number]

export const SEVERITIES = ['high', 'medium', 'low'] as const
export type Severity = (typeof SEVERITIES)[number]

/** How a finding is answered: fixed, put to the client as a decision, or dismissed with a reason. */
export const FINDING_ANSWERS = ['fixed', 'decision', 'dismissed'] as const
export type FindingAnswer = (typeof FINDING_ANSWERS)[number]

/** At most this many findings reach the consultant, ranked. */
export const MAX_FINDINGS = 3

/** At most this many pages are pictured for one critique. */
export const CRITIC_PAGES = 3

/** The widths the critic sees each page at: the camera's presets. */
export const CRITIC_WIDTHS = [
  { name: 'desktop', viewport: 'desktop', width: 1280 },
  { name: 'tablet', viewport: 'tablet', width: 768 },
  { name: 'phone', viewport: 'mobile', width: 375 },
] as const

/**
 * The moments a critique falls due. Two are the plan's own milestones
 * (`first_pass_complete`, `before_publish`, [[REQ-379]]) so the critic and
 * [[REQ-408]]'s weakest-point check fall due together; looks offered is the
 * critic's own; a re-check follows a fixed high-severity finding.
 */
export const LOOKS_OFFERED = 'looks_offered'
export const RECHECK = 'recheck'
/** A critique the consultant asked for with nothing due. */
export const ASKED = 'asked'

/** Which plan decision area each lens puts a client decision under. */
const LENS_AREA: Record<CritiqueLens, string> = {
  purpose: 'purpose',
  messaging: 'messaging',
  style: 'style',
  function: 'functionality',
}

export interface CritiqueFinding {
  /** `C<run>.<n>`, which is what `answer_finding` names. */
  id: string
  lens: CritiqueLens
  severity: Severity
  page: string
  width: string
  /** What is seen, on that page at that width. */
  seen: string
  fix: string
  answer?: { kind: FindingAnswer; note?: string; decision?: string; at: string }
}

export interface CritiqueRun {
  id: string
  at: string
  /** The due point this run discharged, or {@link ASKED}. */
  trigger: string
  /** For a re-check, the run it re-checks; for looks, the page whose looks were offered. */
  of?: string
  focus?: string
  /** The pages pictured. */
  pages: string[]
  /** The site's change counter when it ran: the next critique pictures what changed since. */
  counter: number
  /** The critic's one-line overall judgement. "Good enough" is a valid one. */
  verdict: string
  findings: CritiqueFinding[]
}

/** What the plan holds: the critique now due, if any, and every critique run. */
export interface PlanCritique {
  due?: { trigger: string; at: string; of?: string }
  runs: CritiqueRun[]
}

export interface HasCritique {
  critique?: PlanCritique
  decisions: PlanDecision[]
}

const critiqueOf = (fields: HasCritique): PlanCritique => (fields.critique = fields.critique ?? { runs: [] })

/** The latest critique, or `null`. */
export const latestRun = (fields: Pick<HasCritique, 'critique'>): CritiqueRun | null => fields.critique?.runs.at(-1) ?? null

/**
 * A critique falls due at `trigger`. Looks offered falls due once per page whose
 * looks were offered; a re-check once per run.
 */
export function critiqueFallsDue(fields: HasCritique, trigger: string, at: string, of?: string): void {
  const c = critiqueOf(fields)
  if (of !== undefined && c.runs.some((r) => r.trigger === trigger && r.of === of)) return
  c.due = { trigger, at, ...(of !== undefined ? { of } : {}) }
}

/** The findings of the latest critique not yet answered. */
export function unansweredFindings(fields: Pick<HasCritique, 'critique'>): CritiqueFinding[] {
  return (latestRun(fields)?.findings ?? []).filter((f) => !f.answer)
}

const DUE_BECAUSE: Record<string, string> = {
  first_pass_complete: 'the first draft is built',
  [LOOKS_OFFERED]: 'looks are being offered',
  before_publish: 'the site is about to be published',
  [RECHECK]: 'a high-severity finding was fixed',
}

/** A finding as one line: what `answer_finding` names, and what it says. */
export const findingLine = (f: CritiqueFinding): string =>
  `${f.id} [${f.severity}, ${f.lens}] ${f.page} at ${f.width}: ${f.seen} — suggested: ${f.fix}`

/**
 * What the consultant still owes the critic, one line each: the critique due, or
 * every unanswered finding of the latest one. Empty when nothing is owed. While
 * anything is here the consultant's hand-back is held.
 */
export function critiqueOwed(fields: Pick<HasCritique, 'critique'>): string[] {
  const due = fields.critique?.due
  if (due) return [`A review of the site is due (${DUE_BECAUSE[due.trigger] ?? due.trigger}): call critique.`]
  return unansweredFindings(fields).map((f) => `${findingLine(f)} — answer it with answer_finding.`)
}

/** Whether the site has had its pre-publishing critique, every finding answered. */
export function publishCritiqued(fields: Pick<HasCritique, 'critique'>): boolean {
  const runs = fields.critique?.runs ?? []
  const forPublish = runs.some(
    (r) => r.trigger === 'before_publish' || (r.trigger === RECHECK && runs.find((x) => x.id === r.of)?.trigger === 'before_publish'),
  )
  return forPublish && critiqueOwed(fields).length === 0
}

/** The critic's report, as it parsed. */
export interface CritiqueReport {
  verdict: string
  findings: Omit<CritiqueFinding, 'id' | 'answer'>[]
}

const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/**
 * Read the critic's report: the last JSON object in its reply. Findings are kept
 * in its order — it ranks them — and cut to {@link MAX_FINDINGS}. Throws on a
 * reply with no readable report.
 */
export function parseCritique(reply: string): CritiqueReport {
  const fenced = [...reply.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((m) => m[1])
  const candidates = [...fenced.reverse(), reply.slice(reply.indexOf('{'), reply.lastIndexOf('}') + 1)]
  for (const candidate of candidates) {
    let parsed: unknown
    try {
      parsed = JSON.parse(candidate)
    } catch {
      continue
    }
    if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as Record<string, unknown>).findings)) continue
    const raw = parsed as { verdict?: unknown; findings: Record<string, unknown>[] }
    const findings = raw.findings
      .filter((f) => f && typeof f === 'object')
      .map((f) => ({
        lens: (CRITIQUE_LENSES as readonly string[]).includes(text(f.lens)) ? (text(f.lens) as CritiqueLens) : 'purpose',
        severity: (SEVERITIES as readonly string[]).includes(text(f.severity)) ? (text(f.severity) as Severity) : 'medium',
        page: text(f.page) || 'the site',
        width: text(f.width) || 'every width',
        seen: text(f.seen) || text(f.evidence),
        fix: text(f.fix),
      }))
      .filter((f) => f.seen !== '')
      .slice(0, MAX_FINDINGS)
    return { verdict: text(raw.verdict) || (findings.length ? '' : 'Good enough.'), findings }
  }
  throw new Error('the review came back without a report that could be read')
}

/**
 * Record a critique on the plan: it discharges the critique due (or is recorded
 * as asked for, which near publishing counts as the pre-publishing one), and each
 * finding gets its id. Answers the run as stored.
 */
export function recordCritique(
  fields: HasCritique,
  report: CritiqueReport,
  run: { at: string; pages: string[]; counter: number; focus?: string; nearPublishing?: boolean },
): CritiqueRun {
  const c = critiqueOf(fields)
  const id = `C${c.runs.length + 1}`
  const trigger = c.due?.trigger ?? (run.nearPublishing ? 'before_publish' : ASKED)
  const stored: CritiqueRun = {
    id,
    at: run.at,
    trigger,
    ...(c.due?.of !== undefined ? { of: c.due.of } : {}),
    ...(run.focus ? { focus: run.focus } : {}),
    pages: run.pages,
    counter: run.counter,
    verdict: report.verdict,
    findings: report.findings.map((f, i) => ({ ...f, id: `${id}.${i + 1}` })),
  }
  c.runs.push(stored)
  delete c.due
  return stored
}

/** A refusal `answerFinding` raises: the code the declaration names, and why. */
export class FindingRefusal extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Answer one finding of the latest critique ([[REQ-427]] item 7).
 *
 * `decision` puts it to the client: an existing decision is reopened (unless the
 * client has settled it, which is theirs to reopen), or a new one is added under
 * the lens's area. When the last finding is answered and a high-severity one was
 * fixed, ONE re-check falls due — never a re-check of a re-check.
 */
export function answerFinding(
  fields: HasCritique,
  p: { finding: string; answer: string; note?: string; decision?: string; title?: string },
  at: string,
): { finding: CritiqueFinding; decision?: PlanDecision; recheck: boolean } {
  const run = latestRun(fields)
  const finding = run?.findings.find((f) => f.id === p.finding)
  if (!run || !finding) {
    throw new FindingRefusal('UNKNOWN_FINDING', `${JSON.stringify(p.finding)} is not a finding of the latest review${run ? ` (${run.findings.map((f) => f.id).join(', ') || 'it had none'})` : ''}`)
  }
  const kind = p.answer as FindingAnswer
  if (!(FINDING_ANSWERS as readonly string[]).includes(kind)) {
    throw new FindingRefusal('SCHEMA_INVALID', `answer is one of ${FINDING_ANSWERS.join(', ')}`)
  }
  const note = text(p.note)
  if (kind === 'dismissed' && !note) throw new FindingRefusal('SCHEMA_INVALID', 'a dismissed finding needs the reason in `note`')
  let decision: PlanDecision | undefined
  if (kind === 'decision') {
    const id = text(p.decision)
    if (!id) throw new FindingRefusal('SCHEMA_INVALID', 'a finding put to the client names the decision in `decision`')
    decision = fields.decisions.find((d) => d.id === id)
    if (!decision) {
      if (!text(p.title)) {
        throw new FindingRefusal('UNKNOWN_DECISION', `the plan has no decision ${JSON.stringify(id)}; to add one, give it a title`)
      }
      decision = { id, title: text(p.title), area: LENS_AREA[finding.lens], tier: 'concept', state: 'open', compared: false }
      fields.decisions.push(decision)
    } else if (!['chosen', 'delegated', 'parked'].includes(decision.state)) {
      decision.state = 'open'
    }
  }
  finding.answer = { kind, ...(note ? { note } : {}), ...(decision ? { decision: decision.id } : {}), at }
  const settled = run.findings.every((f) => f.answer)
  const recheck =
    settled &&
    run.trigger !== RECHECK &&
    run.findings.some((f) => f.severity === 'high' && f.answer?.kind === 'fixed')
  if (recheck) critiqueFallsDue(fields, RECHECK, at, run.id)
  return { finding, ...(decision ? { decision } : {}), recheck }
}

/** What the plan holds that the critic reads: the brief and the board, not the conversation. */
export interface CriticSource extends HasCritique {
  brief: Record<string, unknown>
  board?: Parameters<typeof boardOf>[0]['board']
  comps_note?: string
}

const show = (v: unknown): string => (typeof v === 'string' ? v : JSON.stringify(v))

/**
 * The brief the critic is handed, from the plan alone ([[REQ-427]] item 2): the
 * business as the client described it, the positioning card and whether the
 * client confirmed it, the notes they hearted, the decisions, the comps'
 * conventions and the previous critique's findings with their answers.
 */
export function criticBrief(fields: CriticSource, opts: { pages: string[]; focus?: string }): string {
  const lines: string[] = ['# The brief']
  const brief = Object.entries(fields.brief ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
  lines.push(...(brief.length ? brief.map(([k, v]) => `- ${k}: ${show(v)}`) : ['- (the client has not described the business yet)']))
  const board = boardOf({ board: fields.board })
  const card = board.positioning
  lines.push('', '# Positioning card')
  if (!card) lines.push('None written.')
  else {
    const status = card.fallback
      ? 'the recorded fallback (nothing distinctive yet)'
      : card.heart || card.edited
        ? 'confirmed by the client'
        : 'NOT confirmed by the client'
    lines.push(`Status: ${status}.`, ...card.lines.map((l) => `- ${l.kind}${l.customer ? ` (${l.customer})` : ''}: ${l.text}`))
  }
  const hearted = liveNotes(board).filter((n) => n.reaction === 'heart')
  lines.push('', '# Notes the client hearted', ...(hearted.length ? hearted.map((n) => `- ${n.text}`) : ['None.']))
  if (board.headline && Object.keys(board.headline).length) lines.push('', '# Headline on the story board', show(board.headline))
  lines.push(
    '',
    '# Decisions',
    ...fields.decisions.map((d) => `- ${d.title} [${d.area}, ${d.state}]${d.value ? `: ${d.value}` : ''}${d.answer ? ` — the client said "${d.answer.quote}"` : ''}`),
  )
  if (fields.comps_note) lines.push('', '# The comparison sites, as the consultant summed them up', fields.comps_note)
  const previous = latestRun(fields)
  if (previous) {
    lines.push('', `# Your previous review (${previous.id}): ${previous.verdict}`)
    for (const f of previous.findings) {
      const a = f.answer
      lines.push(`- ${findingLine(f)} → ${a ? `${a.kind}${a.note ? `: ${a.note}` : ''}${a.decision ? ` (decision ${a.decision})` : ''}` : 'not answered'}`)
    }
  }
  lines.push('', '# What you are looking at', `The pages pictured below: ${opts.pages.join(', ') || 'none'}, each at ${CRITIC_WIDTHS.map((w) => `${w.name} (${w.width}px)`).join(', ')}.`)
  if (opts.focus) lines.push(`The consultant asks you to look hardest at: ${opts.focus}`)
  return lines.join('\n')
}
