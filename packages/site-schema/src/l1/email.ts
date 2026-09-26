/**
 * The **email render target** — what L1 is allowed to say on a page that is
 * mailed rather than served ([[REQ-247]] §3).
 *
 * ONE L1, TWO TARGETS. The authoring model does not fork: an email page is an
 * ordinary page carrying an ordinary L1 document, reached by the same
 * `get_l1` / `set_l1` an author already holds. What differs is where the bytes
 * end up — a mail client rather than a browser — and a mail client is a far
 * poorer renderer than any browser has been for twenty years. It has no
 * flexbox, no custom properties, no web fonts, no `position`, and in the worst
 * of them no external stylesheet at all.
 *
 * SO THE SUBSET IS DECLARED DATA AND NOT PROSE, which is the whole of this
 * file. Documentation drifts from a renderer; a declaration cannot. Because the
 * allowed set is a value:
 *
 *   - the site validator refuses an axis the email emitter cannot emit, at the
 *     moment it is written rather than at the moment somebody receives the
 *     mail;
 *   - the tool surface PROJECTS it, so what the assistant is told it may use is
 *     read off the same constant the refusal is computed from and the two
 *     cannot disagree;
 *   - widening it later is adding an entry here and teaching the emitter one
 *     more property — never a documentation edit that nothing checks.
 *
 * IT IS AN ALLOW-LIST AND NOT A DENY-LIST, deliberately. L1 grows; a deny-list
 * would silently admit every axis added after it was written, and the first
 * report of that would be a recipient looking at a broken message. A new axis
 * is refused on an email page until somebody has taught the email emitter to
 * emit it, which is the correct default.
 *
 * (The FALLBACK FONT STACKS are not here. They are an emission detail — which
 * literal families a handle degrades to — and live with the emitter in
 * `@1stcontact/framework`. What lives here is what may be SAID.)
 */
import type { L1Document, L1Node } from './types'
import type { ValidationError } from '../validate'

/**
 * The email target, as data.
 *
 * Every member is a set of key names drawn verbatim from `l1/schema.ts`, so a
 * rename there that is not mirrored here fails the parity test rather than
 * silently widening or narrowing what an email may carry.
 */
export interface L1EmailTarget {
  /** The node kinds an email may contain. */
  readonly kinds: readonly string[]
  /** The node-level axis groups (the ones every kind carries). */
  readonly nodeAxes: readonly string[]
  /** The painted-surface axes, shared by every box-rendering kind. */
  readonly surfaceAxes: readonly string[]
  /** The type axes a `text` (and its runs) may carry, beyond the surface set. */
  readonly textAxes: readonly string[]
  /** The axes an `image` may carry, beyond the surface set. */
  readonly imageAxes: readonly string[]
  /** A `container`'s own fields, beyond `kind`/`id`/`children`/`axes`. */
  readonly containerAxes: readonly string[]
  /** The layout modes a `container` may resolve to. */
  readonly layouts: readonly string[]
  /** The main-axis distributions a `row` may ask for. */
  readonly distributions: readonly string[]
  /** The navigation / disclosure roles a node may carry. */
  readonly roles: readonly string[]
  /** The document's own keys, the element tree excluded. */
  readonly documentKeys: readonly string[]
}

/**
 * What an email page may say.
 *
 * THE OMISSIONS ARE THE CONTENT OF THIS CONSTANT, so each family is justified
 * where it is left out rather than in a comment somewhere else:
 *
 *   - `slot` and `control` — a behaviour has no meaning in a message. There is
 *     no JavaScript, no form post and no carousel in an inbox, and a `control`
 *     node paints an element a mounted module declared, of which there are
 *     none. An email page carries no behaviour modules at all (the site
 *     validator refuses them), so these kinds could only ever render inert.
 *   - `geometry`, `transform`, `mask`, `responsivePadding` — absolute placement
 *     and CSS transforms are the first things a mail client drops, and a
 *     document whose layout depends on them does not degrade, it collapses.
 *     Flow is the only layout an email can rely on.
 *   - `interaction`, `reveal`, `visibility` — there is no hover, no scroll
 *     observer and no media query worth trusting in a message.
 *   - `surfaceGradient`, `pattern`, `backgroundImageUrl`, `pointerAccent`,
 *     `overlay`, `boxShadow`, `backdropBlur`, `filter`, `blendMode`, `opacity`
 *     — background images are stripped by Outlook outright, and every other
 *     member of this family is a paint effect that either does nothing or
 *     paints something the author did not author.
 *   - `gradientFill`, `textShadow`, `fontVariantCaps`, `listMarker`,
 *     `nowrapFromPx` — the same argument on the type axes.
 *   - `objectFit` / `objectPosition` — `object-fit` is not supported; an image
 *     in a message is sized by its own `width` and nothing else.
 *   - `dialog`, `action` and `zoom` — an overlay is a script, and there is no
 *     script; a picture that cannot be opened large is a picture that silently
 *     ignores the one field asking it to be.
 *   - `resources` and `column` on the document — a web font does not load in a
 *     mail client (which is why the emitter degrades a family to a real stack),
 *     and a shared centred column exists to be referred to by `geometry`,
 *     which is not here.
 *
 * WHAT IS PRESENT IS WHAT A TABLE-AND-INLINE-STYLES EMITTER CAN ACTUALLY
 * HONOUR: boxes and stacks and rows, words with a size, a weight, a colour and
 * an alignment, pictures with a width, a fill behind a box, a border, a
 * padding, and a link.
 */
