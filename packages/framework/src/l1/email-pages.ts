/**
 * Which pages of a site are MESSAGES, and what naming a missing one says
 * ([[REQ-247]] §4).
 *
 * A READER AND A SENTENCE, AND NOT A SECOND CONTRACT — the same shape, and the
 * same argument, as `contact-form/templates.ts`. Four parties now have to ask
 * *which email pages does this site hold*: the operation that configures a form,
 * the publish check, the send, and the tool surface that lists pages. A literal
 * `page.kind === 'email'` in each is four answers to one question, and the half
 * that drifts is whichever one the next caller is not added to.
 *
 * IT READS DEFENSIVELY AND NEVER THROWS, for the reason the template reader
 * does. What it is handed is a STORED page — a JSON blob out of a draft or a
 * frozen revision, whose shape the contract governs at the write and cannot
 * govern retrospectively. A malformed page yields no email pages rather than an
 * exception, because a publish that died on a bad page could not tell the author
 * which page it was.
 *
 * IT LIVES BESIDE THE L1 RENDER RATHER THAN IN THE MODULE because an email page
 * is a property of the SITE, not of `contact-form`. A form is merely the first
 * thing that names one.
 */

/** One email page of a site, as anything surveying it needs to see it. */
export interface EmailPageRef {
  /** The page's id — what a form's `config.template` names. */
  id: string
  /** Its title, for a refusal that has to list what exists. */
  title: string
  /** Its subject line. Empty when the page declares none. */
  subject: string
  /** The tokens its copy promises to carry. */
  placeholders: string[]
}

/** One entry of whatever the store handed back, narrowed. */
function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/**
 * The page definitions out of a stored page list.
 *
 * TWO SHAPES REACH THIS AND BOTH ARE ORDINARY. The site store hands back
 * `{ name, page }` records; a parsed `Site` hands back the definitions
 * themselves. Asking each caller to unwrap first would put the same two-line
 * `.map` at every call site, which is where a reader like this stops being one
 * answer to the question.
 */
function definitionsOf(pages: unknown): Record<string, unknown>[] {
  if (!Array.isArray(pages)) return []
  const out: Record<string, unknown>[] = []
  for (const entry of pages) {
    const record = asRecord(entry)
    if (!record) continue
    out.push(asRecord(record.page) ?? record)
  }
  return out
}

/** Every email page this site holds, in page order. */
export function emailPagesOf(pages: unknown): EmailPageRef[] {
  const out: EmailPageRef[] = []
  for (const page of definitionsOf(pages)) {
    if (page.kind !== 'email') continue
    const email = asRecord(page.email) ?? {}
    const declared = Array.isArray(email.placeholders) ? email.placeholders : []
    out.push({
      id: String(page.id ?? ''),
      title: String(page.title ?? ''),
      subject: String(email.subject ?? ''),
      placeholders: declared.map((entry) => String(entry)),
    })
  }
  return out
}

/** One email page of this site by id, or null. */
export function emailPageOf(pages: unknown, id: string): Record<string, unknown> | null {
  for (const page of definitionsOf(pages)) {
    if (page.kind === 'email' && String(page.id ?? '') === id) return page
  }
  return null
}

/**
 * Why this site's forms may not send `templateKey`, or null if they may.
 *
 * A SENTENCE AND NOT A CODE, because every caller puts it in front of a person:
 * at configure it is the refusal the assistant reads mid-edit, at publish it is
 * the validation error the toolbar shows, at the send it is a log line an
 * operator reads while wondering where a mail went.
 *
 * IT NAMES WHAT EXISTS AND WHAT MAKES A NEW ONE, which is the difference between
 * a refusal and an obstacle. "No such message" sends an author hunting; "the
 * site has `welcome` and `whitepapers`, and `add_page` with kind `email` makes
 * another" is a refusal they can act on inside the same turn — and it is the
 * whole of why this refusal moved from publish to the moment of the act.
 *
 * A CREDENTIAL MESSAGE IS NOT IN THE LIST AND CANNOT BE, which is [[REQ-247]]
 * §4's structural answer to [[REQ-243]] §4's check. `invite` and `signin` are
 * business-scoped templates and not pages of any site, so a form naming one
 * meets exactly this refusal — not a special case that could be forgotten, but
 * the ordinary answer to naming something that is not an email page.
 */
export function emailPageRefusal(
  templateKey: string,
  available: readonly EmailPageRef[],
): string | null {
  if (available.some((page) => page.id === templateKey)) return null
  const held = available.map((page) => `'${page.id}'`).join(', ')
  return (
    `this site has no email page '${templateKey}'. ` +
    (held === ''
      ? 'It has none at all — make one with add_page, kind: email.'
      : `It holds ${held}. Name one of those, or make another with add_page, kind: email.`)
  )
}
