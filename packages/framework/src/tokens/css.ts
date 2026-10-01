import type { FontFace, L1TextStyles } from '@1stcontact/site-schema'
import type { DeepPartial, ThemeTokens } from './contract'
import { defaultTokens } from './defaults'
import { cssFontFamily } from '../l1/render'

/**
 * Generate the site's theme CSS: a `:root` block declaring one CSS custom
 * property per theme token (DOC-7 §4.2).
 *
 * Any slot the caller omits is filled from {@link defaultTokens}, so the output
 * always covers the full token surface. Variable naming is deterministic (see
 * REQ-4): `--space-<step>`, `--radius-<step>`, etc.
 *
 * REQ-114 — no `--color-*` property is emitted any more, and there is no
 * dark-mode override hook. Colour left the token surface for the L1 palette
 * model (DOC-23 §5); the dark override existed only to re-declare palette roles
 * and had no callers, so it went with them rather than being ported to a model
 * it was not designed against.
 */
export function generateThemeCss(tokens?: DeepPartial<ThemeTokens>, textStyles?: L1TextStyles): string {
  const t = mergeTokens(defaultTokens, tokens)

  const vars: string[] = [
    // REQ-350 — one property per named text style that sets a family, generated
    // FROM the style, so a style changed once changes every L1 run that names it
    // and every legacy consumer of `--font-family-<name>` alike. The type scale,
    // weights, line heights, tracking and sub-scales the theme used to emit had
    // no live reader and went with the theme's typography group.
    ...Object.entries(textStyles ?? {}).flatMap(([name, style]) =>
      // The renderer's own family sanitiser: a style carries nothing into a
      // stylesheet that a run could not.
      cssFontFamily(style.fontFamily) ? [`--font-family-${name}: ${cssFontFamily(style.fontFamily)};`] : [],
    ),
    ...mapVars('--space-', t.spacing),
    ...mapVars('--radius-', t.radius),
    ...mapVars('--shadow-', t.shadow),
    ...mapVars('--container-', t.container),
    ...mapVars('--breakpoint-', t.breakpoints),
  ]

  let css = `:root {\n${vars.map((v) => `  ${v}`).join('\n')}\n}`

  // Site-declared web fonts (REQ-24) become `@font-face` rules ahead of `:root`
  // so the families are registered before any custom property references them.
  const faces = fontFaceRules(t.fonts)
  if (faces) css = `${faces}\n\n${css}`

  return css
}


/**
 * Site-declared fonts → concatenated `@font-face` rules (REQ-24). Each field is
 * a validated structured value from the site's theme (never raw CSS): the
 * family and asset `src` are emitted verbatim, a `format()` hint is derived from
 * the asset extension, and `font-display` defaults to `swap`.
 */
function fontFaceRules(fonts?: FontFace[]): string {
  if (!fonts || fonts.length === 0) return ''
  return fonts.map(fontFaceBlock).join('\n\n')
}

function fontFaceBlock(f: FontFace): string {
  const lines = [`  font-family: "${f.family}";`, `  src: url("${f.src}")${formatHint(f.src)};`]
  if (f.weight) lines.push(`  font-weight: ${f.weight};`)
  if (f.style) lines.push(`  font-style: ${f.style};`)
  lines.push(`  font-display: ${f.display ?? 'swap'};`)
  return `@font-face {\n${lines.join('\n')}\n}`
}

/** CSS `format(...)` hint derived from a font asset's file extension. */
function formatHint(src: string): string {
  const ext = src.split('.').pop()?.toLowerCase()
  const fmt =
    ext === 'woff2'
      ? 'woff2'
      : ext === 'woff'
        ? 'woff'
        : ext === 'ttf'
          ? 'truetype'
          : ext === 'otf'
            ? 'opentype'
            : undefined
  return fmt ? ` format("${fmt}")` : ''
}

/** Flat record → `<prefix><key>: <value>;` declarations, keys used verbatim. */
function mapVars(prefix: string, group: Record<string, string>): string[] {
  return Object.entries(group).map(([key, value]) => `${prefix}${key}: ${value};`)
}


/** Recursively overlay `override` onto `base`, returning a complete tokens object. */
function mergeTokens(base: ThemeTokens, override?: DeepPartial<ThemeTokens>): ThemeTokens {
  if (!override) return base
  return deepMerge(base, override) as ThemeTokens
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override === undefined ? base : override
  }
  const out: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue
    out[key] = key in base ? deepMerge(base[key], value) : value
  }
  return out
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
