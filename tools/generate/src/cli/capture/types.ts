/**
 * REQ-12 — Reference Capture Model ([[DOC-13]]) type surface.
 *
 * Two families of types live here:
 *   1. The {@link BrowserDriver} seam — a pure interface mirroring the
 *      Cloudflare Browser Rendering / `@cloudflare/puppeteer` surface. A local
 *      Playwright driver implements it now (DOC-13 §2.2); a CF driver is a later
 *      drop-in swap. Nothing above this seam knows which driver it holds.
 *   2. The `capture.json` schema — the catalog-agnostic structured essence
 *      (DOC-13 §4) that is the AI's primary input.
 */

/** A rectangle in full-page document coordinates (px, origin top-left). */
export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** Screen dimensions for a screenshot / viewport. */
export interface Viewport {
  width: number
  height: number
}

/**
 * One intercepted network response, cached verbatim during navigation. The
 * pipeline mirrors these bytes into the bundle's `assets/` so capture is
 * re-extractable offline (DOC-13 §3, §9).
 */
export interface CapturedResponse {
  url: string
  status: number
  contentType: string | null
  body: Uint8Array
}

/**
 * Page-health signals captured *during* navigation (REQ-39). These are the
 * observations a screenshot cannot make: a page that renders but logs a console
 * error, throws an uncaught exception, or fails a subresource request is broken
 * even though a screenshot may look plausible. The conformance harness reads
 * these to flag safety violations; the capture pipeline ignores them.
 */
export interface PageDiagnostics {
  /** `console.error(...)` messages emitted during load. */
  consoleErrors: string[]
  /** Uncaught exceptions / unhandled rejections thrown in page scope. */
  pageErrors: string[]
  /** URLs of requests that failed outright (network error, not a 4xx/5xx body). */
  failedRequests: string[]
  /**
   * Every URL the page *requested* during navigation — issued or not, succeeded
   * or not (REQ-40). Unlike {@link failedRequests} (a subset that errored) and
   * `responses()` (a subset that returned bytes), this records the full egress
   * surface, so the security conformance dimension can flag any request whose
   * origin falls outside the asset allowlist even when it never resolves.
   */
  requestedUrls: string[]
}

/**
 * The driver seam. Mirrors CF Browser Rendering: navigate a *live* URL (JS
 * hydrates against its real origin), screenshot, evaluate a script in page
 * scope, read the post-JS DOM, and expose every response seen during
 * navigation. **Never** exposes a `setContent()` — a pre-fetched shell would
 * re-create static blindness (DOC-13 §2.3).
 */
export interface BrowserDriver {
  /**
   * Navigate live and wait for network idle, caching every response. An
   * optional {@link Viewport} sizes the page *before* load so responsive layout
   * and media queries resolve at that width (REQ-39 fast-tier viewport axis).
   */
  navigate(url: string, viewport?: Viewport): Promise<void>
  /** Full-page PNG bytes. */
  screenshot(viewport?: Viewport): Promise<Uint8Array>
  /** Evaluate a JS expression string in page scope; returns its JSON value. */
  query<T = unknown>(script: string): Promise<T>
  /** Every response cached during {@link navigate}. */
  responses(): CapturedResponse[]
  /** Page-health signals observed during {@link navigate} (REQ-39). */
  diagnostics(): PageDiagnostics
  /** The rendered, post-JS DOM (`page.content()`). */
  content(): Promise<string>
  /** Release the browser/page. */
  close(): Promise<void>
}

/** Injectable factory so tests can supply a fake driver (DOC-13 §2.2). */
export type BrowserDriverFactory = () => Promise<BrowserDriver>

// ── capture.json schema (DOC-13 §4) ──────────────────────────────────────────

export type ColorUsage = 'text' | 'background' | 'accent'

export interface ThemeColor {
  /** Painted color as `#rrggbb`, resolved from computed styles (var() gone). */
  hex: string
  usage: ColorUsage
  /** How many visible elements paint with this color+usage. */
  freq: number
}

export interface ThemeFont {
  family: string
  role: 'heading' | 'body'
  weights: number[]
  /** Mirrored font files under the bundle's `assets/` (relative paths). */
  files: string[]
}

export interface Theme {
  colors: ThemeColor[]
  fonts: ThemeFont[]
  /** Distinct rendered font sizes (px), ascending. */
  typeScale: number[]
  /** Distinct block spacing values (px), ascending. */
  spacingScalePx: number[]
  /** Measured content container width (px), or null if unbounded. */
  containerMaxWidthPx: number | null
}

