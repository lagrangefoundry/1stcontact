/**
 * WHERE THE DEFECT SITS — the closed set every ticket a round files carries
 * ([[REQ-276]]).
 *
 * [[EPIC-19]] classified the 22 defects rounds 1–3 filed and found two of them
 * raised the product's ceiling; the other twenty made the ruler trustworthy.
 * Both are worth doing and they are not the same queue. That classification
 * cost a human-directed audit of ten ticket bodies after the fact, and the
 * round that filed each one knew the answer at the time and was never asked:
 * the evidence for it — which probe fired, whether the axis was measured,
 * whether the reference carries the value — is the evidence the round already
 * gathered, and it is gone the moment the round ends.
 *
 * So the round is asked, at filing time, and the answer goes in a FIELD rather
 * than in prose so that "show me the capability queue" is a filter rather than
 * a re-audit.
 *
 * ONE DECLARATION SITE. The set is here, the brief explains what each member
 * means, and the prompt is handed the list generated from this file — so a
 * round is never told a class the console will not accept. The console checks
 * every ticket it reads back against this same array.
 */

/**
 * Which queue a class belongs to — the split behaviour 3 puts on the page.
 *
 * `ruler` and `ceiling` are the two [[EPIC-19]] separated and the reason this
 * file exists. `process` is neither: a defect in the console or the brief is
 * real and worth filing and moves neither the instrument nor the product.
 * `unknown` has exactly one member, and it is deliberate — see `cannot-tell`.
 */
export type DefectQueue = 'ceiling' | 'ruler' | 'process' | 'unknown'

/** The order the queues are reported in: ceiling first, because it is the point. */
export const DEFECT_QUEUES: readonly DefectQueue[] = ['ceiling', 'ruler', 'process', 'unknown']

export interface DefectClass {
  /** The field value — lower case, hyphenated, stable. */
  id: string
  queue: DefectQueue
  /** One line, as the brief and the prompt both say it. */
  meaning: string
}

/** The ticket field the class travels in, as the round passes it to `xgd`. */
export const DEFECT_CLASS_FIELD = 'defect_class'

/**
 * The nine, in pipeline order: instrument first, then capture, fold, L1,
 * renderer, then the two that are not the engine at all.
 *
 * WHY THESE AND NOT [[EPIC-19]]'S SEVEN ROWS VERBATIM. The brief's §5 already
 * sorts every ENGINE finding into three kinds, and this set has to compose with
 * it rather than compete: §5's class 1 (engine shortfall) splits here into
 * `capture-loses-it` and `fold-wrong`, which is EPIC-19's own split; class 2 is
 * `l1-cannot-express`; class 3 is `renderer-wrong`, which has no row in EPIC-19
 * only because rounds 1–3 filed none of it. The three instrument classes have
 * no home in §5 at all — they arrive as its secondary `1c` bugs, which is nine
 * of twenty-two defects sorted by nothing.
 */
export const DEFECT_CLASSES: readonly DefectClass[] = [
  {
    id: 'instrument-blind',
    queue: 'ruler',
    meaning:
      'the instrument reported pass or clean when it measured nothing, or measured the wrong thing — the score is not wrong, it is empty',
  },
  {
    id: 'instrument-asymmetric',
    queue: 'ruler',
    meaning:
      'the two sides were measured by different procedures, so the comparison is not like for like and the difference it reports is partly its own',
  },
  {
    id: 'instrument-no-axis',
    queue: 'ruler',
    meaning:
      'the comparator has no axis for the property, so a real difference is invisible to the score rather than reported as small',
  },
  {
    id: 'capture-loses-it',
    queue: 'ruler',
    meaning:
      'the capture does not carry something the page had, so nothing downstream can recover it — the fold and the renderer are innocent',
  },
  {
    id: 'fold-wrong',
    queue: 'ruler',
    meaning: 'the capture carries it and L1 can express it, and the fold writes the wrong value',
  },
  {
    id: 'renderer-wrong',
    queue: 'ruler',
    meaning: 'L1 carries the right value and the render disagrees with it — wrong place, colour, size, order or viewport',
  },
  {
    id: 'l1-cannot-express',
    queue: 'ceiling',
    meaning:
      'there is no way to author the thing in L1 as it stands — no axis, no parameter for the variant, or a validator that refuses the value. This is the queue that raises the product ceiling',
  },
  {
    id: 'harness',
    queue: 'process',
    meaning: 'the console, this brief, the CLI or the round\'s own process — real, worth filing, and not the engine',
  },
  {
    id: 'cannot-tell',
    queue: 'unknown',
    meaning:
      'the evidence in hand does not separate the instrument from the engine. A permitted and often the honest answer — say what you would need in order to tell',
  },
]

