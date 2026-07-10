import type { FontFace } from '@1stcontact/site-schema'
import type { DeepPartial, PartialPalette, ThemeTokens } from './contract'
import { defaultTokens } from './defaults'

/**
 * Generate the site's theme CSS: a `:root` block declaring one CSS custom
 * property per theme token (DOC-7 §4.2), plus an optional
 * `@media (prefers-color-scheme: dark)` block overriding palette roles.
 *
 * Any slot the caller omits is filled from {@link defaultTokens}, so the output
 * always covers the full token surface. Variable naming is deterministic (see
 * REQ-4): `--color-<role>`, `--font-size-<step>`, `--space-<step>`, etc.
 */
export function generateThemeCss(
  tokens?: DeepPartial<ThemeTokens>,
  options?: { dark?: PartialPalette },
): string {
  const t = mergeTokens(defaultTokens, tokens)

  // The display family (REQ-24) falls back to the heading family when a site
  // declares no bespoke display face, so `--font-family-display` is always safe
  // to reference from a module.
  const displayFamily = t.typography.family.display ?? t.typography.family.heading
  // The label family (REQ-36) is the button/label face (the reference's Raleway
  // "Learn More"); it falls back to the body family when a site declares none, so
  // `--font-family-label` is always safe to reference from a module.
  const labelFamily = t.typography.family.label ?? t.typography.family.body

  const vars: string[] = [
    ...paletteVars(t.palette),
    `--font-family-heading: ${t.typography.family.heading};`,
    `--font-family-body: ${t.typography.family.body};`,
    `--font-family-display: ${displayFamily};`,
    `--font-family-label: ${labelFamily};`,
    ...mapVars('--font-size-', t.typography.scale),
    ...mapVars('--font-weight-', t.typography.weights),
    ...mapVars('--line-height-', t.typography.lineHeights),
    ...mapVars('--tracking-', t.typography.tracking),
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

  if (options?.dark) {
    const darkVars = paletteVars(options.dark)
    if (darkVars.length > 0) {
      css +=
        `\n\n@media (prefers-color-scheme: dark) {\n  :root {\n` +
        darkVars.map((v) => `    ${v}`).join('\n') +
        `\n  }\n}`
    }
  }

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

/** Palette roles → `--color-<kebab-role>` declarations. */
function paletteVars(palette: Partial<Record<string, string>>): string[] {
  return Object.entries(palette)
    .filter(([, value]) => value !== undefined)
    .map(([role, value]) => `--color-${kebab(role)}: ${value};`)
}

/** Flat record → `<prefix><key>: <value>;` declarations, keys used verbatim. */
function mapVars(prefix: string, group: Record<string, string>): string[] {
  return Object.entries(group).map(([key, value]) => `${prefix}${key}: ${value};`)
}

/** camelCase → kebab-case (`surfaceSubtle` → `surface-subtle`). */
function kebab(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
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
