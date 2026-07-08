/**
 * Shared per-instance dial enumerations (DOC-7 §4.1). Dial values are semantic
 * names; each module's scoped CSS maps them to concrete token references (e.g.
 * the `spacingTop` value `md` resolves to `var(--space-8)`). Centralised here so
 * the chrome modules don't drift from one another.
 */

/** Vertical spacing dial values (spacingTop / spacingBottom). */
export const SPACING_DIAL = ['none', 'sm', 'md', 'lg', 'xl'] as const

/** Surface (background + text treatment) dial values. */
export const SURFACE_DIAL = ['default', 'subtle', 'inverse', 'accent'] as const

/** Hero size dial values. */
export const SIZE_DIAL = ['sm', 'md', 'lg'] as const

/**
 * Hero band height dial. `auto` sizes the band to its content (default);
 * `fold` fills the viewport to the fold (min-height 100vh) with the content
 * vertically centred — used where the hero image is meant to fill the screen.
 */
export const HEIGHT_DIAL = ['auto', 'fold'] as const

/**
 * Header wordmark size dial (independent of the surface/heading scale). Steps
 * up from the default `md` so a display wordmark can read at hero scale.
 */
export const LOGO_SIZE_DIAL = ['sm', 'md', 'lg', 'xl'] as const

/**
 * Band width dial. `full` (default) spans the container; `half` flexes to one
 * of two columns — consecutive `half` bands are grouped into a shared row by
 * the render pipeline, so e.g. a subscribe + contact form sit side by side.
 */
export const WIDTH_DIAL = ['full', 'half'] as const

/** Horizontal alignment dial values (block alignment + text-align share these). */
export const ALIGN_DIAL = ['left', 'center'] as const

/** Footer content layout dial. `center` stacks centred; `spread` puts the
 * copyright and links on opposite ends of one row (justified, left/right). */
export const FOOTER_LAYOUT_DIAL = ['center', 'spread'] as const

/** Inter-card / inter-item gap dial values (services-grid). */
export const GAP_DIAL = ['tight', 'normal', 'loose'] as const

/**
 * Grid-wide card chrome for services-grid (REQ-36 / CAP-1). `default` draws the
 * standard filled + bordered card; `bare` strips the card's fill, border,
 * radius and padding so the cards read as plain text columns composited on the
 * band itself — for dark, art-directed grids (the joyfulculinary "Our Offerings"
 * / process grids) where a white card would break the composition. Card title
 * and body inherit the band's text colour; chrome (badge, accent border) is
 * suppressed under `bare`, so the dial is orthogonal to `variant` and composes
 * with every layout. Omitting the dial (`default`) leaves cards unchanged.
 */
export const CARD_SURFACE_DIAL = ['default', 'bare'] as const

/**
 * Wordmark font-family selection for the header logo (REQ-24). `display`
 * selects the site's bespoke display face (`--font-family-display`), enabling a
 * wordmark in a font distinct from the theme's heading/body families.
 */
export const LOGO_FONT_DIAL = ['heading', 'body', 'display'] as const

/**
 * Wordmark colour treatment for the header logo (REQ-24). `gold` fills the
 * wordmark glyphs with a metallic-gold gradient (background-clip: text) keyed to
 * the site's `--color-accent`; `plain` inherits the header's text colour.
 * `gradient` (REQ-32) reads a structured `logoGradient` content field — an
 * arbitrary-direction, multi-stop, palette-role-backed sweep — for wordmarks
 * whose gradient the fixed `gold` recipe can't express.
 */
export const LOGO_TREATMENT_DIAL = ['plain', 'gold', 'gradient'] as const

/**
 * Palette roles selectable as gradient stops / callout accents (REQ-32). A
 * closed, token-backed set — each resolves to `var(--color-<role>)` — so a
 * gradient or callout treatment never carries a raw colour. `neutralCool` is the
 * REQ-32 cool-neutral role. Kebab-cased to match the emitted custom-property
 * names (`neutral-cool` → `--color-neutral-cool`).
 */
export const TREATMENT_ROLE_DIAL = [
  'primary',
  'accent',
  'secondary',
  'muted',
  'neutral-cool',
  // `accent-light` / `accent-deep` (REQ-33) are optional warm companions to the
  // brand `accent` — a lighter and a deeper warm hue. They let a multi-stop warm
  // brand gradient (e.g. a gold→orange wordmark) and a solid warm highlight text
  // be expressed as roles, so no raw colour ever reaches a gradient stop.
  'accent-light',
  'accent-deep',
  // `accent-mid` (REQ-20) is a third warm companion between `accent-light` and
  // `accent-deep`, so a multi-stop warm gradient can pass through a distinct
  // mid hue (the gigabytealchemy wordmark's lighter orange before its deep
  // orange) from a palette role rather than a raw colour.
  'accent-mid',
] as const

