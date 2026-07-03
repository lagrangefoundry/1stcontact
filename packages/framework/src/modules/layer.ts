import type {
  ImageTreatment,
  Layer,
  LayerChild,
  LayerTextTypography,
  Position,
} from '@1stcontact/site-schema'
import { renderMarkdown } from './markdown'
import { wrapWithMotion } from './motion'

/**
 * Layer rendering (REQ-15, DOC-7 §6, DOC-14, DOC-15 design log).
 *
 * A layer is structured data on a module instance — an ordered stack of freely
 * positioned children (images, text runs) composited *over* the host module's
 * markup. The framework, never the instance, turns the structured positions
 * into CSS: each child carries framework-computed CSS custom properties
 * (`--fc-x`, `--fc-z`, …) and the static positioning / responsive / treatment
 * rules live in {@link LAYER_CSS}. This is the security/reproducibility line of
 * DOC-7 §6.2 — no instance-supplied CSS ever reaches the page.
 *
 *   fc-layer                     (positioning context)
 *   ├─ fc-layer__content         (the host module's markup, z 0)
 *   ├─ fc-layer__overlay         (optional tint,            z 1)
 *   └─ fc-layer__stack           (absolute, z 2)
 *      └─ fc-layer__child …      (each positioned by its custom properties)
 *
 * Z-compositing over another module falls out for free: `wrapWithLayer` is
 * applied to any module instance that carries a `layer` field, so the stack
 * always sits above the host content.
 */

/** Ascending breakpoint token names — the per-breakpoint override cascade. */
const BREAKPOINTS = ['sm', 'md', 'lg', 'xl'] as const
/** Standard pixel widths for the breakpoint tokens (mirrors token defaults). */
const BREAKPOINT_PX: Record<(typeof BREAKPOINTS)[number], number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}

/** The `--fc-*` custom-property suffixes for each structured position field. */
const POSITION_VARS = ['x', 'y', 'z', 'w', 'h', 'rotate'] as const

/**
 * Build the `var(--fc-<field>-<bp>, … , var(--fc-<field>))` fallback chain for
 * one field at one breakpoint: a larger breakpoint falls back through every
 * smaller override to the base value, giving "override and up" semantics.
 */
function overrideChain(field: string, upTo: number): string {
  let chain = `var(--fc-${field})`
  for (let i = 0; i <= upTo; i += 1) {
    chain = `var(--fc-${field}-${BREAKPOINTS[i]}, ${chain})`
  }
  return chain
}

/** Per-breakpoint media blocks that re-point each `fc-layer__child` field. */
function breakpointRules(): string {
  return BREAKPOINTS.map((bp, i) => {
    const decls = [
      `left: ${overrideChain('x', i)};`,
      `top: ${overrideChain('y', i)};`,
      `width: ${overrideChain('w', i)};`,
      `height: ${overrideChain('h', i)};`,
      `z-index: ${overrideChain('z', i)};`,
      `transform: rotate(${overrideChain('rotate', i)});`,
    ].join(' ')
    return `@media (min-width: ${BREAKPOINT_PX[bp]}px) {\n  .fc-layer__child { ${decls} }\n}`
  }).join('\n')
}

/** Reflow blocks: below each breakpoint, `reflow: stack` returns to normal flow. */
function reflowRules(): string {
  return BREAKPOINTS.map((bp) => {
    const max = BREAKPOINT_PX[bp] - 0.02
    return `@media (max-width: ${max}px) {
  .fc-layer--reflow-below-${bp}.fc-layer--reflow-stack .fc-layer__stack {
    position: static; inset: auto; display: flex; flex-direction: column; gap: var(--space-4);
  }
  .fc-layer--reflow-below-${bp}.fc-layer--reflow-stack .fc-layer__child {
    position: static; left: auto; top: auto; width: auto; height: auto; transform: none;
  }
}`
  }).join('\n')
}