export const L1_EMAIL_TARGET: L1EmailTarget = {
  kinds: ['box', 'container', 'text', 'image'],
  nodeAxes: ['padding', 'sizing'],
  surfaceAxes: ['surfaceFill', 'border', 'borderRadiusPx'],
  textAxes: [
    'color',
    'fontFamily',
    'fontSizePx',
    'fontWeight',
    'lineHeightPx',
    'letterSpacingPx',
    'textAlign',
    'textTransform',
    'fontStyle',
    'textDecoration',
  ],
  imageAxes: [],
  containerAxes: ['layout', 'gapPx', 'distribution', 'align'],
  layouts: ['stack', 'row'],
  // `between` and `around` are omitted because a table cannot honour them: they
  // are flex distributions with no `align`-attribute equivalent, and emitting
  // the nearest thing would be the renderer silently deciding a layout the
  // author asked for something else.
  distributions: ['start', 'center', 'end'],
  roles: ['link'],
  documentKeys: ['widths', 'background', 'textColor'],
}

/** Every role key a node may carry, so an unlisted one is refused by name. */
const ALL_ROLES = ['link', 'dialog', 'action', 'zoom'] as const

/** The node-level axis groups, so an unlisted one is refused by name. */
const ALL_NODE_AXES = [
  'geometry',
  'sizing',
  'visibility',
  'transform',
  'mask',
  'padding',
  'responsivePadding',
  'interaction',
  'reveal',
] as const

/** A `container`'s own fields, so an unlisted one is refused by name. */
const ALL_CONTAINER_AXES = [
  'layout',
  'responsiveLayout',
  'wrap',
  'gapPx',
  'columns',
  'distribution',
  'align',
  'staggerMs',
] as const

/**
 * Every axis an email page may not carry, in the words the refusal uses.
 *
 * DERIVED FROM THE ALLOW-LIST RATHER THAN LISTED BESIDE IT. A second list would
 * be a second answer to the same question, and the half that drifts is whichever
 * one the next axis is not added to — which is exactly the failure this file's
 * header says a declaration exists to prevent.
 */
function refused(all: readonly string[], allowed: readonly string[]): Set<string> {
  return new Set(all.filter((key) => !allowed.includes(key)))
}

const REFUSED_NODE_AXES = refused(ALL_NODE_AXES, L1_EMAIL_TARGET.nodeAxes)
const REFUSED_ROLES = refused(ALL_ROLES, L1_EMAIL_TARGET.roles)
const REFUSED_CONTAINER_AXES = refused(ALL_CONTAINER_AXES, L1_EMAIL_TARGET.containerAxes)

/** The words a refusal is stated in, once, so every caller says the same thing. */
export const L1_EMAIL_RULES = {
  axis: 'an email page cannot carry this — a mail client has no flexbox, no custom properties and no web fonts, so only the axes the email target declares are emitted',
  kind: `an email page may contain only ${L1_EMAIL_TARGET.kinds.join(', ')}`,
  layout: `an email page lays out in ${L1_EMAIL_TARGET.layouts.join(' or ')} only`,
  distribution: `an email row distributes ${L1_EMAIL_TARGET.distributions.join(', ')} only`,
  singleWidth:
    'an email page is authored at ONE width — a mail client has no viewport to ' +
    'respond to, so a ladder of widths would name samples nothing ever renders at',
  documentKey: `an email document carries only ${L1_EMAIL_TARGET.documentKeys.join(', ')}`,
} as const

/** Children of a node that nests, or none. */
function childrenOf(node: L1Node): readonly L1Node[] {
  return node.kind === 'container' || node.kind === 'box' ? node.children ?? [] : []
}