/**
 * Hero subhead/body colour dial (REQ-33). `inherit` (default) keeps the surface
 * text colour; any palette role tints the whole subhead block that role — e.g. a
 * gold lead paragraph over an inverse hero. A closed set (role names, never a raw
 * colour), so the framework computes the `var(--color-<role>)` fill.
 */
export const SUBHEAD_COLOR_DIAL = ['inherit', ...TREATMENT_ROLE_DIAL] as const

/**
 * Hero subhead/body scale dial (REQ-33). Sizes the lead paragraph and the body
 * copy independently of the heading `size` — a hero can carry a modest heading
 * but a prominent lead subtitle (e.g. gigabytealchemy). `md` (default) preserves
 * the prior xl/base scale; `sm`/`lg` step the pair down/up together.
 */
export const SUBHEAD_SIZE_DIAL = ['sm', 'md', 'lg'] as const

/**
 * Hero subhead/body font-weight dial (REQ-49). Sets the lead/body weight
 * independently of the heading weight and of the subhead `size` — a hero can
 * carry a bold heading over a delicate light lead (e.g. gigabytealchemy's
 * `font-light` 300 subhead). A closed set mapped to the `--font-weight-*`
 * tokens: `regular` (default) emits no override, so the subhead keeps the
 * inherited body weight and a hero that omits the dial is unchanged; `light`
 * steps down (300, added to the default weight scale for this dial), `medium`/
 * `semibold` step up. Token-backed, never a raw weight.
 */
export const SUBHEAD_WEIGHT_DIAL = ['light', 'regular', 'medium', 'semibold'] as const

/**
 * Contact-form submit-button colour treatment (REQ-33). `primary` (default)
 * fills the button with the brand primary; `neutral` fills it with the dark
 * neutral text colour and a near-white label — a high-contrast dark button
 * (e.g. gigabytealchemy's black "Send message") on a light band.
 */
export const SUBMIT_TREATMENT_DIAL = ['primary', 'neutral'] as const

/**
 * Contact-form submit-label foreground role (REQ-45). `auto` (default) keeps the
 * label colour the `submitTreatment` derives from its surface — unchanged
 * fallback. Any palette role paints the label that role instead, so a button can
 * carry a legible on-primary label (e.g. `bg` for a white "Send message") rather
 * than inheriting a surface tint that renders cream. A closed role set (never a
 * raw colour) — the framework computes the `var(--color-<role>)` fill, mirroring
 * the hero `subheadColor` treatment.
 */
export const SUBMIT_FOREGROUND_DIAL = ['auto', ...TREATMENT_ROLE_DIAL, 'bg'] as const

/**
 * Constrained content-column width (REQ-45). Sizes the content column *within*
 * the section's full-width (`container-default`) frame, so the existing `align`
 * dial governs where that column sits: `left` (default) pins it to the frame's
 * left gutter — the same edge as the header/hero content — while `center`
 * centres it. `default` (dial default) fills the frame, so a section that omits
 * the dial is unchanged; `narrow`/`wide` cap the column to the matching
 * `--container-*` token. This is what lets a body column read as a narrow
 * left-aligned measure (fixing cumulative vertical drift) instead of a wide
 * centred one.
 *
 * `readable` (REQ-49) is a fourth step — a reading measure (`--container-readable`,
 * ~48rem/768px by default) between `narrow` and `default`. It exists because one
 * `narrow` token cannot serve two different constrained columns at once: the
 * gigabytealchemy hero body is `max-w-3xl` (768px) while its text sections are
 * `max-w-4xl` (896px, and `container.narrow` is set to 896 to serve them). A hero
 * that reused `narrow` overshot 768 by 128px; `readable` gives the hero its own
 * measure, decoupled from the text-block `narrow`.
 */
export const CONTENT_WIDTH_DIAL = ['default', 'narrow', 'readable', 'wide'] as const

/**
 * Letter-spacing (tracking) treatment for display type (REQ-45) — hero heading +
 * header wordmark. A closed enum mapped to em steps (never a raw value): `normal`
 * (default) is `0`, so type that omits the dial is unchanged; `tight`/`tighter`
 * pull the glyphs in for a large display setting (a wide heading/wordmark reads
 * loose at scale). Token-backed via the `--tracking-*` custom properties.
 */
export const TRACKING_DIAL = ['normal', 'tight', 'tighter'] as const

