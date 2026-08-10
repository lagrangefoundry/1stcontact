/**
 * The SVG **content** validator (REQ-130).
 *
 * Everywhere else in this package the security boundary is a closed schema over
 * structured data. An asset is not structured data — it is a file — and until
 * now that was sound: an asset was a file an operator placed on their own
 * machine, so a human vouched for the bytes and an extension check was the whole
 * of the question. `IMAGE_EXTENSIONS` accepts `svg` on exactly that footing.
 *
 * The moment a model can author the bytes, that footing is gone. An SVG is an
 * XML document the browser executes: `<script>`, `onload=`, `<foreignObject>`,
 * an external `xlink:href`. It is served same-origin from the site's own
 * `/assets/`, and it is legitimately referenced — so the renderer's URL-scheme
 * allowlist, which is the only guard an asset passes today, does not apply and
 * would not help if it did. This is a stored-XSS sink, and this file is the
 * reason a generated asset may exist at all.
 *
 * THE VALIDATOR IS CLOSED BY CONSTRUCTION, NOT BY BLOCKLIST. The document is
 * consumed by a strict scanner and **every byte must be accounted for** by a
 * token the grammar names. There is no "skip what we do not recognise" branch,
 * so a construct nobody thought of is a refusal rather than a pass — which is
 * the property that makes an allowlist worth having and the one a sanitiser
 * that strips-and-continues cannot offer. Nothing is ever rewritten: a document
 * is accepted whole or refused whole, exactly as a site definition is.
 *
 * WHAT IS DELIBERATELY REFUSED even though it is legal SVG: `<script>`, `<style>`
 * (raw CSS is the line DOC-2 draws), `<image>` and `<use>` and `<a>` (each
 * carries a reference to somewhere else), `<foreignObject>` (arbitrary HTML),
 * every `animate*` element, every `on*` attribute, `href`/`xlink:href` in any
 * form, `style`, a DOCTYPE (XXE), and any character entity but the five XML
 * names. A mark, a diagram or an icon needs none of them.
 */

/**
 * UTF-8 length, computed rather than borrowed.
 *
 * This package deliberately depends on nothing — no Node types, no DOM lib — so
 * neither `Buffer` nor `TextEncoder` is available to it, and adding either to
 * reach a byte count would be a dependency bought for one number.
 */
export function utf8Length(source: string): number {
  let bytes = 0
  for (const character of source) {
    const code = character.codePointAt(0) ?? 0
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4
  }
  return bytes
}

/** One refusal, in the shape `validateSite` errors already take. */
export interface SvgValidationError {
  /** Where in the document, as a byte offset — enough to point at the token. */
  path: string
  message: string
}

export interface SvgValidationResult {
  ok: boolean
  errors: SvgValidationError[]
}

/**
 * Byte cap. A hand-composed mark is a few kilobytes; a hundred is a payload or a
 * traced photograph, and neither is what this channel is for.
 */
export const SVG_MAX_BYTES = 64 * 1024

/**
 * Element cap, mirroring L1's node cap for the same reason: a document that
 * renders is not the same as a document that renders *quickly*, and the browser
 * is the thing being protected.
 */
export const SVG_MAX_ELEMENTS = 2000

/**
 * The elements a generated mark may use.
 *
 * Shapes, grouping, gradients, clipping, and the two accessibility elements.
 * Nothing that fetches, executes, animates, or embeds another document. `defs`
 * and the gradient family are here because a mark with a gradient is ordinary,
 * and they reference each other only by `id` — never by URL.
 */
export const SVG_ELEMENTS: ReadonlySet<string> = new Set([
  'svg',
  'g',
  'defs',
  'title',
  'desc',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'linearGradient',
  'radialGradient',
  'stop',
  'clipPath',
  'mask',
])

/**
 * The attributes those elements may carry.
 *
 * Geometry, paint and text metrics. `class` is absent because there is no
 * stylesheet to match it; `style` is absent because raw CSS is the security line
 * (DOC-2) and `url()` inside it is an external reference by another name.
 */