const BY_ID = new Map(DEFECT_CLASSES.map((entry) => [entry.id, entry]))

/** Is this one of the nine? */
export function isDefectClass(id: string): boolean {
  return BY_ID.has(id)
}

/** Which queue, or `unknown` for anything not in the set. */
export function queueFor(id: string): DefectQueue {
  return BY_ID.get(id)?.queue ?? 'unknown'
}

/**
 * The classes a ticket's field carries, however it was written.
 *
 * A LIST, AND A BARE STRING IS ONE OF LENGTH ONE. The field is a list because a
 * gap ticket carries every residual a round found, ordered by dependency — if
 * issue three is `l1-cannot-express` and issue one is `fold-wrong`, a scalar
 * keyed to the leading issue hides the ceiling finding from exactly the filter
 * this exists to make possible. But most tickets carry one class and a round
 * that writes it as a plain string has not made a mistake worth a violation
 * line, so it is read as a list of one rather than rejected.
 */
export function parseDefectClasses(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value]
  const seen = new Set<string>()
  for (const entry of raw) {
    if (typeof entry !== 'string') continue
    const id = entry.trim()
    if (id) seen.add(id)
  }
  return [...seen]
}

/** The members of `classes` that are not in the set — empty in the ordinary case. */
export function unknownDefectClasses(classes: readonly string[]): string[] {
  return classes.filter((id) => !isDefectClass(id))
}

/** The set as the prompt hands it to a round, generated so it cannot drift. */
export function defectClassTable(): string {
  return DEFECT_CLASSES.map((entry) => `- \`${entry.id}\` (**${entry.queue}**) — ${entry.meaning}.`).join('\n')
}

/** One ticket a round filed, and what it said the ticket is. */
export interface ClassifiedFiling {
  /** The human-readable ticket id. */
  id: string
  classes: string[]
}

/** One class, and the tickets carrying it. */
export interface ClassGroup {
  id: string
  tickets: string[]
}

/** One queue, its classes, and how many tickets landed in it. */
export interface QueueGroup {
  queue: DefectQueue
  tickets: number
  classes: ClassGroup[]
}

/**
 * Filings grouped by queue and then by class, empty queues dropped.
 *
 * A TICKET COUNTS IN EVERY QUEUE IT TOUCHES, which is what a list-valued field
 * means: a ticket whose first issue is a fold bug and whose third cannot be
 * authored in L1 is in the capability queue, and hiding it there behind its
 * leading issue is the re-audit this whole ticket exists to avoid.
 */
export function groupByQueue(filings: readonly ClassifiedFiling[]): QueueGroup[] {
  const groups: QueueGroup[] = []
  for (const queue of DEFECT_QUEUES) {
    const classes: ClassGroup[] = []
    const tickets = new Set<string>()
    for (const entry of DEFECT_CLASSES.filter((cls) => cls.queue === queue)) {
      const carrying = filings.filter((filing) => filing.classes.includes(entry.id)).map((filing) => filing.id)
      if (!carrying.length) continue
      classes.push({ id: entry.id, tickets: carrying })
      for (const id of carrying) tickets.add(id)
    }
    if (classes.length) groups.push({ queue, tickets: tickets.size, classes })
  }
  return groups
}

/**
 * The split in one line — what a round bought, as the status line says it.
 *
 * `2 ruler (fold-wrong, instrument-blind), 1 ceiling (l1-cannot-express)`, in
 * queue order so the ceiling finding is read first when there is one. Empty
 * when nothing carried a class, so a caller can drop the clause entirely rather
 * than print a heading over nothing.
 */
export function describeSplit(filings: readonly ClassifiedFiling[]): string {
  return groupByQueue(filings)
    .map((group) => `${group.tickets} ${group.queue} (${group.classes.map((cls) => cls.id).join(', ')})`)
    .join(', ')
}
