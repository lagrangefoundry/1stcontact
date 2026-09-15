/**
 * The **email render target** — one L1 document, emitted for a mail client
 * ([[REQ-247]] §3).
 *
 * THE SECOND EMITTER, AND NOT A SECOND SUBSTRATE. `render.ts` emits a browser
 * document: one stylesheet, class selectors, flexbox, media queries, custom
 * properties, `@font-face`. Not one of those survives the journey into an inbox
 * — Outlook's Word engine has no flexbox and strips a background image; Gmail
 * drops a `<style>` block on forwarding; nothing anywhere loads a web font. So
 * the same tree is emitted a second way: **nested tables, styles inlined on
 * every element, palette references resolved to literal hex, and a family
 * degraded to a real fallback stack.**
 *
 * WHAT KEEPS THE TWO HONEST IS THE DECLARATION AND NOT THIS FILE.
 * `L1_EMAIL_TARGET` (site-schema) says which axes an email page may carry, the
 * site validator refuses the rest, and this emitter therefore only ever meets
 * axes it knows how to emit. That is why there is no silent `default:` branch
 * below and no "unsupported, ignored" comment: an axis this file cannot emit
 * cannot reach it. Widening the target is adding an entry to that declaration
 * and a case here, in the same change — which is exactly the coupling that
 * stops a documented capability from being a fictional one.
 *
 * IT IS PURE AND DETERMINISTIC, like the web emitter, and shares its escaping
 * and its URL allowlist. There is no script, no `<style>`, no external
 * reference: a message is a closed document by the time it leaves.
 */
import {
  isSafeUrl,
  resolveL1Palette,
  type L1AxisSizing,
  type L1Border,
  type L1Color,
  type L1Document,
  type L1Node,
  type L1Padding,
  type L1Palette,
  type L1TextRun,
} from '@1stcontact/site-schema'

/**
 * A family handle, degraded to glyphs that actually exist on the reading
 * machine.
 *
 * DECLARED DATA, for the same reason the axis set is. A mail client loads no
 * web font, so `fontFamily: "Satoshi"` paints whatever the client's default is
 * — which is a different face on every platform and, on several, a serif where
 * the author meant a sans. Naming a stack is the only thing that makes the
 * choice the author's rather than the client's.
 *
 * THE TABLE IS SMALL ON PURPOSE. It holds the faces that are genuinely present
 * across the common clients, keyed lowercase, and everything else falls to the
 * sans stack. A larger table would be a claim about what is installed that
 * nothing here can check.
 */
export const EMAIL_FONT_STACKS = {
  sans: 'Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: '"Courier New", Courier, monospace',
} as const

/** Which stack a known family belongs to. An unknown family falls to `sans`. */
export const EMAIL_FONT_CATEGORY: Readonly<Record<string, keyof typeof EMAIL_FONT_STACKS>> = {
  georgia: 'serif',
  'times new roman': 'serif',
  times: 'serif',
  garamond: 'serif',
  'palatino linotype': 'serif',
  'book antiqua': 'serif',
  cambria: 'serif',
  arial: 'sans',
  helvetica: 'sans',
  verdana: 'sans',
  tahoma: 'sans',
  'trebuchet ms': 'sans',
  'segoe ui': 'sans',
  calibri: 'sans',
  'courier new': 'mono',
  courier: 'mono',
  consolas: 'mono',
  menlo: 'mono',
}

