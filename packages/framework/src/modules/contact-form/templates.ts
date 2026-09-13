/**
 * Which message a `contact-form` instance says it sends ([[REQ-243]]).
 *
 * A READER AND NOT A SECOND CONTRACT. `config.template` is declared in
 * `meta.ts`; this file is the one place that knows how to find every declaration
 * of it on a stored page, so that the two callers who need to — the publish
 * check and anything else that has to survey a site — ask the same question and
 * get the same answer.
 *
 * IT LIVES IN THE MODULE BECAUSE THE MODULE ID AND THE CONFIG KEY ARE ITS OWN.
 * `publishSite` is in `tools/generate` and has no business holding the string
 * `'contact-form'`: a literal there is a second answer to *which module gates a
 * download*, and the half that drifts is whichever one the next module is not
 * added to. `builder/contact-events.js` and `fields.ts` are the same shape of
 * decision — a vocabulary three parties agree on, written once where it is
 * declared.
 *
 * IT READS DEFENSIVELY AND NEVER THROWS. What it is handed is a stored page: a
 * JSON blob out of a draft or a frozen revision, whose shape the contract
 * governs at the write and cannot govern retrospectively. A malformed module
 * list yields no refs rather than an exception, because a publish that died on
 * a bad page could not tell the author which page it was.
 */

/** The `contact-form` config key naming the message a submission sends. */
export const CONTACT_FORM_TEMPLATE_KEY = 'template'

/** One form on one page, and the template it names. */
export interface ContactFormTemplateRef {
  /**
   * The instance's id — what the form is CALLED, and what a refusal must name.
   *
   * An author looking at a page sees a form, not a module index; "the form
   * `beta-signup` names a template that does not exist" is actionable where
   * "modules[2]" sends them counting. The index is carried alongside for the
   * path, which is a different job.
   */
  instanceId: string
  /** Its position in the page's module list, for a machine-followable path. */
  index: number
  /** The key it names. Never empty — a form naming nothing yields no ref. */
  templateKey: string
}

/** A page's module list, narrowed out of whatever the store handed back. */
function instancesOf(page: unknown): Array<Record<string, unknown>> {
  if (!page || typeof page !== 'object') return []
  const modules = (page as Record<string, unknown>).modules
  if (!Array.isArray(modules)) return []
  return modules.map((m) => (m && typeof m === 'object' ? (m as Record<string, unknown>) : {}))
}

/**
 * Every `contact-form` on this page that names a template, in page order.
 *
 * A FORM NAMING NOTHING IS ABSENT RATHER THAN PRESENT-AND-EMPTY. Naming no
 * template is capture with no mail — an ordinary, intended configuration
 * ([[REQ-243]] §2) — so there is nothing for a caller to check and a ref would
 * be a thing every caller has to remember to skip.
 */
export function contactFormTemplateRefs(page: unknown): ContactFormTemplateRef[] {
  const refs: ContactFormTemplateRef[] = []
  instancesOf(page).forEach((instance, index) => {
    if (instance.type !== 'contact-form') return
    const config = instance.config
    if (!config || typeof config !== 'object') return
    const named = (config as Record<string, unknown>)[CONTACT_FORM_TEMPLATE_KEY]
    const templateKey = typeof named === 'string' ? named.trim() : ''
    if (templateKey === '') return
    refs.push({ instanceId: String(instance.id ?? ''), index, templateKey })
  })
  return refs
}