export const SVG_ATTRIBUTES: ReadonlySet<string> = new Set([
  // envelope
  'xmlns',
  'viewBox',
  'width',
  'height',
  'version',
  'preserveAspectRatio',
  'role',
  'aria-label',
  'aria-labelledby',
  'aria-hidden',
  // identity + local references (validated as `#id` — see below)
  'id',
  'clip-path',
  'mask',
  // geometry
  'd',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'points',
  'dx',
  'dy',
  'transform',
  'gradientUnits',
  'gradientTransform',
  'clipPathUnits',
  'maskUnits',
  'maskContentUnits',
  'offset',
  'spreadMethod',
  // paint
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-miterlimit',
  'opacity',
  'stop-color',
  'stop-opacity',
  'color',
  'paint-order',
  'vector-effect',
  // text
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'letter-spacing',
  'word-spacing',
  'text-anchor',
  'dominant-baseline',
  'xml:space',
])

/**
 * Attributes whose value is a reference. Each must be a `url(#local)` or `#local`
 * form naming an id in this same document — never a scheme, never a path.
 */
const REFERENCE_ATTRIBUTES: ReadonlySet<string> = new Set(['clip-path', 'mask', 'fill', 'stroke'])

/** A same-document reference and nothing else: `url(#name)`. */
const LOCAL_REFERENCE = /^url\(\s*#[A-Za-z_][\w.:-]*\s*\)$/

/**
 * The five entities XML itself defines. Anything else — `&#x3c;` — is refused.
 *
 * Sticky rather than anchored, like {@link TOKEN}: the scanner advances an index
 * over the source instead of re-slicing it, because slicing per character on a
 * 64 KB document is quadratic and the cap alone would not save it.
 */
const ALLOWED_ENTITY = /&(amp|lt|gt|quot|apos);/y

/**
 * Every `&` in an attribute value must open one of the five XML entities.
 *
 * Per-`&`, not per-value, and that distinction is the whole point: one allowed
 * entity must not vouch for whatever follows it. `fill="&amp;url&#x28;http://x&#x29;"`
 * carries no literal `(` at validation time, so {@link REFERENCE_ATTRIBUTES}
 * never fires on it — the external reference materialises only once the browser
 * decodes the entities. Same rule as the character-data scanner, on the same
 * sticky pattern: consume one entity at a time, refuse anything else. (Sticky
 * state is safe to share — every use sets `lastIndex` immediately before its
 * own `exec`, and neither loop reads it afterwards.)
 */
function entitiesAreAllowed(value: string): boolean {
  for (let index = value.indexOf('&'); index !== -1; index = value.indexOf('&', index + 1)) {
    ALLOWED_ENTITY.lastIndex = index
    const entity = ALLOWED_ENTITY.exec(value)
    if (!entity) return false
    index += entity[0].length - 1
  }
  return true
}

/**
 * The whole grammar, as one alternation. Order matters: a comment and a
 * processing instruction both open with `<`, so they are recognised before the
 * general tag form, and the general tag form is sticky so that an unclosed `<`
 * cannot be skipped as text.
 */
const TOKEN =
  /(?:<!--[\s\S]*?-->|<\?[^>]*\?>|<\/([A-Za-z][\w:-]*)\s*>|<([A-Za-z][\w:-]*)((?:\s+[A-Za-z_:][\w.:-]*\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>)/y

/** One attribute inside a start tag, in the same restricted form. */
const ATTRIBUTE = /([A-Za-z_:][\w.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

/**
 * Validate a generated SVG document.
 *
 * @param source The document, as text. Never a path — the caller has the bytes.
 */
export function validateSvg(source: string): SvgValidationResult {
  const errors: SvgValidationError[] = []
  const fail = (at: number, message: string): void => {
    if (errors.length < 10) errors.push({ path: `byte ${at}`, message })
  }

  const bytes = utf8Length(source)
  if (bytes > SVG_MAX_BYTES) {
    return {
      ok: false,
      errors: [{ path: 'document', message: `SVG is ${bytes} bytes; the limit is ${SVG_MAX_BYTES}.` }],
    }
  }
  if (/<!DOCTYPE/i.test(source) || /<!ENTITY/i.test(source)) {
    return {
      ok: false,
      errors: [
        {
          path: 'document',
          message: 'A DOCTYPE or entity declaration is not allowed (external entity expansion).',
        },
      ],
    }
  }

  const open: string[] = []
  let elements = 0
  let root: string | null = null
  let at = 0

  while (at < source.length) {
    const here = source[at]

    if (here !== '<') {
      // Character data. The only thing that may hide in it is an entity, so the
      // run is consumed one entity at a time rather than skipped to the next `<`.
      if (here === '&') {
        ALLOWED_ENTITY.lastIndex = at
        const entity = ALLOWED_ENTITY.exec(source)
        if (!entity) {
          fail(at, 'Only the &amp; &lt; &gt; &quot; &apos; entities are allowed.')
          return { ok: false, errors }
        }
        at += entity[0].length
        continue
      }
      if (here === '>') {
        fail(at, "A bare '>' in text is ambiguous; write it as &gt;.")
        return { ok: false, errors }
      }
      at += 1
      continue
    }

    TOKEN.lastIndex = at
    const token = TOKEN.exec(source)
    if (!token) {
      // THE CLOSURE. Everything the grammar does not name lands here — a CDATA
      // section, an unquoted attribute, a malformed tag — and is refused rather
      // than skipped. Without this branch the allowlist would be advisory.
      fail(at, 'This is not a well-formed element, comment or processing instruction.')
      return { ok: false, errors }
    }

    const [matched, closing, opening, attrs, selfClosing] = token

    if (closing !== undefined) {
      const expected = open.pop()
      if (expected !== closing) {
        fail(at, `</${closing}> does not close <${expected ?? 'nothing'}>.`)
        return { ok: false, errors }
      }
      at += matched.length
      continue
    }

    if (opening === undefined) {
      // A comment or a processing instruction: carries no element and no
      // attribute, so there is nothing further to check.
      at += matched.length
      continue
    }

    elements += 1
    if (elements > SVG_MAX_ELEMENTS) {
      fail(at, `SVG has more than ${SVG_MAX_ELEMENTS} elements.`)
      return { ok: false, errors }
    }
    if (root === null) root = opening
    if (!SVG_ELEMENTS.has(opening)) {
      fail(at, `<${opening}> is not an element a generated image may use.`)
    }

    ATTRIBUTE.lastIndex = 0
    let attribute: RegExpExecArray | null
    while ((attribute = ATTRIBUTE.exec(attrs ?? '')) !== null) {
      const name = attribute[1]
      const value = attribute[2] ?? attribute[3] ?? ''
      // `attribute.index` is an offset into `attrs`, and `attrs` begins after the
      // `<` and the element name — so both hops are needed to land on the byte in
      // `source` that the operator is being pointed at.
      const where = at + 1 + opening.length + (attribute.index ?? 0)

      if (/^on/i.test(name)) {
        fail(where, `'${name}' is an event handler; a generated image runs no code.`)
        continue
      }
      if (!SVG_ATTRIBUTES.has(name)) {
        fail(where, `'${name}' is not an attribute a generated image may carry.`)
        continue
      }
      if (REFERENCE_ATTRIBUTES.has(name) && /url\s*\(/i.test(value) && !LOCAL_REFERENCE.test(value.trim())) {
        fail(where, `'${name}' may reference only an id in this same document, as url(#name).`)
        continue
      }
      if (/[<>]/.test(value) || !entitiesAreAllowed(value)) {
        fail(where, `'${name}' carries markup or an entity in its value.`)
      }
    }

    if (!selfClosing) open.push(opening)
    at += matched.length
  }

  if (root !== 'svg') {
    fail(0, `The document's root element is <${root ?? 'nothing'}>, not <svg>.`)
  }
  if (open.length > 0) {
    fail(source.length, `<${open[open.length - 1]}> is never closed.`)
  }
  return { ok: errors.length === 0, errors }
}
