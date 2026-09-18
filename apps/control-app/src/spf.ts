/**
 * **SPF, merged and never appended** ([[REQ-260]]).
 *
 * THE FAILURE THIS MODULE EXISTS TO MAKE UNREACHABLE. Two `v=spf1` records on
 * one name is not a degraded configuration, it is a hard failure: a receiver
 * that finds two policies for a name treats the result as `permerror` and mail
 * from that name stops being accepted anywhere. It is also the single most
 * common way this goes wrong — [[TODO-5]] records it happening to us twice —
 * and it goes wrong in the direction that is invisible from here, because the
 * zone looks fine and the symptom lands in somebody else's inbox.
 *
 * SO THE RULE IS THE ONE `MAIL.md` STATES: **same name → merge. Different names
 * → leave both.** *"Merge on the apex; never delete `send.`'s."* A sender's
 * include is folded into whatever policy is already at that name, and a policy
 * at a different name is somebody else's business and is not touched.
 *
 * IT IS A PURE MODULE. No Cloudflare, no D1, no resolver — the merge is a string
 * transformation over a record's value, and every dangerous case is therefore a
 * case a test can state in one line. What decides WHICH name is merged, and what
 * writes the answer, is `dns-ops.ts`.
 *
 * WHAT IT DELIBERATELY DOES NOT DO:
 *
 *   - **It does not flatten.** Resolving an `include:` into the addresses it
 *     currently names produces a policy that is correct today and wrong the
 *     morning the provider changes their infrastructure, with nobody here
 *     watching. An include is the provider's promise to keep it true.
 *   - **It does not tighten.** `~all` is not turned into `-all`, and a policy
 *     that ends in `?all` keeps it. Tightening a policy on a domain we did not
 *     start from zero starts rejecting mail somebody else is sending, which is
 *     the same harm `_dmarc` can do and is the reason both rules are in this
 *     ticket rather than in whichever caller remembered.
 *   - **It does not reorder.** Mechanism order is significant to an evaluator,
 *     so the merge appends the new include immediately before the `all` and
 *     leaves everything ahead of it exactly where the author put it.
 */

/** A `v=spf1` policy, as this module reads one. */
export interface SpfPolicy {
  /** Every term between `v=spf1` and the `all` mechanism, in order. */
  terms: string[]
  /** The `all` mechanism with its qualifier — `~all`, `-all`, `?all` — or null. */
  all: string | null
}

/** Whether a record's value is an SPF policy. Case-insensitive, as receivers are. */
export function isSpf(value: string): boolean {
  return /^v=spf1(\s|$)/i.test(value.trim())
}

/**
 * Read a policy.
 *
 * WHITESPACE IS THE ONLY SEPARATOR SPF HAS, and a `TXT` value split across
 * several quoted strings is joined with none — so a value arriving as
 * `"v=spf1 include:a" " include:b"` is already joined by whoever unquoted it
 * and this only has to tolerate the run of spaces that leaves.
 */
export function parseSpf(value: string): SpfPolicy {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter((part) => part !== '')
  // The version term is not a mechanism and is re-emitted rather than carried.
  const rest = parts.slice(1)
  const terms: string[] = []
  let all: string | null = null
  for (const part of rest) {
    if (/^[+\-~?]?all$/i.test(part)) {
      // THE FIRST `all` WINS, because that is what an evaluator does: everything
      // after it is unreachable. Keeping the first and dropping the rest is the
      // only reading that cannot change what the policy means.
      if (all === null) all = part
      continue
    }
    terms.push(part)
  }
  return { terms, all }
}

/** Write a policy back out. The inverse of {@link parseSpf} for anything it read. */
export function formatSpf(policy: SpfPolicy): string {
  return ['v=spf1', ...policy.terms, ...(policy.all ? [policy.all] : [])].join(' ')
}

/**
 * The policy a name should hold once this sender is allowed to send from it.
 *
 * ONE RECORD OUT, ALWAYS. The signature takes the value that is already at the
 * name — or `null` where there is none — and answers the value that should be
 * there afterwards. There is no shape of this function that can produce two
 * records, which is the whole point of it being the only way `dns-ops.ts` writes
 * an SPF value.
 *
 * IT IS IDEMPOTENT. An include already present, in any case, is not added again
 * — so a customer who asks twice, or an operation retried after a partial
 * failure, ends with the policy they had rather than with a duplicate term.
 *
 * THE DEFAULT FOR A NAME WITH NO POLICY IS `~all`, and it is a SOFT fail
 * deliberately. A brand-new policy that ended `-all` would tell receivers to
 * reject everything this product does not know about — including mail the
 * customer's other provider sends and nobody has told us about yet.
 */
export function mergeSpfInclude(existing: string | null, include: string): string {
  const term = `include:${include.toLowerCase()}`
  if (existing === null || existing.trim() === '') {
    return formatSpf({ terms: [term], all: '~all' })
  }
  const policy = parseSpf(existing)
  if (policy.terms.some((part) => part.toLowerCase() === term)) return formatSpf(policy)
  return formatSpf({ terms: [...policy.terms, term], all: policy.all ?? '~all' })
}

/** Whether a policy already permits this sender. */
export function spfAllows(value: string, include: string): boolean {
  return parseSpf(value).terms.some(
    (part) => part.toLowerCase() === `include:${include.toLowerCase()}`,
  )
}

/**
 * Two policies at one name — the state this module exists to prevent and
 * therefore the one it must refuse to work on.
 *
 * WHY A REFUSAL RATHER THAN A REPAIR. Merging three policies into one is a
 * judgement about which of two authors was right, and this product did not write
 * either of them. The honest answer is to leave the zone alone and say so — the
 * customer's mail is already broken and a change made on a guess can only move
 * the blame.
 */
export class SpfConflictError extends Error {
  readonly name = 'SpfConflictError'
  constructor(readonly host: string) {
    super(
      `\`${host}\` already has two conflicting email policies, so changing it ` +
        'safely is not something to do without looking.',
    )
  }
}
