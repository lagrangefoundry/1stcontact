/**
 * REQ-275 — the triage register: for every CSS property and DOM fact a page can
 * use, what the capture does about it.
 *
 * THIS IS THE HALF THAT MAKES THE PROBE PAY FOR ITSELF. `audit-script.ts`
 * enumerates what a page uses; on a real site that is ~170 longhands and ~30
 * attributes, and re-reading that list every run would be re-doing the triage
 * every run. So each decision is written down ONCE, here, beside the reason for
 * it — which is also what the ticket's fourth acceptance clause asks for, in the
 * shape REQ-73's band-padding note already set: a deliberate omission carries
 * its justification in the code, not in a transcript.
 *
 * The register is therefore not a wishlist of properties to look for. Nothing
 * reads it to decide what to check; the page decides that. It is read only to
 * answer "and what did we decide about this one?", and a property it has no
 * answer for is the probe's actual output — the thing that needs a human
 * decision, and the only thing a re-run should ever surface.
 *
 * THREE VERDICTS, AND THE DIFFERENCE BETWEEN THEM IS WHOSE PROBLEM IT IS:
 *
 *   - `recorded` — the extractor carries it. An instrument that already works.
 *   - `declined` — deliberately not carried, because the capture records a
 *     *rendered fact* and this is a *mechanism* that produced one (DOC-13 §3),
 *     or because another axis already measures the same outcome more honestly.
 *     Not a gap: re-deciding it every round is the cost this avoids.
 *   - `not-expressible` — the page uses it, the reproduction cannot say it, and
 *     recording it would put a value in the bundle that nothing downstream could
 *     consume. That is a CAPABILITY item (an L1 axis), not an instrument one,
 *     and the register's job is to keep it from being mistaken for the latter.
 */
import { captureFields, captureRuns } from './schema'
import type { Capture } from './types'

export type CoverageVerdict = 'recorded' | 'declined' | 'not-expressible'

/** One decision about one property. */
export interface CoverageEntry {
  /** A CSS longhand (`border-bottom-width`) or a DOM fact (`dom:target`). */
  property: string
  verdict: CoverageVerdict
  /**
   * `recorded`: where the value lands in `capture.json`.
   * `declined` / `not-expressible`: why it does not.
   */
  note: string
  /**
   * `recorded` only — does THIS bundle demonstrably carry the axis?
   *
   * The asymmetry is the same one {@link CaptureAxis.present} sets out, and it
   * runs the same way round. A bundle that visibly carries the axis is never
   * reported, whatever else is true. A bundle that does not carry it, on a page
   * that declares it, is reported as a *candidate* loss and not as a fact —
   * because a rule can match an element the capture does not model (a layout
   * wrapper), and "no run carries a text-shadow" then means "no run we modelled
   * had one" rather than "the extractor dropped it".
   *
   * Absent where no cheap witness exists; the entry is then coverage-only.
   */
  present?: (capture: Capture) => boolean
}

// ── witnesses ────────────────────────────────────────────────────────────────

const anyRun = (key: string, ok: (v: unknown) => boolean = (v) => v !== null && v !== undefined) =>
  (c: Capture): boolean => captureRuns(c).some((r) => ok(r[key]))

const anyField = (key: string, ok: (v: unknown) => boolean = (v) => v !== null && v !== undefined) =>
  (c: Capture): boolean => captureFields(c).some((f) => ok(f[key]))

/** Either population — a paint axis lives on runs and on text-free elements alike. */
const anyElement = (key: string, ok?: (v: unknown) => boolean) => {
  const run = anyRun(key, ok)
  const field = anyField(key, ok)
  return (c: Capture): boolean => run(c) || field(c)
}

const truthy = (v: unknown): boolean => Boolean(v)
const nonZero = (v: unknown): boolean => typeof v === 'number' && v !== 0
const under = (limit: number) => (v: unknown): boolean => typeof v === 'number' && v < limit

// ── register construction ────────────────────────────────────────────────────

const rows = (verdict: CoverageVerdict, note: string, ...properties: string[]): CoverageEntry[] =>
  properties.map((property) => ({ property, verdict, note }))