export type BackgroundKind = 'color' | 'image' | 'gradient'

export interface Background {
  kind: BackgroundKind
  /** Painted background color (`#rrggbb`) when present. */
  color?: string
  /** Mirrored image asset path when the band paints an image. */
  image?: string
  /** Raw computed gradient when the band paints a gradient. */
  gradient?: string
  /** Text-over-image overlay — first-class in DOC-13 §4. */
  overlay?: { color: string; opacity: number }
}

export interface Layout {
  /** True when visible text is painted over a background image. */
  textOverImage: boolean
  contentAlign: 'left' | 'center' | 'right'
  arrangement: 'stack' | 'row'
  columns: number
  contentMaxWidthPx: number | null
  /**
   * Vertical anchor of the section's content within its box (REQ-31): the
   * content block's centre as a fraction of box height — 0 = pinned to the top,
   * 0.5 = centred, 1 = pinned to the bottom. Measured from geometry, so it's
   * robust to *how* it's achieved (`pt-80` padding vs flex `justify-end`) — the
   * gigabytealchemy hero's low anchor was missed precisely because nothing
   * compared it. `null` when the section paints no text.
   */
  contentAnchorRatio: number | null
}

/**
 * A text-fill gradient, normalized from the computed `background-image` of an
 * element painted with `background-clip: text` (REQ-31). Direction is captured
 * as a concrete angle so a horizontal (90°) vs vertical (180°) sweep — the
 * gigabytealchemy wordmark delta — is a mechanically-comparable field, not a
 * judgement call left to the eye.
 */
export interface TextGradient {
  /** CSS angle in degrees (0 = to-top, 90 = to-right, 180 = to-bottom), or null if unparseable. */
  angleDeg: number | null
  /** Painted colour stops in order, each `#rrggbb`. */
  stops: string[]
}

/** A left-edge accent bar (REQ-31): `border-l-4 border-emerald-400` and kin. */
export interface BorderTreatment {
  widthPx: number
  color: string
}

/** REQ-47 — how an element sits relative to the previous element in its section. */
export type Arrangement = 'row' | 'stack'

/** REQ-47 — where a control's accessible name is rendered. */
export type NameSource = 'placeholder' | 'label' | 'aria' | 'text' | 'alt'

/**
 * REQ-47 — per-element rendered geometry, shape and structure, shared by text
 * runs and text-free fields. All optional so pre-REQ-47 `capture.json` bundles
 * (and synthetic value manifests) still parse; the diff only compares fields
 * present on the expected side. Every field is a *rendered* fact, never a CSS
 * mechanism — the layer where two different DOMs that render identically match.
 */
export interface ElementGeometry {
  /** `getBoundingClientRect()` box in full-page document coords. */
  box?: Box
  /** Largest computed corner radius in px (0 when square). */
  borderRadiusPx?: number
  /** Computed `box-shadow` when a shadow is painted, else null. */
  boxShadow?: string | null
  /** ARIA role — the browser's framework-agnostic semantic label. */
  a11yRole?: string
  /** Rendered arrangement relative to the previous element in the section. */
  arrangement?: Arrangement | null
  /**
   * REQ-48 (item 2) — effective paint order: the computed `z-index` resolved to
   * an integer (`auto` → 0). Two elements correctly positioned but wrongly
   * stacked — a portrait painted over its caption, a collage layer under instead
   * of over, a scrim behind instead of in front — are identical on every 2D
   * geometry field; only this paint-order axis separates them.
   */
  zIndex?: number
  /**
   * REQ-48 (item 3) — treatments REQ-47's shape (radius/border/box-shadow) can't
   * hold. Each is the raw computed value when painted, else null; the diff
   * compares *presence* (has-glow vs not, rounded-vs-masked edge), the pixel-
   * obvious signal, not brittle cross-engine value strings.
   */
  /** Computed `filter` when non-`none` (blur/drop-shadow halo, saturate), else null. */
  filter?: string | null
  /** Computed `text-shadow` when painted (glow / legibility shadow), else null. */
  textShadow?: string | null
  /** Computed `mask-image` or `clip-path` when the element is masked/clipped (feather halo, shaped edge), else null. */
  maskEdge?: string | null
  /**
   * REQ-48 (item 1) — transform rotation in degrees, decomposed from the computed
   * transform matrix (0 when none). A mis-rotated collage layer is a first-class
   * delta; `transform-origin` displacement, by contrast, needs no field because
   * {@link box} is already the *effective post-transform* rect and surfaces as a
   * position delta.
   */
  transformRotateDeg?: number
  /** REQ-48 (item 1) — transform uniform scale factor, decomposed from the matrix (1 when none). */
  transformScale?: number
  /**
   * REQ-48 (item 1) — declared motion: `animation` (keyframes / entrance /
   * scroll-reveal), `transition` (hover-transition), `both`, or null. Presence is
   * what the resting frame can't hold — a hover-scale or entrance leaves no signal
   * at rest, but its declaration does.
   */
  motion?: 'animation' | 'transition' | 'both' | null
}