/**
 * Line-height (leading) treatment (REQ-45) — currently the hero subhead. A closed
 * enum mapped to the `--line-height-*` tokens so leading is set independently of
 * the global relaxed default: `relaxed` (dial default) preserves the prior
 * `--line-height-relaxed`, so a subhead that omits the dial is unchanged;
 * `normal`/`tight` pull the lines together for a denser subhead. `snug` (REQ-49)
 * is an intermediate step between `tight` and `normal` (~1.33 in the default
 * scale) for a reference whose leading sits below the loose `normal` but above
 * the very tight `tight` — the gigabytealchemy hero subhead measured 1.33.
 */
export const LINE_HEIGHT_DIAL = ['tight', 'snug', 'normal', 'relaxed'] as const

/**
 * Gradient sweep direction (REQ-32) — the eight principal directions, kept as a
 * closed enum (like `motionEasing`) rather than a raw angle so no free CSS value
 * enters an instance. Each maps to a CSS `linear-gradient` direction keyword.
 */
export const GRADIENT_DIRECTION_DIAL = [
  'to-top',
  'to-bottom',
  'to-left',
  'to-right',
  'to-tr',
  'to-tl',
  'to-br',
  'to-bl',
] as const

/**
 * Hero legibility scrim (REQ-32) — an opacity step of a dark neutral tint
 * painted over the background image so overlaid text stays legible. `none`
 * (default) paints nothing; `light`/`medium`/`strong` step up the opacity.
 */
export const SCRIM_DIAL = ['none', 'light', 'medium', 'strong'] as const

/**
 * Vertical anchor of a hero's content within a `fold`-height band (REQ-32).
 * `center` (default) matches the prior behaviour; `top`/`bottom` push the
 * content to the band's start/end — e.g. a hero whose copy sits low over the
 * image.
 */
export const CONTENT_ANCHOR_DIAL = ['top', 'center', 'bottom'] as const

/**
 * Fixed top inset for a `fold`-height hero's content (REQ-49). A separate axis
 * from `contentAnchor`: the anchor picks *where in the flex* the content sits
 * (start/centre/end), while this pins it a deliberate token-backed distance from
 * the band's top edge — the reference's `pt-80` (320px) top inset that no flex
 * anchor and no `spacingTop` step could express (the spacing scale topped out at
 * 6rem/96px). Paired with `contentAnchor: top` it reads as "content begins N px
 * from the fold top". `none` (default) applies no inset, so a hero that omits the
 * dial is unchanged. Steps map to the (now-extended) `--space-*` scale: `sm`
 * 4rem, `md` 8rem, `lg` 12rem, `xl` 20rem (=320px, the gigabytealchemy inset).
 */
export const CONTENT_OFFSET_TOP_DIAL = ['none', 'sm', 'md', 'lg', 'xl'] as const

/**
 * Hero content horizontal inset (gutter) dial (REQ-49 cap 5). Sets the
 * `padding-inline` on `.hero__inner` — the distance from the centred container's
 * edge to the content — as a token-backed step instead of the hardcoded 16px.
 * The front door's left edge is a deliberate choice ([[hero-fidelity-front-door]]):
 * the gigabytealchemy reference uses `px-6` (24px), landing its wordmark/heading/
 * subhead 8px right of our hardcoded `px-4` (16px). `sm` (default) is the prior
 * 16px so a hero that omits the dial is unchanged; `md` is 24px, `lg` 32px.
 * Maps to `--space-4`/`--space-6`/`--space-8`; token-backed, no raw padding.
 */
export const CONTENT_INSET_DIAL = ['sm', 'md', 'lg'] as const

/**
 * Heading colour treatment for the hero (REQ-28). `plain` inherits the surface
 * text colour; `accent` fills the heading with the solid site accent; `gold`
 * applies the same metallic-gold gradient as the header wordmark (REQ-24),
 * keyed to `--color-accent`. Used by the gigabytealchemy import, whose hero
 * heading is gold rather than the inverse-surface default (white). `gradient`
 * (REQ-32) reads a structured `headingGradient` content field for an
 * arbitrary-direction, multi-stop, palette-role-backed sweep.
 */
export const HEADING_TREATMENT_DIAL = ['plain', 'accent', 'gold', 'gradient'] as const

/**
 * Heading colour treatment for the flat-content modules — text-block and
 * services-grid (REQ-36). The colour-only subset of {@link HEADING_TREATMENT_DIAL}:
 * `plain` inherits the surface/band text colour (the prior default — a section
 * heading that omits the dial is unchanged); `accent` fills the heading with the
 * solid site accent (the joyfulculinary gold section headings); `gold` applies
 * the metallic-gold gradient. `gradient` is intentionally excluded — the
 * arbitrary-direction structured gradient needs a `headingGradient` content
 * field and stays a hero-only capability until a flat module actually needs it
 * (rather than shipping a silently-inert dial value).
 */
export const HEADING_COLOR_DIAL = ['plain', 'accent', 'gold'] as const