/** Structural CSS for the layer. Static; identical for every site. */
export const LAYER_CSS = `/* layer (REQ-15) */
.fc-layer { position: relative; overflow: hidden; }
.fc-layer__content { position: relative; z-index: 0; }
.fc-layer__overlay { position: absolute; inset: 0; z-index: 1; }
.fc-layer__stack { position: absolute; inset: 0; z-index: 2; }
.fc-layer__child {
  position: absolute;
  left: var(--fc-x);
  top: var(--fc-y);
  width: var(--fc-w, auto);
  height: var(--fc-h, auto);
  z-index: var(--fc-z, 0);
  transform: rotate(var(--fc-rotate, 0deg));
  /* Rotate about the element centre (the CSS default, and what an art-directed
     montage expects): the child's top/left place its box, then it tilts in
     place. A top-left origin would swing the box around its corner, displacing
     every rotated child away from its intended position. */
  transform-origin: center;
}
.fc-layer__child--image img { display: block; width: 100%; height: 100%; object-fit: cover; }
/* Motion (REQ-16) wraps the <img> in an fc-motion element; without this it has
   auto height, so a child's height:100% / object-fit collapses to the image's
   natural aspect (an ellipse for a circle). Make the wrapper transparent to
   sizing so a definite-height image child fills its box whether or not it has
   motion. */
.fc-layer__child--image .fc-motion { display: block; width: 100%; height: 100%; }
/* A circle is square from its width alone — no reliance on a percentage height
   (which resolves against the layer box, not the child's width). */
.fc-layer__child--shape-circle { aspect-ratio: 1; }
/* Text run (REQ-32 cap 5): the child carries token-backed typography as inline
   custom properties on this element; the markdown children inherit it. Reset the
   markdown block margins so the run sits exactly at its positioned offset, and
   let links inherit the run's colour. */
.fc-layer__text > * { margin: 0; }
.fc-layer__text a { color: inherit; text-underline-offset: 0.16em; }
/* Titled block (REQ-32 cap 5): the lines flow in normal document order, so
   their inter-line gap is content-based and fixed at any viewport height. A
   small default gap separates a title from its tagline. */
.fc-layer__block { display: block; }
.fc-layer__block > * + * { margin-top: 0.5rem; }
.fc-layer__child--shape-circle img { border-radius: 50%; }
.fc-layer__child--shape-rounded img { border-radius: var(--radius-lg); }
.fc-layer__child--edge-soft img {
  -webkit-mask-image: radial-gradient(ellipse 92% 92% at center, #000 var(--fc-feather, 60%), transparent 100%);
  mask-image: radial-gradient(ellipse 92% 92% at center, #000 var(--fc-feather, 60%), transparent 100%);
}
.fc-layer__child--edge-torn img {
  -webkit-mask-image: var(--fc-torn-mask, none);
  mask-image: var(--fc-torn-mask, none);
  -webkit-mask-size: 100% 100%; mask-size: 100% 100%;
}
${breakpointRules()}
${reflowRules()}`

/** Escape a string for safe use inside a double-quoted HTML attribute. */
function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

/** Format one position field as a CSS value with the right unit. */
function unit(field: string, value: number): string {
  if (field === 'z') return String(value)
  if (field === 'rotate') return `${value}deg`
  return `${value}%`
}

/** The `--fc-<field>` custom-property name for a schema field. */
function varName(field: string, bp?: string): string {
  // width/height map to the short --fc-w / --fc-h names the CSS reads.
  const key = field === 'width' ? 'w' : field === 'height' ? 'h' : field
  return bp ? `--fc-${key}-${bp}` : `--fc-${key}`
}

/** Emit the `--fc-*` declarations (base + per-breakpoint) for a position. */
function positionVars(position: Position): string {
  const decls: string[] = []
  const base: Record<string, number | undefined> = {
    x: position.x,
    y: position.y,
    z: position.z,
    width: position.width,
    height: position.height,
    rotate: position.rotate,
  }
  for (const [field, value] of Object.entries(base)) {
    if (value !== undefined) decls.push(`${varName(field)}: ${unit(field, value)};`)
  }
  for (const bp of BREAKPOINTS) {
    const override = position.breakpoints?.[bp]
    if (!override) continue
    for (const [field, value] of Object.entries(override)) {
      if (value !== undefined) decls.push(`${varName(field, bp)}: ${unit(field, value as number)};`)
    }
  }
  return decls.join(' ')
}

