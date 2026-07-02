import type { ImageTreatment, Layer, LayerChild, Position } from '@1stcontact/site-schema'
import { renderMarkdown } from './markdown'

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
  transform-origin: top left;
}
.fc-layer__child--image img { display: block; width: 100%; height: 100%; object-fit: cover; }
.fc-layer__child--shape-circle img { border-radius: 50%; }
.fc-layer__child--shape-rounded img { border-radius: var(--radius-lg); }
.fc-layer__child--edge-soft img {
  -webkit-mask-image: radial-gradient(ellipse at center, #000 55%, transparent 100%);
  mask-image: radial-gradient(ellipse at center, #000 55%, transparent 100%);
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

/** Render one layer child (image or text) to positioned HTML. */
async function renderChild(child: LayerChild): Promise<string> {
  const style = escapeAttr(positionVars(child.position))
  if (child.kind === 'image') {
    const cls = ['fc-layer__child', 'fc-layer__child--image', treatmentClasses(child.treatment)]
      .filter(Boolean)
      .join(' ')
    const src = escapeAttr(child.asset.src)
    const alt = escapeAttr(child.asset.alt)
    return `<div class="${cls}" style="${style}"><img src="${src}" alt="${alt}" loading="lazy" decoding="async" /></div>`
  }
  // Text run: markdown, rendered through the same processor as text-block.
  const html = await renderMarkdown(child.text)
  return `<div class="fc-layer__child fc-layer__child--text" style="${style}"><div class="fc-layer__text">${html}</div></div>`
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