/** The `font-family` an email may actually state: the handle, then a real stack. */
export function emailFontFamily(family: string): string {
  /*
   * IT IS HANDED A STACK AND NOT A SINGLE NAME, and that is not a tolerance —
   * it is the ordinary case. L1's own painted-font rule refuses a bare family
   * that resolves to no served face and names no generic, because a browser
   * given one paints its default rather than anything the author chose. So a
   * family written on an email page arrives already spelled `Helvetica,
   * sans-serif`, and a reader that lowercased the whole string and looked it up
   * would miss every entry in the table and fall to `sans` by accident rather
   * than by judgement.
   *
   * SO THE FIRST NAME DECIDES THE CATEGORY and the author's own stack is kept in
   * front of ours. Their preference is more specific than our guess about what
   * is installed, and appending rather than replacing is what makes this a
   * degradation instead of a substitution.
   */
  const declared = family
    .split(',')
    .map((name) => name.trim().replace(/^['"]|['"]$/g, ''))
    .filter((name) => name !== '')
  const head = declared[0] ?? ''
  const stack = EMAIL_FONT_STACKS[EMAIL_FONT_CATEGORY[head.toLowerCase()] ?? 'sans']
  // Deduplicated against the stack we are about to append, so a family that is
  // already in it — `Helvetica`, `Arial` — is not said twice.
  const tail = stack.split(',').map((name) => name.trim().toLowerCase())
  const kept = declared.filter(
    (name, i) => declared.indexOf(name) === i && !tail.includes(name.toLowerCase()),
  )
  // Quoted only when it needs to be, so the common case reads as an author
  // wrote it and a multi-word family is still legal CSS.
  const quoted = kept.map((name) =>
    /^[A-Za-z][A-Za-z0-9-]*$/.test(name) ? name : `'${name.replace(/'/g, '')}'`,
  )
  return [...quoted, stack].join(', ')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** A colour, already palette-resolved by the entry point, as a CSS literal. */
function color(v: L1Color | undefined): string | null {
  return typeof v === 'string' ? v : null
}

function px(v: number | undefined): string | null {
  return v === undefined ? null : `${Math.round(v * 1000) / 1000}px`
}

function paddingCss(p: L1Padding | undefined): string | null {
  if (!p) return null
  const side = (n: number | undefined) => `${Math.round((n ?? 0) * 1000) / 1000}px`
  return `padding:${side(p.topPx)} ${side(p.rightPx)} ${side(p.bottomPx)} ${side(p.leftPx)}`
}

function borderCss(b: L1Border | undefined): string | null {
  if (!b) return null
  const c = color(b.color)
  return c === null ? null : `border:${px(b.widthPx)} ${b.style ?? 'solid'} ${c}`
}

/** The declared width of a node, when it declares a fixed one. */
function fixedWidth(sizing: L1AxisSizing | undefined): number | null {
  const w = sizing?.width
  return w && w.mode === 'fixed' && w.px !== undefined ? w.px : null
}

/** The paint a box-rendering node puts on the cell that holds it. */
function surfaceDecls(node: L1Node): string[] {
  const axes = ((node as unknown as Record<string, unknown>).axes ?? {}) as Record<string, unknown>
  const out: string[] = []
  const fill = color(axes.surfaceFill as L1Color | undefined)
  if (fill) out.push(`background-color:${fill}`)
  const border = borderCss(axes.border as L1Border | undefined)
  if (border) out.push(border)
  const radius = px(axes.borderRadiusPx as number | undefined)
  if (radius) out.push(`border-radius:${radius}`)
  const pad = paddingCss(node.padding)
  if (pad) out.push(pad)
  return out
}

/** The type a run paints. Shared by a whole `text` node and by one of its runs. */
function typeDecls(axes: Record<string, unknown> | undefined): string[] {
  if (!axes) return []
  const out: string[] = []
  const c = color(axes.color as L1Color | undefined)
  if (c) out.push(`color:${c}`)
  if (typeof axes.fontFamily === 'string') out.push(`font-family:${emailFontFamily(axes.fontFamily)}`)
  const size = px(axes.fontSizePx as number | undefined)
  if (size) out.push(`font-size:${size}`)
  if (typeof axes.fontWeight === 'number') out.push(`font-weight:${axes.fontWeight}`)
  const line = px(axes.lineHeightPx as number | undefined)
  if (line) out.push(`line-height:${line}`)
  const tracking = px(axes.letterSpacingPx as number | undefined)
  if (tracking) out.push(`letter-spacing:${tracking}`)
  if (typeof axes.textAlign === 'string') out.push(`text-align:${axes.textAlign}`)
  if (typeof axes.textTransform === 'string') out.push(`text-transform:${axes.textTransform}`)
  if (typeof axes.fontStyle === 'string') out.push(`font-style:${axes.fontStyle}`)
  if (typeof axes.textDecoration === 'string') out.push(`text-decoration:${axes.textDecoration}`)
  return out
}

function styleAttr(decls: string[]): string {
  return decls.length === 0 ? '' : ` style="${escapeHtml(decls.join(';'))}"`
}

/**
 * Wrap content in the node's link, when it has a safe one.
 *
 * DEGRADES TO THE UNLINKED CONTENT, exactly as the web emitter does: an unsafe
 * href produces plain words rather than a live unsafe link. `{{cta_url}}` is
 * NOT a URL and does not clear the allowlist on its own — but it is not here
 * either, because a message is rendered only after its tokens are substituted.
 */
function linked(node: L1Node, inner: string, decls: string[]): string {
  const link = (node as unknown as Record<string, unknown>).link as
    | { href: string; newTab?: boolean; ariaLabel?: string }
    | undefined
  if (!link || !isSafeUrl(link.href)) return inner
  const rel = link.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
  const label = link.ariaLabel ? ` aria-label="${escapeHtml(link.ariaLabel)}"` : ''
  return `<a href="${escapeHtml(link.href)}"${rel}${label}${styleAttr(decls)}>${inner}</a>`
}

/** `align` maps to the cell's vertical alignment; `stretch` has no table form. */
const VALIGN: Record<string, string> = { start: 'top', center: 'middle', end: 'bottom', stretch: 'top' }

/** `distribution` maps to the row's horizontal alignment. */
const HALIGN: Record<string, string> = { start: 'left', center: 'center', end: 'right' }

const TABLE_OPEN = '<table role="presentation" cellpadding="0" cellspacing="0" border="0"'

/**
 * One node, as HTML legal inside a `<td>`.
 *
 * EVERY BOX IS A TABLE, which is the whole technique. A `<div>` with padding and
 * a background is the one thing Word's engine renders least reliably; a
 * single-cell table with the same paint on its cell is the one thing every
 * client back to Outlook 2007 renders correctly. So a `box` and a `container`
 * both become a table, and the difference between them is how many rows and
 * cells it has.
 */
function emit(node: L1Node, width: number | null): string {
  const w = fixedWidth(node.sizing) ?? width
  const widthAttr = w === null ? ' width="100%"' : ` width="${Math.round(w)}"`

  if (node.kind === 'text') {
    const axes = (node.axes ?? {}) as Record<string, unknown>
    const cell = [...surfaceDecls(node), ...typeDecls(axes)]
    const words = Array.isArray(node.text)
      ? node.text
          .map((run: L1TextRun) => {
            const runDecls = typeDecls(run.axes as Record<string, unknown> | undefined)
            return runDecls.length === 0
              ? escapeHtml(run.text)
              : `<span${styleAttr(runDecls)}>${escapeHtml(run.text)}</span>`
          })
          .join('')
      : escapeHtml(node.text)
    // The link takes the type declarations so the anchor does not inherit the
    // client's own blue-and-underlined default, which is the single most common
    // way an authored button stops looking like one.
    const inner = linked(node, words, typeDecls(axes))
    return `${TABLE_OPEN}${widthAttr}><tr><td${styleAttr(cell)}>${inner}</td></tr></table>`
  }

  if (node.kind === 'image') {
    const declared = fixedWidth(node.sizing)
    const attrs =
      `src="${escapeHtml(isSafeUrl(node.src) ? node.src : '')}" alt="${escapeHtml(node.alt)}"` +
      (declared === null ? '' : ` width="${Math.round(declared)}"`)
    const img = `<img ${attrs} style="display:block;border:0;max-width:100%;height:auto" />`
    return `${TABLE_OPEN}${widthAttr}><tr><td${styleAttr(surfaceDecls(node))}>${linked(node, img, [])}</td></tr></table>`
  }

  // `slot` and `control` are not on the email target, so the validator has
  // already refused them; returning nothing is the inert degradation the web
  // emitter takes for an unbound control, not a silent drop of authored content.
  if (node.kind !== 'box' && node.kind !== 'container') return ''
  const children: readonly L1Node[] = node.children ?? []
  const cellStyle = styleAttr(surfaceDecls(node))

  if (node.kind === 'container' && node.layout === 'row') {
    const gap = node.gapPx ?? 0
    const valign = VALIGN[node.align ?? 'start']
    const halign = HALIGN[node.distribution ?? 'start']
    const cells = children
      .map((child, i) => {
        const pad = i === 0 || gap === 0 ? '' : ` style="padding-left:${gap}px"`
        return `<td valign="${valign}"${pad}>${emit(child, null)}</td>`
      })
      .join('')
    return (
      `${TABLE_OPEN}${widthAttr}><tr><td${cellStyle}>` +
      `${TABLE_OPEN} width="100%" align="${halign}"><tr>${cells}</tr></table>` +
      `</td></tr></table>`
    )
  }

  // `box` and `container layout: 'stack'` are the same emission: one row per
  // child, top to bottom. They differ in the document (a box is paint, a stack
  // is a declared flow) and not in what a table has to do about it — which is
  // why there is no third branch pretending otherwise.
  const gap = node.kind === 'container' ? node.gapPx ?? 0 : 0
  const rows =
    children.length === 0
      ? '<tr><td></td></tr>'
      : children
          .map((child, i) => {
            const pad = i === 0 || gap === 0 ? '' : ` style="padding-top:${gap}px"`
            return `<tr><td${pad}>${emit(child, null)}</td></tr>`
          })
          .join('')
  return `${TABLE_OPEN}${widthAttr}><tr><td${cellStyle}>${TABLE_OPEN} width="100%">${rows}</table></td></tr></table>`
}

/** Options for {@link renderL1Email}. */
export interface L1EmailRenderOptions {
  /** The site palette any colour reference resolves against, as the web target takes it. */
  palette?: L1Palette
  /** The message's subject, emitted as the document `<title>`. */
  subject?: string
}

/**
 * Render an email page's L1 document as a complete message body.
 *
 * THE CANVAS WIDTH IS THE DOCUMENT'S ONE WIDTH. An email page declares exactly
 * one (the target refuses a ladder), because there is no viewport to respond to
 * and a second width would name a rendering nothing ever produces.
 *
 * THE OUTER TABLE IS 100% AND THE INNER ONE IS THE CANVAS. That pair is what
 * centres a fixed-width message in a window of any size, in every client, with
 * no media query — and it is why the page background is painted on the outer
 * cell as well as on `<body>`, which several clients discard.
 */
export function renderL1Email(input: L1Document, opts: L1EmailRenderOptions = {}): string {
  const doc = resolveL1Palette(input, opts.palette)
  const canvas = Math.round(doc.widths[0])
  const bg = color(doc.background)
  const fg = color(doc.textColor)
  const page: string[] = ['margin:0', 'padding:0', 'width:100%']
  if (bg) page.push(`background-color:${bg}`)
  if (fg) page.push(`color:${fg}`)
  const outerCell = ['padding:0']
  if (bg) outerCell.push(`background-color:${bg}`)
  const body = emit(doc.root, canvas)
  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(opts.subject ?? '')}</title>`,
    '</head>',
    `<body${styleAttr(page)}>`,
    `${TABLE_OPEN} width="100%"><tr><td align="center"${styleAttr(outerCell)}>`,
    body,
    '</td></tr></table>',
    '</body>',
    '</html>',
  ].join('\n')
}