/** The treatment class list for an image child. */
function treatmentClasses(treatment: ImageTreatment | undefined): string {
  if (!treatment) return ''
  const parts: string[] = []
  if (treatment.shape && treatment.shape !== 'none') {
    parts.push(`fc-layer__child--shape-${treatment.shape}`)
  }
  if (treatment.edge && treatment.edge !== 'none') {
    // `soft-mask` → `edge-soft`, `torn-asset` → `edge-torn`.
    const edge = treatment.edge === 'soft-mask' ? 'soft' : 'torn'
    parts.push(`fc-layer__child--edge-${edge}`)
  }
  return parts.join(' ')
}

/** Border-width tokens → px (REQ-32 cap 5). `none` emits no border. */
const BORDER_WIDTH_PX: Record<string, string> = {
  none: '0',
  thin: '1px',
  medium: '2px',
  thick: '4px',
}

/** Letter-spacing tokens → em (REQ-32 cap 5). A closed set, never raw CSS. */
const TRACKING_EM: Record<string, string> = {
  normal: 'normal',
  wide: '0.03em',
  wider: '0.08em',
}

/**
 * Soft-mask feather steps → the radial mask's opaque-stop percentage (REQ-32
 * cap 5). A higher stop = a crisper edge (a smaller feathered band); `lg`
 * reproduces the prior fixed 55% default.
 */
const FEATHER_STOP: Record<string, string> = {
  sm: '78%',
  md: '72%',
  lg: '60%',
}

/**
 * Text-shadow presets for a layer text run (REQ-32 cap 5). `soft` is a dark
 * legibility shadow; `glow` adds a soft light halo for a luminous wordmark over
 * imagery. Framework-computed — no raw CSS crosses the boundary.
 */
const TEXT_SHADOW: Record<string, string> = {
  soft: '2px 2px 10px rgba(0,0,0,0.9)',
  glow: '4px 4px 20px rgba(0,0,0,0.9), 0 0 40px rgba(255,255,255,0.3)',
}

/**
 * Framework-computed `style` declarations for an image child's shadow/border
 * treatment (REQ-32 cap 5). Both resolve to theme tokens (`var(--shadow-*)`,
 * `var(--color-*)`) — no raw CSS crosses the boundary. Applied to the `<img>`
 * so a `box-shadow` follows the shape/border-radius and a border rings it.
 */
function imageTreatmentStyle(treatment: ImageTreatment | undefined): string {
  if (!treatment) return ''
  const decls: string[] = []
  if (treatment.shadow) decls.push(`box-shadow: var(--shadow-${treatment.shadow});`)
  if (treatment.border && treatment.border.width !== 'none') {
    const width = BORDER_WIDTH_PX[treatment.border.width]
    decls.push(`border: ${width} solid var(--color-${treatment.border.color});`)
  }
  // Feather is read by the soft-mask CSS via --fc-feather; only meaningful when
  // the edge is a soft-mask (a no-op otherwise).
  if (treatment.feather && treatment.edge === 'soft-mask') {
    decls.push(`--fc-feather: ${FEATHER_STOP[treatment.feather]};`)
  }
  return decls.join(' ')
}

/**
 * Framework-computed `style` declarations for a text child's typography
 * (REQ-32 cap 5). Every field resolves to a theme-token custom property or a
 * fixed framework value (tracking → em, shadow → a legibility text-shadow) — no
 * raw CSS. Emitted on the `.fc-layer__text` run; the markdown children inherit.
 */
function textTypographyStyle(typo: LayerTextTypography | undefined): string {
  if (!typo) return ''
  const decls: string[] = []
  if (typo.size) decls.push(`font-size: var(--font-size-${typo.size});`)
  if (typo.weight) decls.push(`font-weight: var(--font-weight-${typo.weight});`)
  if (typo.color) decls.push(`color: var(--color-${typo.color});`)
  if (typo.font) decls.push(`font-family: var(--font-family-${typo.font});`)
  if (typo.leading) decls.push(`line-height: var(--line-height-${typo.leading});`)
  if (typo.tracking) decls.push(`letter-spacing: ${TRACKING_EM[typo.tracking]};`)
  if (typo.align) decls.push(`text-align: ${typo.align};`)
  if (typo.shadow) decls.push(`text-shadow: ${TEXT_SHADOW[typo.shadow]};`)
  return decls.join(' ')
}