/**
 * REQ-47 — a text-free rendered element (input box, textarea, select, divider).
 * No text join key, so the diff pairs it on `a11yRole + document order`.
 * `nameSource` is the a11y-tree fact that separates placeholder-inside
 * (`placeholder`) from label-above (`label`/`aria`).
 */
export interface Field extends ElementGeometry {
  a11yRole: string
  box: Box
  /** Resolved accessible name (may be empty when unlabelled). */
  accessibleName: string
  /** Where the accessible name comes from, or null when unnamed. */
  nameSource: NameSource | null
  /** REQ-48 (item 4) — computed `object-fit` for a media element (`img`), else null. */
  objectFit?: string | null
  /** REQ-48 (item 4) — intrinsic (natural) aspect ratio w/h for a media element, else null. */
  intrinsicAspect?: number | null
}

export interface ContentRun extends ElementGeometry {
  role: 'heading' | 'subheading' | 'body' | 'link' | 'action' | 'listitem'
  /** Verbatim text (DOC-13 §5). */
  text: string
  color: string
  fontFamily: string
  /** REQ-48 (item 7) — false when the intended named face did not resolve (a fallback rendered). */
  fontLoaded?: boolean
  fontSizePx: number
  fontWeight: number
  // ── REQ-31 per-element value manifest fields ─────────────────────────────
  // Optional so pre-REQ-31 capture.json bundles still parse; the values-diff
  // only compares fields that are present on the expected side.
  /** Computed line-height in px, when resolvable to a length. */
  lineHeightPx?: number
  /** Computed letter-spacing in px (0 for `normal`). */
  letterSpacingPx?: number
  /** Text-fill gradient when the element paints one (`background-clip: text`). */
  gradient?: TextGradient | null
  /** Left-edge accent bar when the element paints one. */
  borderLeft?: BorderTreatment | null
  /** Computed left padding/indent in px. */
  paddingLeftPx?: number
  /**
   * REQ-35 — true when {@link color} could not be resolved from computed styles
   * and fell back to the `#000000`/`#ffffff` sentinel (a transparent/unpainted
   * text colour). Marks the value as low-confidence so the values-diff does not
   * hold a re-render to a colour the capture only guessed. Optional so pre-REQ-35
   * bundles still parse.
   */
  colorInferred?: boolean
}

export interface SectionItem {
  /** Flattened verbatim text runs of one repeated sub-unit (e.g. a card). */
  content: ContentRun[]
}

export interface Section {
  box: Box
  /** Crop rectangle into `screenshot.full.png` (same coords as `box`). */
  screenshot: Box
  background: Background
  layout: Layout
  content: ContentRun[]
  items: SectionItem[]
  /** REQ-47 — text-free rendered elements (form controls, dividers) in this section. */
  fields: Field[]
}

export interface CaptureAsset {
  id: string
  kind: 'image' | 'font' | 'stylesheet' | 'script' | 'other'
  /** Original absolute source URL. */
  src: string
  /** Path within the bundle's `assets/`. */
  localPath: string
  width?: number
  height?: number
  role?: string
}

/** The structured essence — `capture.json` (DOC-13 §4). */
export interface Capture {
  url: string
  host: string
  path: string
  capturedAt: string
  viewport: Viewport
  theme: Theme
  sections: Section[]
  assets: CaptureAsset[]
}

/** Everything the pipeline produces in memory, before it is written to disk. */
export interface CaptureResult {
  capture: Capture
  screenshot: Uint8Array
  renderedHtml: string
  rawHtml: string
  /** Mirrored subresources, keyed by their bundle-relative `assets/…` path. */
  assetBytes: Map<string, Uint8Array>
}