/**
 * Which axes of a node's `axes` bag this kind may carry.
 *
 * A `text` and a `control` share one axis bag in the schema; only `text` is on
 * the email target, so this reads the kind rather than the bag.
 */
function allowedPaintAxes(kind: string): readonly string[] {
  if (kind === 'text') return [...L1_EMAIL_TARGET.surfaceAxes, ...L1_EMAIL_TARGET.textAxes]
  if (kind === 'image') return [...L1_EMAIL_TARGET.surfaceAxes, ...L1_EMAIL_TARGET.imageAxes]
  return L1_EMAIL_TARGET.surfaceAxes
}

/**
 * Every way this document exceeds what the email target can emit.
 *
 * REPORTS ALL OF THEM AND NOT THE FIRST. A page written against the web target
 * and moved to an email will breach several axes at once, and an author — human
 * or assistant — correcting them one refusal at a time is the shape of loop
 * this product exists to remove.
 *
 * PATHS ARE JSON POINTERS ROOTED AT THE DOCUMENT, matching what `validateL1`
 * emits, so `validateSite` can prefix them into the page identically and the
 * caller gets one vocabulary of location for every kind of refusal.
 */
export function emailTargetErrors(doc: L1Document): ValidationError[] {
  const errors: ValidationError[] = []

  if (doc.widths.length !== 1) {
    errors.push({ path: '/widths', message: L1_EMAIL_RULES.singleWidth })
  }

  for (const key of Object.keys(doc)) {
    if (key === 'root') continue
    if (L1_EMAIL_TARGET.documentKeys.includes(key)) continue
    errors.push({ path: `/${key}`, message: `${L1_EMAIL_RULES.documentKey} — '${key}' is not one of them` })
  }

  const walk = (node: L1Node, path: string): void => {
    if (!L1_EMAIL_TARGET.kinds.includes(node.kind)) {
      errors.push({ path: `${path}/kind`, message: `${L1_EMAIL_RULES.kind} — '${node.kind}' is not one of them` })
      return
    }
    const bag = node as unknown as Record<string, unknown>
    for (const key of REFUSED_NODE_AXES) {
      if (bag[key] !== undefined) errors.push({ path: `${path}/${key}`, message: L1_EMAIL_RULES.axis })
    }
    for (const key of REFUSED_ROLES) {
      if (bag[key] !== undefined) errors.push({ path: `${path}/${key}`, message: L1_EMAIL_RULES.axis })
    }
    // BUG-18's per-width type tracks and REQ-211's per-run axes are the two
    // places a refused axis can hide below `axes`, so both are read rather than
    // only the bag the name suggests.
    if (bag.responsive !== undefined) {
      errors.push({ path: `${path}/responsive`, message: L1_EMAIL_RULES.axis })
    }
    const allowed = allowedPaintAxes(node.kind)
    const axes = (bag.axes ?? {}) as Record<string, unknown>
    for (const key of Object.keys(axes)) {
      if (allowed.includes(key)) continue
      errors.push({ path: `${path}/axes/${key}`, message: L1_EMAIL_RULES.axis })
    }
    if (node.kind === 'text' && Array.isArray(node.text)) {
      node.text.forEach((run, i) => {
        for (const key of Object.keys(run.axes ?? {})) {
          if (allowed.includes(key)) continue
          errors.push({ path: `${path}/text/${i}/axes/${key}`, message: L1_EMAIL_RULES.axis })
        }
      })
    }
    if (node.kind === 'container') {
      for (const key of REFUSED_CONTAINER_AXES) {
        if (bag[key] !== undefined) errors.push({ path: `${path}/${key}`, message: L1_EMAIL_RULES.axis })
      }
      if (!L1_EMAIL_TARGET.layouts.includes(node.layout)) {
        errors.push({
          path: `${path}/layout`,
          message: `${L1_EMAIL_RULES.layout} — '${node.layout}' is not one of them`,
        })
      }
      if (node.distribution && !L1_EMAIL_TARGET.distributions.includes(node.distribution)) {
        errors.push({
          path: `${path}/distribution`,
          message: `${L1_EMAIL_RULES.distribution} — '${node.distribution}' is not one of them`,
        })
      }
    }
    childrenOf(node).forEach((child, i) => walk(child, `${path}/children/${i}`))
  }
  walk(doc.root, '/root')
  return errors
}

// ── The token grammar ────────────────────────────────────────────────────────
//
// IT LIVES HERE BECAUSE TWO PARTIES NOW AGREE ON IT. It was declared once, in
// the sender, while the only copy a token could appear in was a template ticket
// the sender read. Since an email page carries its own `placeholders`, the site
// validator has to ask the same question about the same words — *does this copy
// contain the tokens it promises* — and a second regular expression written
// beside it would be a second answer, free to disagree about whitespace or about
// what a name may contain.