/** Render one layer child (image or text) to positioned HTML. */
async function renderChild(child: LayerChild): Promise<string> {
  const style = escapeAttr(positionVars(child.position))
  if (child.kind === 'image') {
    const cls = ['fc-layer__child', 'fc-layer__child--image', treatmentClasses(child.treatment)]
      .filter(Boolean)
      .join(' ')
    const src = escapeAttr(child.asset.src)
    const alt = escapeAttr(child.asset.alt)
    // Shadow/border (REQ-32 cap 5) ride on the `<img>` itself so a `box-shadow`
    // tracks the shape and a border rings it. Framework-computed token refs only.
    const imgStyle = escapeAttr(imageTreatmentStyle(child.treatment))
    const imgStyleAttr = imgStyle ? ` style="${imgStyle}"` : ''
    // Motion (REQ-16) wraps the child's *inner* content, not the positioned
    // element — the child already owns `transform: rotate(...)`, which a
    // slide/scale keyframe would otherwise clobber.
    const inner = wrapWithMotion(
      `<img src="${src}" alt="${alt}" loading="lazy" decoding="async"${imgStyleAttr} />`,
      child.motion,
    )
    return `<div class="${cls}" style="${style}">${inner}</div>`
  }
  // Titled block (REQ-32 cap 5): multiple typography-styled lines flow inside one
  // positioned block, so a wordmark + tagline keep a *content-based* (fixed) gap
  // at any viewport height — unlike two separately `top: %`-positioned children,
  // whose gap scales with the band's `100vh`.
  if (child.lines) {
    const rendered = await Promise.all(
      child.lines.map(async (line) => {
        const lineHtml = await renderMarkdown(line.text)
        const lineStyle = escapeAttr(textTypographyStyle(line.typography))
        const lineStyleAttr = lineStyle ? ` style="${lineStyle}"` : ''
        return `<div class="fc-layer__text"${lineStyleAttr}>${lineHtml}</div>`
      }),
    )
    const block = wrapWithMotion(
      `<div class="fc-layer__block">${rendered.join('')}</div>`,
      child.motion,
    )
    return `<div class="fc-layer__child fc-layer__child--text" style="${style}">${block}</div>`
  }
  // Single text run: markdown, rendered through the same processor as text-block.
  // Token-backed typography (REQ-32 cap 5) is emitted on the run wrapper; the
  // markdown children inherit font-size/weight/colour/tracking/shadow from it.
  const html = await renderMarkdown(child.text ?? '')
  const typoStyle = escapeAttr(textTypographyStyle(child.typography))
  const typoStyleAttr = typoStyle ? ` style="${typoStyle}"` : ''
  const inner = wrapWithMotion(
    `<div class="fc-layer__text"${typoStyleAttr}>${html}</div>`,
    child.motion,
  )
  return `<div class="fc-layer__child fc-layer__child--text" style="${style}">${inner}</div>`
}

/** Render the positioned-child stack (without the wrapping context). */
export async function renderLayer(layer: Layer): Promise<string> {
  const children = await Promise.all(layer.children.map(renderChild))
  return children.join('')
}

/**
 * Wrap a module's rendered HTML in a layer, compositing the positioned children
 * over the host content. Returns the HTML unchanged when the instance has no
 * layer, so modules without one render exactly as before.
 */
export async function wrapWithLayer(
  moduleHtml: string,
  layer: Layer | undefined,
): Promise<string> {
  if (!layer) return moduleHtml
  const reflow = layer.reflow ?? 'stack'
  const reflowBelow = layer.reflowBelow ?? 'sm'
  const classes = ['fc-layer']
  if (reflow === 'stack') {
    classes.push('fc-layer--reflow-stack', `fc-layer--reflow-below-${reflowBelow}`)
  }
  const overlay = layer.overlay
    ? `<div class="fc-layer__overlay" style="${escapeAttr(
        `background-color: ${layer.overlay.color}; opacity: ${layer.overlay.opacity};`,
      )}"></div>`
    : ''
  const stack = await renderLayer(layer)
  return `<div class="${classes.join(' ')}"><div class="fc-layer__content">${moduleHtml}</div>${overlay}<div class="fc-layer__stack">${stack}</div></div>`
}
