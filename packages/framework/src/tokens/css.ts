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

  const vars: string[] = [
    ...paletteVars(t.palette),
    `--font-family-heading: ${t.typography.family.heading};`,
    `--font-family-body: ${t.typography.family.body};`,
    ...mapVars('--font-size-', t.typography.scale),
    ...mapVars('--font-weight-', t.typography.weights),
    ...mapVars('--line-height-', t.typography.lineHeights),
    ...mapVars('--space-', t.spacing),
    ...mapVars('--radius-', t.radius),
    ...mapVars('--shadow-', t.shadow),
    ...mapVars('--container-', t.container),
    ...mapVars('--breakpoint-', t.breakpoints),
  ]

  let css = `:root {\n${vars.map((v) => `  ${v}`).join('\n')}\n}`

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