/**
 * The token grammar: `{{name}}`, with optional inner whitespace.
 *
 * DELIBERATELY NARROW. Anything richer — a filter pipeline, a conditional, a
 * loop — is a template *language*, which is a thing to maintain and a thing an
 * operator can get wrong in ways something would then have to report on. The
 * whole contract is substitution, and its value is that it either happens
 * completely or it refuses.
 */
export const EMAIL_TOKEN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g

/** Every token that actually appears in a piece of copy, in order, deduplicated. */
export function emailTokensIn(text: string): string[] {
  const found: string[] = []
  for (const m of text.matchAll(EMAIL_TOKEN)) {
    if (!found.includes(m[1])) found.push(m[1])
  }
  return found
}

/**
 * A declared token's bare name, tolerant of both spellings.
 *
 * An author declaring a placeholder will write `cta_url` or `{{cta_url}}` about
 * equally often, and refusing one of them would be a contract about punctuation
 * rather than about content.
 */
export function emailTokenName(entry: unknown): string {
  return String(entry).trim().replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '')
}

/** The declared tokens of an email page, normalised and deduplicated. */
export function declaredEmailTokens(declared: readonly unknown[] | undefined): string[] {
  const out: string[] = []
  for (const entry of declared ?? []) {
    const name = emailTokenName(entry)
    if (name !== '' && !out.includes(name)) out.push(name)
  }
  return out
}

/**
 * Every word an email page's document actually says, in document order.
 *
 * WHAT IT IS FOR is the declaration check below, and that is the whole of why it
 * concatenates rather than returning a list: a token cannot span two runs (the
 * grammar has no way to express half of one), so the question *does this copy
 * contain `{{cta_url}}`* is answered identically by one string and by a list,
 * and one string is the cheaper thing to match against.
 *
 * A LINK'S `href` COUNTS AS COPY HERE, and it has to. The one token whose
 * absence is fatal is the call to action, and the ordinary way to write a call
 * to action is a button whose words say "Open your download" and whose `href` is
 * `{{cta_url}}` — so a check that read only the visible words would pass a
 * message whose button is the thing that is broken.
 */
export function emailBodyText(doc: L1Document): string {
  const parts: string[] = []
  const walk = (node: L1Node): void => {
    if (node.kind === 'text') {
      parts.push(typeof node.text === 'string' ? node.text : node.text.map((r) => r.text).join(''))
    }
    const link = (node as unknown as Record<string, unknown>).link as { href?: string } | undefined
    if (link?.href) parts.push(link.href)
    if (node.kind === 'image') parts.push(node.src, node.alt)
    childrenOf(node).forEach(walk)
  }
  walk(doc.root)
  return parts.join('\n')
}

/**
 * Whether an email page still says what it promised to say ([[REQ-247]] AC-12).
 *
 * REFUSED WHEN IT IS WRITTEN, NOT WHEN IT IS SENT. The sender refuses a render
 * whose copy has lost a declared token, and always has ([[REQ-197]]) — but that
 * refusal arrives at the moment somebody is waiting for mail, by which time the
 * edit that caused it is hours old and the operator is not looking. An email
 * page is validated like every other page on every write, so the same rule can
 * be enforced at the keystroke: a `set_l1` that would drop `{{cta_url}}` out of
 * a message whose delivery depends on it leaves the draft byte-unchanged.
 *
 * THE UNDECLARED DIRECTION IS NOT CHECKED HERE and is deliberately left to the
 * send. A token the author has typed but not yet declared is a message in
 * progress, and refusing it would make writing the body before the declaration
 * impossible; the render refuses any token left unsubstituted, declared or not,
 * so nothing reaches a recipient with a hole in it either way.
 */
export function emailCopyErrors(
  declared: readonly unknown[] | undefined,
  doc: L1Document,
): ValidationError[] {
  const present = emailTokensIn(emailBodyText(doc))
  const errors: ValidationError[] = []
  // Indexed against what the author WROTE, not against the missing ones, so the
  // pointer lands on the declaration they would edit.
  declaredEmailTokens(declared).forEach((token) => {
    if (present.includes(token)) return
    const at = (declared ?? []).findIndex((entry) => emailTokenName(entry) === token)
    errors.push({
      path: `/email/placeholders/${at < 0 ? 0 : at}`,
      message:
        `this message declares {{${token}}} and its copy no longer contains it — ` +
        'the message would go out with a hole where the token was, so the change is refused',
    })
  })
  return errors
}
