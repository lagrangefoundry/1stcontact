import { siteSchema } from './schema'
import { projectIssues } from './issues'
import type { Site } from './types'
import type { L1Document, L1Node } from './l1/types'
import { checkPaletteRefs, checkTextStyleRefs, validateL1 } from './l1/validate'
import { emailCopyErrors, emailTargetErrors } from './l1/email'
import { l1Children } from './l1/children'
import { carriedParts } from './parts'

/** Every node id in a document's tree. */
function nodeIds(doc: L1Document): Set<string> {
  const ids = new Set<string>()
  const walk = (node: L1Node): void => {
    if (node.id) ids.add(node.id)
    l1Children(node).forEach(walk)
  }
  walk(doc.root)
  return ids
}

/** A single structural validation failure. */
export interface ValidationError {
  /** JSON-pointer-style path to the offending node (e.g. "/pages/0/modules/1/version"). */
  path: string
  /** Human-readable explanation. */
  message: string
}

/**
 * [[BUG-220]] — what a `control` in a page's own L1 tree is refused with.
 *
 * A control paints an element its component declares, and only a component's
 * own slots are rendered with those elements in scope: in the page's tree it
 * emits nothing, whatever it names. It validated and was written, and the call
 * to action it stood for was simply absent from the page. This is a property of
 * the PAGE rather than of an L1 tree, which is why it is checked here and not in
 * `validateL1` — that envelope is also what a component's slot subtree is held
 * to, and a control is exactly what belongs there.
 */
const PAGE_CONTROL_OUTSIDE_COMPONENT =
  "a `control` node is only valid inside a component's slot; for a page-level button use a `text` node with a `link` and its own fill and padding"

/** Every `control` node in a page's own L1 tree, as an error at its path. */
function pageControlErrors(doc: L1Document): ValidationError[] {
  const errors: ValidationError[] = []
  const walk = (node: L1Node, path: string): void => {
    if (node.kind === 'control') {
      errors.push({ path, message: `${PAGE_CONTROL_OUTSIDE_COMPONENT} (control '${node.control}' renders nothing here)` })
    }
    const kids = node.kind === 'container' || node.kind === 'box' ? node.children ?? [] : []
    kids.forEach((c, i) => walk(c, `${path}/children/${i}`))
  }
  walk(doc.root, '/root')
  return errors
}

/** Discriminated-union result: success carries the typed value, failure the errors. */
export type Result<T, E> = { ok: true; value: T } | { ok: false; errors: E }

/**
 * Validate an unknown input against the site-definition schema.
 *
 * On success the returned `value` is narrowed to `Site`. On failure every Zod
 * issue is projected to a `{ path, message }` with a JSON-pointer-style path so
 * callers (including AI tool-call validators per DOC-8 §6) can self-correct.
 *
 * REQ-107 — the schema is only half the contract. `pageSchema`'s
 * `l1: l1DocumentSchema.optional()` is the *shape* check (typed axes, closed
 * enums, `.strict()` objects); the *envelope* — numeric ranges, the URL-scheme
 * allowlist, the node-count cap, geometry-track well-formedness, unique ids —
 * lives in {@link validateL1} and, until this ticket, ran only on the
 * reproduction path (fold / probes). That was backwards: a reproduced document
 * derives its values mechanically from a capture, while the *authoring* path is
 * the one with a human or an AI free-typing numbers and URLs into a JSON file.
 * So every page carrying `l1` now clears the envelope too, with the envelope's
 * paths prefixed into the page so an error points at
 * `/pages/0/l1/root/children/2/axes/fontSizePx` rather than a detached `/root/…`.
 *
 * The renderer keeps its own independent `isSafeUrl` degradation at every URL
 * sink — this is a *second* line of defence, not a replacement for the first.
 */
export function validateSite(input: unknown): Result<Site, ValidationError[]> {
  const parsed = siteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errors: projectIssues(parsed.error.issues) }
  }

  const site = parsed.data
  const errors: ValidationError[] = []
  // REQ-350 — the default style is a reference like any other.
  if (site.textDefault !== undefined && !site.textStyles?.[site.textDefault]) {
    errors.push({
      path: '/textDefault',
      message: `the default text style '${site.textDefault}' is not among the site's text styles`,
    })
  }
  site.pages.forEach((page, i) => {
    if (page.l1) {
      const envelope = validateL1(page.l1, {
        palette: site.palette,
        textStyles: site.textStyles,
        textDefault: site.textDefault,
      })
      if (!envelope.ok) {
        for (const error of envelope.errors) {
          errors.push({ path: `/pages/${i}/l1${error.path}`, message: error.message })
        }
      }
      for (const error of pageControlErrors(page.l1)) {
        errors.push({ path: `/pages/${i}/l1${error.path}`, message: error.message })
      }
      // [[REQ-247]] — an email page says only what the email target can emit,
      // and still says what it promised to say. Both run HERE rather than inside
      // `validateL1`, because both are properties of the PAGE (which target it
      // renders for, what its `email.placeholders` declares) and `validateL1`
      // is handed a document with no idea which page it came off.
      //
      // AFTER the envelope and not instead of it: an email page is an ordinary
      // L1 page first, so a colour reference that resolves to nothing or a font
      // size out of range is refused on it exactly as it is anywhere else.
      if (page.kind === 'email' && envelope.ok) {
        for (const error of emailTargetErrors(envelope.value)) {
          errors.push({ path: `/pages/${i}/l1${error.path}`, message: error.message })
        }
        for (const error of emailCopyErrors(page.email?.placeholders, envelope.value)) {
          errors.push({ path: `/pages/${i}${error.path}`, message: error.message })
        }
      }
    }
    // REQ-114 — a behavior module's `slots` are L1 subtrees too (DOC-25 §1), so a
    // colour reference can live there just as easily as in the page's own L1
    // document. They are not envelope-validated here (the framework's
    // `validateBehaviorSlots` owns that), but a dangling reference must still be
    // caught before render: `resolveL1Color` throws rather than falling back.
    page.modules.forEach((instance, m) => {
      if (!instance.slots) return
      checkPaletteRefs(instance.slots, site.palette, `/pages/${i}/modules/${m}/slots`, errors)
      checkTextStyleRefs(instance.slots, site.textStyles, `/pages/${i}/modules/${m}/slots`, errors)
    })
  })

  /*
   * [[REQ-422]] — A PAGE AND THE PARTS IT CARRIES ARE ONE HTML DOCUMENT, so a node
   * id is a DOM id across all three. A `logo` in the header and a `logo` on a page
   * would break the anchor and every `for`/`id` pairing on that page; each
   * document's own validation cannot see it, so it is refused here, naming both.
   */
  site.pages.forEach((page, i) => {
    if (!page.l1) return
    const own = nodeIds(page.l1)
    for (const [part, shared] of Object.entries(carriedParts(page, site.pages))) {
      const clash = [...nodeIds(shared!.l1 as L1Document)].filter((id) => own.has(id))
      if (clash.length === 0) continue
      errors.push({
        path: `/pages/${i}/l1`,
        message:
          `page '${page.id}' and the site ${part} it is drawn with both use the id${clash.length > 1 ? 's' : ''} ` +
          `${clash.map((id) => `'${id}'`).join(', ')} — ids must be unique on the page a reader sees; rename one`,
      })
    }
  })

  return errors.length === 0 ? { ok: true, value: site } : { ok: false, errors }
}