/** The mechanism rule, stated once and cited by every layout longhand below. */
const MECHANISM =
  'a layout mechanism, not a rendered fact (DOC-13 §3). The extractor records the ' +
  'box the page laid out, so two DOMs that lay out identically project identically; ' +
  'transcribing the mechanism would make the same rendering compare as two.'

const REGISTER: readonly CoverageEntry[] = [
  // ── typography, recorded on a content run ─────────────────────────────────
  { property: 'color', verdict: 'recorded', note: "a run's `color`, composited to `#rrggbb`" },
  { property: 'font-family', verdict: 'recorded', note: "a run's `fontFamily`" },
  { property: 'font-size', verdict: 'recorded', note: "a run's `fontSizePx`" },
  { property: 'font-weight', verdict: 'recorded', note: "a run's `fontWeight`" },
  { property: 'line-height', verdict: 'recorded', note: "a run's `lineHeightPx`, to two decimals (REQ-269)" },
  {
    property: 'letter-spacing',
    verdict: 'recorded',
    note: "a run's `letterSpacingPx`",
    present: anyRun('letterSpacingPx', nonZero),
  },
  { property: 'text-align', verdict: 'recorded', note: "a band's `textAlign` and the section's `layout.contentAlign`" },
  {
    property: 'font-style',
    verdict: 'recorded',
    note: "a run's `fontStyle` (REQ-63)",
    present: anyRun('fontStyle', truthy),
  },
  {
    property: 'text-transform',
    verdict: 'recorded',
    note: "a run's `textTransform` (REQ-63)",
    present: anyRun('textTransform', truthy),
  },
  {
    property: 'text-decoration-line',
    verdict: 'recorded',
    note: "a run's `textDecoration` (REQ-63)",
    present: anyRun('textDecoration', truthy),
  },
  {
    property: 'font-variant-caps',
    verdict: 'recorded',
    note: "a run's `fontVariant` (REQ-63)",
    present: anyRun('fontVariant', truthy),
  },
  {
    property: 'list-style-type',
    verdict: 'recorded',
    note: "a run's `listMarker` (REQ-63) — the painted marker no text node holds",
    present: anyRun('listMarker', truthy),
  },
  {
    property: 'text-shadow',
    verdict: 'recorded',
    note: "an element's `textShadow` (REQ-48 item 3)",
    present: anyElement('textShadow', truthy),
  },
  {
    property: 'vertical-align',
    verdict: 'recorded',
    note: "a run's `verticalAlign` (REQ-211) — the lift off the baseline",
    present: anyRun('verticalAlign', truthy),
  },

  // ── paint and surface ─────────────────────────────────────────────────────
  {
    property: 'background-color',
    verdict: 'recorded',
    note: "a band's `background.color` / `background.kind: none` (REQ-271), and an element's `surfaceFill`",
  },
  {
    property: 'background-image',
    verdict: 'recorded',
    note: "a band's `background.image` or `background.gradient`, a run's text `gradient` / `surfaceGradient`, a field's `backgroundImageUrl`",
  },
  { property: 'background-clip', verdict: 'recorded', note: 'the `background-clip: text` paint becomes a run `gradient` (REQ-31)' },
  { property: '-webkit-background-clip', verdict: 'recorded', note: 'as `background-clip`' },
  {
    property: '-webkit-text-fill-color',
    verdict: 'recorded',
    note: 'the `transparent` half of a clip-to-text gradient; the gradient itself is the recorded axis (REQ-31)',
  },
  ...rows(
    'recorded',
    "an element's `borderWidthPx` — the THICKEST painted side, projected as uniform. A page that paints one side only is carried as if it painted four; the per-side shape is the `border` axis's, and L1 carries only a uniform `border` plus `borderLeft`",
    'border-top-width',
    'border-right-width',
    'border-bottom-width',
    'border-left-width',
    'border-block-start-width',
    'border-block-end-width',
    'border-inline-start-width',
    'border-inline-end-width',
  ),
  ...rows(
    'recorded',
    "an element's `borderColor` (the thickest painted side); a run's left accent is `borderLeft.color`",
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'border-block-start-color',
    'border-block-end-color',
    'border-inline-start-color',
    'border-inline-end-color',
  ),
  ...rows(
    'recorded',
    "an element's `borderStyle` (REQ-63) — the thickest painted side",
    'border-top-style',
    'border-right-style',
    'border-bottom-style',
    'border-left-style',
    'border-block-start-style',
    'border-block-end-style',
    'border-inline-start-style',
    'border-inline-end-style',
  ),
  ...rows(
    'recorded',
    "an element's `borderRadiusPx` — the LARGEST corner, projected to all four. Asymmetric rounding (a card rounded at the top only) is flattened; L1 carries one `borderRadiusPx`",
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius',
  ),
  {
    property: 'box-shadow',
    verdict: 'recorded',
    note: "an element's `boxShadow` (REQ-47)",
    present: anyElement('boxShadow', truthy),
  },
  {
    property: 'opacity',
    verdict: 'recorded',
    note: "an element's `opacity` (REQ-63)",
    present: anyElement('opacity', under(1)),
  },
  {
    property: 'filter',
    verdict: 'recorded',
    note: "an element's `filter` (REQ-48 item 3)",
    present: anyElement('filter', truthy),
  },
  {
    property: 'backdrop-filter',
    verdict: 'recorded',
    note: "an element's `backdropFilter` (REQ-63)",
    present: anyElement('backdropFilter', truthy),
  },
  { property: '-webkit-backdrop-filter', verdict: 'recorded', note: 'as `backdrop-filter`' },
  {
    property: 'mix-blend-mode',
    verdict: 'recorded',
    note: "an element's `blendMode` (REQ-63)",
    present: anyElement('blendMode', truthy),
  },
  ...rows(
    'recorded',
    "an element's `maskEdge` (REQ-48 item 3) — compared as presence, because a mask string is not cross-engine stable",
    'mask-image',
    '-webkit-mask-image',
    'clip-path',
  ),
  ...rows('recorded', "an element's `outline` (REQ-63) — the painted ring, distinct from the box border", 'outline-width', 'outline-style', 'outline-color', 'outline-offset'),
  { property: 'z-index', verdict: 'recorded', note: "an element's `zIndex` (REQ-48 item 2) — the paint order two 2D boxes cannot express" },
  {
    property: 'transform',
    verdict: 'recorded',
    note: "an element's `transformRotateDeg` and `transformScale` (REQ-48 item 1), decomposed from the matrix. A translate needs no axis: `box` is already the post-transform rect",
  },
  ...rows(
    'recorded',
    "an element's `motion` (REQ-48 item 1) — presence of a declared animation/transition, which is the only trace either leaves in a resting frame",
    'animation-name',
    'animation-duration',
    'animation-delay',
    'animation-direction',
    'animation-fill-mode',
    'animation-iteration-count',
    'animation-play-state',
    'animation-timing-function',
    'animation-timeline',
    'animation-range-start',
    'animation-range-end',
    'transition-property',
    'transition-duration',
    'transition-delay',
    'transition-timing-function',
    'transition-behavior',
  ),
  { property: 'content', verdict: 'recorded', note: "an element's `pseudo` (REQ-63) — `::before`/`::after` injected content, as presence" },
  ...rows(
    'recorded',
    "an element's `paddingTopPx`/`paddingRightPx`/`paddingBottomPx`/`paddingLeftPx` — on a form control since REQ-269, where the renderer's UA reset zeroes it and only an axis wins",
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'padding-block-start',
    'padding-block-end',
    'padding-inline-start',
    'padding-inline-end',
  ),
  {
    property: 'object-fit',
    verdict: 'recorded',
    note: "a media field's `objectFit` (REQ-48 item 4)",
    present: anyField('objectFit', truthy),
  },
  {
    property: 'object-position',
    verdict: 'recorded',
    note: "a media field's `objectPosition` (REQ-63)",
    present: anyField('objectPosition', truthy),
  },
  { property: 'color-scheme', verdict: 'recorded', note: "a band's `colorScheme`" },

  // ── declined: mechanism, or measured better elsewhere ─────────────────────
  ...rows(
    'declined',
    MECHANISM,
    'display',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'inset-block-start',
    'inset-block-end',
    'inset-inline-start',
    'inset-inline-end',
    'float',
    'clear',
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
    'max-height',
    'block-size',
    'inline-size',
    'min-block-size',
    'min-inline-size',
    'max-block-size',
    'max-inline-size',
    'box-sizing',
    'aspect-ratio',
    'flex-direction',
    'flex-wrap',
    'flex-grow',
    'flex-shrink',
    'flex-basis',
    'order',
    'align-items',
    'align-self',
    'align-content',
    'justify-content',
    'justify-items',
    'justify-self',
    'place-items',
    'place-content',
    'place-self',
    'row-gap',
    'column-gap',
    'grid-template-columns',
    'grid-template-rows',
    'grid-template-areas',
    'grid-auto-flow',
    'grid-auto-columns',
    'grid-auto-rows',
    'grid-column-start',
    'grid-column-end',
    'grid-row-start',
    'grid-row-end',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'margin-block-start',
    'margin-block-end',
    'margin-inline-start',
    'margin-inline-end',
    'columns',
    'column-count',
    'column-width',
    'column-rule-width',
    'column-rule-style',
    'column-rule-color',
    'break-before',
    'break-after',
    'break-inside',
    'orphans',
    'widows',
    'contain',
    'contain-intrinsic-size',
    'table-layout',
    'border-collapse',
    'border-spacing',
    'visibility',
  ),
  {
    property: 'transform-origin',
    verdict: 'declined',
    note:
      'no axis is needed: `box` is the EFFECTIVE post-transform rect, so an origin ' +
      'displacement already surfaces as a position delta (REQ-48 item 1)',
  },
  ...rows(
    'declined',
    'text wrapping is MEASURED, not transcribed: REQ-88 derives `nowrapFromPx` from whether ' +
      'the reference held the run on one line at every captured width, and each width has its own ' +
      'measured `box`/`renderedTextBox`. A declaration says what the author asked for; the ladder ' +
      'says what the page did, and the second is what a reproduction has to match',
    'white-space',
    'white-space-collapse',
    'text-wrap-mode',
    'text-wrap-style',
    'word-break',
    'line-break',
    'overflow-wrap',
    'word-wrap',
    'hyphens',
  ),
  ...rows(
    'declined',
    'an interaction affordance, not paint. The rendered frame carries no trace of it, and a ' +
      'reproduction derives the affordance from the node role it folds to (a `control`, a `link`) ' +
      'rather than from a transcribed cursor',
    'cursor',
    'pointer-events',
    'user-select',
    '-webkit-user-select',
    'touch-action',
    '-webkit-tap-highlight-color',
    'caret-color',
    'accent-color',
    'resize',
    'appearance',
    '-webkit-appearance',
    'scroll-behavior',
    'scroll-margin-top',
    'scroll-padding-top',
    'scroll-snap-type',
    'scroll-snap-align',
    'overscroll-behavior',
    'overscroll-behavior-x',
    'overscroll-behavior-y',
  ),
  ...rows(
    'declined',
    'a rasteriser hint: it changes how the SAME glyphs or pixels are antialiased, and the ' +
      'fidelity gate compares layout boxes rather than subpixel coverage precisely because that ' +
      'differs per engine anyway',
    '-webkit-font-smoothing',
    '-moz-osx-font-smoothing',
    'text-rendering',
    'font-kerning',
    'font-optical-sizing',
    'font-size-adjust',
    'font-language-override',
    'image-rendering',
    'shape-rendering',
    'will-change',
    'backface-visibility',
    'perspective',
    'perspective-origin',
    'transform-style',
    'isolation',
  ),
  ...rows(
    'declined',
    'the marker GLYPH is the rendered fact and is recorded as `listMarker`; where the browser ' +
      'hangs it, and an image standing in for it, are placement mechanisms around that glyph',
    'list-style-position',
    'list-style-image',
  ),

  // ── not expressible: a capability item, not an instrument one ─────────────
  ...rows(
    'not-expressible',
    "L1 pins a surface's background to `cover / center / no-repeat` (BUG-13), and REQ-136 records " +
      'unpinning it as phase 2 in as many words. Recording the reference\'s framing would put a ' +
      'value in the bundle that the renderer has no axis to consume',
    'background-size',
    'background-position',
    'background-position-x',
    'background-position-y',
    'background-repeat',
    'background-attachment',
    'background-origin',
  ),
  ...rows(
    'not-expressible',
    "L1's `textDecoration` is a closed enum of LINES (`underline`/`line-through`/`overline`); it " +
      'carries no colour, style, thickness or offset for the line it paints',
    'text-decoration-color',
    'text-decoration-style',
    'text-decoration-thickness',
    'text-underline-offset',
    'text-underline-position',
    'text-decoration-skip-ink',
  ),
  ...rows(
    'not-expressible',
    'the capture models no vector leaf: `<svg>` is not in the field selector and L1 has no vector ' +
      'kind, so an inline icon reaches a reproduction as nothing at all — its paint is the second ' +
      'problem, not the first',
    'fill',
    'fill-opacity',
    'fill-rule',
    'stroke',
    'stroke-width',
    'stroke-opacity',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-dasharray',
  ),
  ...rows(
    'not-expressible',
    'L1 has no clipping axis. A `mask` is a PAINT (it feathers what is drawn) and is recorded; ' +
      '`overflow: hidden` is a containment rule about what children may escape, which a flat ' +
      'absolutely-positioned tree has no vocabulary for',
    'overflow',
    'overflow-x',
    'overflow-y',
    'clip',
    'text-overflow',
    '-webkit-line-clamp',
  ),
  ...rows(
    'not-expressible',
    'L1 carries `letterSpacingPx` but no word-spacing or indent axis, so a recorded value would ' +
      'have nothing to consume it',
    'word-spacing',
    'text-indent',
  ),
  ...rows(
    'not-expressible',
    'a glyph-selection axis L1 does not carry. `fontVariantCaps` is the one variant that changes ' +
      'the silhouette enough for the diff to see, and it IS recorded; the rest select alternate ' +
      'glyphs within the same metrics',
    'font-stretch',
    'font-feature-settings',
    'font-variation-settings',
    'font-variant-ligatures',
    'font-variant-numeric',
    'font-variant-east-asian',
    'font-variant-alternates',
    'font-variant-position',
    'font-variant-emoji',
    '-webkit-text-stroke-width',
    '-webkit-text-stroke-color',
    'text-emphasis-style',
    'text-emphasis-color',
  ),
  ...rows(
    'not-expressible',
    'L1 lays out in one writing mode. A right-to-left or vertical flow is a capability the ' +
      'substrate does not have, and no reference has yet needed it',
    'direction',
    'writing-mode',
    'unicode-bidi',
    'text-orientation',
  ),
  ...rows(
    'not-expressible',
    "L1's `border` is a solid typed edge; a bitmap or gradient border-image has no axis",
    'border-image-source',
    'border-image-slice',
    'border-image-width',
    'border-image-outset',
    'border-image-repeat',
  ),
  ...rows(
    'not-expressible',
    'only `mask-image` is recorded, as presence. The mask\'s own framing has no L1 axis for the ' +
      'same reason a background\'s does: `l1MaskSchema` describes a typed crop, not a transcribed layer',
    'mask-size',
    'mask-position',
    'mask-repeat',
    'mask-mode',
    'mask-composite',
    'mask-clip',
    'mask-origin',
    'mask-type',
  ),

  // ── DOM facts ─────────────────────────────────────────────────────────────
  {
    property: 'dom:href',
    verdict: 'recorded',
    note: "an element's `href` (REQ-269) — site-internal when same-origin, absolute when cross-origin",
    present: anyElement('href', truthy),
  },
  { property: 'dom:role', verdict: 'recorded', note: "an element's `a11yRole` — the browser's own resolved role" },
  { property: 'dom:aria-label', verdict: 'recorded', note: "a field's `accessibleName`, with `nameSource: 'aria'`" },
  { property: 'dom:aria-labelledby', verdict: 'recorded', note: "a field's `accessibleName`, with `nameSource: 'aria'`" },
  { property: 'dom:placeholder', verdict: 'recorded', note: "a field's `accessibleName`, with `nameSource: 'placeholder'` — the witness for label-inside vs label-above" },
  { property: 'dom:alt', verdict: 'recorded', note: "a media field's `alt` (REQ-92)", present: anyField('alt', truthy) },
  { property: 'dom:src', verdict: 'recorded', note: "a media field's `src` (REQ-92)", present: anyField('src', truthy) },
  ...rows('recorded', "a media field's `intrinsicAspect` (REQ-48 item 4) — the natural w/h the attributes declare", 'dom:width', 'dom:height'),
  {
    property: 'dom:type',
    verdict: 'recorded',
    note: "a form control's `controlType` (REQ-93) — the a11y role flattens every single-line control to `textbox`, and this separates them",
    present: anyField('controlType', truthy),
  },
  {
    property: 'dom:action',
    verdict: 'recorded',
    note: "a form control's `formAction` (REQ-93) — the enclosing form's resolved endpoint",
    present: anyField('formAction', truthy),
  },
  // ── the four REQ-275 landed, and the reason they are all DOM facts ────────
  //
  // The audit's first run over the three stored references returned exactly
  // these four as used-and-undecided, and nothing from the CSS half. That is a
  // result, not a coincidence: REQ-47/48/63/265/269 have swept the paint surface
  // repeatedly, so what was left uncovered was the half no pixel gate can see —
  // whether a link opens a new tab, and what a form actually submits.
  {
    property: 'dom:target',
    verdict: 'recorded',
    note: "an element's `newTab` (REQ-275) — recorded as the derived boolean L1 carries, not the raw target",
    present: (c) => [...captureRuns(c), ...captureFields(c)].some((e) => typeof e.newTab === 'boolean'),
  },
  {
    property: 'dom:name',
    verdict: 'recorded',
    note: "a form control's `controlName` (REQ-275) — the key it submits under, which the fold otherwise slugifies from the visible label",
    present: anyField('controlName', truthy),
  },
  {
    property: 'dom:method',
    verdict: 'recorded',
    note: "a form control's `formMethod` (REQ-275) — the verb beside the endpoint `formAction` already records",
    present: anyField('formMethod', truthy),
  },
  {
    property: 'dom:required',
    verdict: 'recorded',
    note: "a form control's `required` (REQ-275) — the obligation the browser enforces and no painted axis holds",
    present: anyField('required', (v) => v === true),
  },
  ...rows(
    'declined',
    'a loading hint. It changes when bytes arrive, never what is painted, and a reproduction ' +
      'makes its own delivery decisions (REQ-234) rather than inheriting the reference\'s',
    'dom:loading',
    'dom:decoding',
    'dom:fetchpriority',
    'dom:srcset',
    'dom:sizes',
  ),
  {
    property: 'dom:rows',
    verdict: 'declined',
    note:
      "a textarea's `rows` is a sizing mechanism; the measured `box` carries the height it " +
      'produced, which is the rendered fact (DOC-13 §3)',
  },
  {
    property: 'dom:tabindex',
    verdict: 'declined',
    note: 'focus order is document order in a reproduction, and the renderer emits controls in the order the fold laid them out',
  },
  {
    property: 'dom:data-*',
    verdict: 'declined',
    note: 'framework bookkeeping (Elementor widget ids, Tailwind markers). It names the tool that built the page, not anything the page renders',
  },
  ...rows(
    'declined',
    'an inline event handler is page SCRIPT. A reproduction mounts behaviour through a vetted ' +
      'capability module, never by transcribing the reference\'s script — that is the structured-only ' +
      'invariant, not a capture limitation',
    'dom:onmouseover',
    'dom:onmouseout',
    'dom:onclick',
    'dom:onsubmit',
  ),
  ...rows(
    'not-expressible',
    'L1 has no ARIA axis beyond the role a node folds to and `link.ariaLabel`. A live region, a ' +
      'current-page marker or a described relationship has nothing to land on',
    'dom:aria-hidden',
    'dom:aria-current',
    'dom:aria-live',
    'dom:aria-controls',
    'dom:aria-expanded',
    'dom:aria-describedby',
    'dom:aria-roledescription',
  ),
]

/** Every decision, indexed by property. */
export const CAPTURE_COVERAGE: ReadonlyMap<string, CoverageEntry> = new Map(
  REGISTER.map((entry) => [entry.property, entry]),
)
