/**
 * REQ-101 — the project-level font provenance registry.
 *
 * `l1FontFaceSchema` binds a family *handle* to its served substance, but says
 * nothing about where that `.woff2` came from or what its licence permits. The
 * registry is the provenance index over every font file in the project: family,
 * foundry, source URL, download date, licence terms, outstanding actions, and
 * the file list.
 *
 * The load-bearing distinction is between two questions that have *different
 * answers*: "may I use this on xgd.dev" and "may I ship this to 10,000 customer
 * sites". Commercial webfont licences are per-licensee — an agency or hosting
 * platform cannot buy one and share it across client sites — so a font may be
 * perfectly usable in this repo and still be unshippable as part of the product.
 * `licence.redistribute_in_product` forces that second question to be answered
 * at download time rather than discovered later; `'REVIEW_REQUIRED'` records
 * "asked, not yet answered" rather than silently defaulting either way.
 *
 * The registry lives at `fonts/registry.yaml` (project level, because licence
 * obligations attach to the font, not the site). Font *files* stay per-site
 * under `draft/assets/` so a site remains self-contained and portable.
 *
 * ── TWO TIERS SINCE [[REQ-312]] ──────────────────────────────────────────────
 *
 * The sentence above about files staying per-site describes the **site tier**,
 * and it is still true of it. The **platform tier** is the other half: the
 * mirrored OFL/Apache corpus, shared by every tenant, served once from a platform
 * origin rather than copied into each site that paints it.
 *
 * They are separated because they carry DIFFERENT OBLIGATIONS, and that is what
 * `tier` records. A platform font is cleared by construction — its licence is the
 * catalogue's, and `redistribute_in_product` follows from that licence rather
 * than from anybody's judgement. A site font is attested by a tenant we cannot
 * audit, which is exactly the state `REVIEW_REQUIRED` exists to hold.
 *
 * AND THEY ARE INDEXED SEPARATELY, which is not tidiness. Five of the nine
 * authored entries — Cinzel, Lato, Oswald, Raleway, Karla — are Google families
 * the mirror also holds, so one index over both tiers would see a duplicated
 * family and refuse to load the registry at all. A site `src` resolves against
 * the site tier and a platform `src` against the platform tier; the question
 * "which Lato?" is answered by where the bytes are served from, which is the only
 * place that can answer it.
 *
 * The platform tier is NOT AUTHORED. It is {@link PlatformFontManifest} —
 * `fonts/platform.json`, written by `1c fonts mirror` — projected through
 * {@link platformRegistryEntries}. There is deliberately no second serialisation
 * of it as registry entries: one generated artifact cannot disagree with itself.
 */

import { z } from 'zod'

/**
 * Whether a font may be redistributed as part of the 1st Contact product — i.e.
 * served from customer sites the platform hosts. `true`/`false` are settled
 * answers; `'REVIEW_REQUIRED'` is an explicit open question and is treated as
 * *not permitted* by every gate, so an unanswered licence can never leak into
 * product distribution by default.
 */
export const redistributeInProductSchema = z.union([z.boolean(), z.literal('REVIEW_REQUIRED')])

/** The licence terms that decide what may be done with a registered family. */
export const fontLicenceSchema = z
  .object({
    /** Licence name as the foundry states it, e.g. `ITF Free Font Licence`. */
    name: z.string().min(1),
    /** Canonical licence URL — the document the flags below were read from. */
    url: z.string().min(1),
    /** May the face be used in commercial work at all? */
    commercial_use: z.boolean(),
    /** May the `.woff2` be self-hosted (vs. served only from the foundry CDN)? */
    self_host: z.boolean(),
    /** May it ship inside the product, across customer sites? See the module note. */
    redistribute_in_product: redistributeInProductSchema,
  })
  .strict()

/**
 * One font file belonging to a family.
 *
 * `path` is what a page's `resources.fonts[].src` resolves to in this entry's
 * tier, so the two tiers spell it differently and each spelling is the whole
 * address in its own world:
 *
 *   - **site** — the asset basename as it lands in a site's `draft/assets/`
 *     (`satoshi-400.woff2`), so a file added by hand without a registry entry is
 *     detectable.
 *   - **platform** — the mirror-relative key, `<slug>/<file>`
 *     (`roboto/Roboto[wdth,wght].woff2`). The slug is carried rather than dropped
 *     because it is what distinguishes two families that ship a same-named file,
 *     and because it makes a `src` pointing at the right file under the wrong
 *     family a reportable mismatch instead of a silent pass.
 */
export const fontFileSchema = z
  .object({
    path: z.string().min(1),
    weight: z.number().finite().optional(),
    style: z.enum(['normal', 'italic']).optional(),
    /** Free-text note, e.g. `latin subset`, or which capture bundle supplied it. */
    note: z.string().optional(),
  })
  .strict()

/**
 * A YAML date scalar (`downloaded: 2026-07-25`) parses to a `Date`, while a
 * quoted one parses to a string. Normalise both to a `YYYY-MM-DD` string so the
 * registry reads the same either way and a human need not remember to quote.
 */
const dateString = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().min(1),
)

/**
 * Which tier an entry belongs to — see the module note.
 *
 * Defaulted to `'site'` so `fonts/registry.yaml` needs no edit: every entry a
 * person authored by hand is, by construction, the tier a person authors.
 */
export const fontTierSchema = z.enum(['platform', 'site'])

/** One registered family: what we have, where it came from, what it permits. */
export const fontRegistryEntrySchema = z
  .object({
    /** The family handle exactly as an L1 text leaf's `axes.fontFamily` names it. */
    family: z.string().min(1),
    /** Which tier serves these bytes, and therefore which obligations they carry. */
    tier: fontTierSchema.default('site'),
    foundry: z.string().min(1),
    /** Where the files were obtained — a foundry page, or the captured origin. */
    source: z.string().min(1),
    downloaded: dateString,
    licence: fontLicenceSchema,
    /**
     * Outstanding licence work. Advisory rather than blocking: an open action is
     * exactly the state a font sits in while it is fine for this repo and not yet
     * cleared for the product. `redistribute_in_product` is the gate that blocks.
     */
    actions: z.array(z.string()).default([]),
    files: z.array(fontFileSchema).min(1),
  })
  .strict()

/** The whole registry document. */
export const fontRegistrySchema = z.object({ fonts: z.array(fontRegistryEntrySchema) }).strict()

export type FontTier = z.infer<typeof fontTierSchema>
export type RedistributeInProduct = z.infer<typeof redistributeInProductSchema>
export type FontLicence = z.infer<typeof fontLicenceSchema>
export type FontFile = z.infer<typeof fontFileSchema>
export type FontRegistryEntry = z.infer<typeof fontRegistryEntrySchema>
export type FontRegistry = z.infer<typeof fontRegistrySchema>

export type FontRegistryResult =
  | { ok: true; value: FontRegistry }
  | { ok: false; errors: { path: string; message: string }[] }

/**
 * Validate a parsed registry document. Returns JSON-pointer-style paths so a
 * malformed entry reports which field of which font is wrong.
 */
export function validateFontRegistry(candidate: unknown): FontRegistryResult {
  const parsed = fontRegistrySchema.safeParse(candidate)
  if (parsed.success) return { ok: true, value: parsed.data }
  return {
    ok: false,
    errors: parsed.error.issues.map((i) => ({
      path: '/' + i.path.map(String).join('/'),
      message: i.message,
    })),
  }
}

// ── The platform tier ([[REQ-312]]) ──────────────────────────────────────────

/**
 * Where a platform font is addressed, in the two vocabularies that reach it.
 *
 * ONE SPELLING, STATED ONCE, because three parties have to agree about it and
 * they are in three different programs: `1c fonts mirror` writes the bytes,
 * `public-site` serves them, and `1c fonts check` decides whether a page's `src`
 * is one. A second definition anywhere is a way for a page to reference a font
 * the gate thinks is fine and the server has never heard of.
 *
 * `_fonts` is a RESERVED FIRST SEGMENT of the public site's route grammar, so no
 * published page can shadow it, and the leading underscore keeps it out of the
 * space of names a person would give a page.
 */
export const PLATFORM_FONT_PATH_PREFIX = '/_fonts/'

/** The R2 key prefix the mirror publishes under, in the bucket sites are served from. */
export const PLATFORM_FONT_KEY_PREFIX = 'platform/fonts/'

/** The aggregate licence index, at the origin root: `/_fonts/LICENSES.txt`. */
export const PLATFORM_LICENCE_INDEX = 'LICENSES.txt'

/**
 * The mirror-relative path a font `src` addresses, or `null` when it addresses
 * no platform font at all.
 *
 * IT MATCHES ON THE PATH AND NEVER ON THE HOST, and that is the point. The same
 * site definition has to check clean against a local preview, a staging
 * deployment and production, and pinning a hostname here would make a site's
 * conformance a property of which deployment last wrote it. Moving the mirror to
 * a dedicated hostname later is then a configuration change rather than a change
 * to this rule.
 *
 * A relative `src` is NOT a platform reference even when its tail looks like one:
 * a site-relative path resolves inside the site's own assets, and reading it as a
 * platform address would let a site claim the platform tier's clearance for bytes
 * it holds itself.
 */
export function parsePlatformFontSrc(src: string): string | null {
  const trimmed = src.trim()
  if (trimmed === '') return null

  // The pathname is taken by string surgery rather than by `new URL`, because
  // this module is deliberately environment-free — it is imported by the Node
  // CLI, by a Worker and by the browser builder, and the set of globals all three
  // agree on is smaller than it looks.
  let pathname: string
  const scheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.exec(trimmed)
  if (scheme) {
    const afterAuthority = trimmed.indexOf('/', scheme[0].length)
    if (afterAuthority < 0) return null // scheme://host with no path at all
    pathname = trimmed.slice(afterAuthority).split(/[?#]/, 1)[0]
  } else if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    pathname = trimmed.split(/[?#]/, 1)[0]
  } else {
    return null
  }

  if (!pathname.startsWith(PLATFORM_FONT_PATH_PREFIX)) return null
  let rest: string
  try {
    rest = decodeURIComponent(pathname.slice(PLATFORM_FONT_PATH_PREFIX.length))
  } catch {
    return null // malformed percent-encoding addresses nothing
  }
  // The key is built by concatenation on the serving side, so a component that
  // merely LOOKS like traversal is refused rather than reasoned about.
  if (rest === '' || rest.split('/').some((s) => s === '' || s === '.' || s === '..')) return null
  if (rest.includes('\\') || rest.includes('\0')) return null
  return rest
}

/** `roboto/Roboto[wdth,wght].woff2` → the absolute URL a page's `src` carries. */
export function platformFontUrl(origin: string, path: string): string {
  const base = origin.replace(/\/+$/, '')
  return `${base}${PLATFORM_FONT_PATH_PREFIX}${path.split('/').map(encodeURIComponent).join('/')}`
}

/** `roboto/Roboto[wdth,wght].woff2` → the R2 key holding those bytes. */
export function platformFontKey(path: string): string {
  return `${PLATFORM_FONT_KEY_PREFIX}${path}`
}

/** The two licences the mirror carries. Everything else is excluded upstream of here. */
export const platformLicenceSchema = z.enum(['OFL-1.1', 'Apache-2.0'])

/**
 * One mirrored file.
 *
 * `sha256` is over the served `woff2`; `upstream_sha256` is over the `.ttf` it
 * was repackaged from. BOTH, because they answer different questions: the first
 * is "are the bytes in R2 the bytes this manifest describes" — which is what makes
 * a re-publish of an unchanged mirror transfer nothing — and the second is "did
 * upstream change", which is what makes a refresh move only what moved.
 */
export const platformFontFileSchema = z
  .object({
    /** Mirror-relative key, `<slug>/<file>.woff2`. */
    path: z.string().min(1),
    /** The upstream release file this was repackaged from, e.g. `Roboto[wdth,wght].ttf`. */
    upstream: z.string().min(1),
    weight: z.number().finite().optional(),
    style: z.enum(['normal', 'italic']).optional(),
    /** Variable axis tags this file carries, when it is a variable font. */
    axes: z.array(z.string()).optional(),
    bytes: z.number().int().nonnegative(),
    sha256: z.string().length(64),
    upstream_sha256: z.string().length(64),
  })
  .strict()

/** One mirrored family: what was taken, from where, and under what notice. */
export const platformFontFamilySchema = z
  .object({
    family: z.string().min(1),
    slug: z.string().min(1),
    licence: platformLicenceSchema,
    /** The upstream family directory, e.g. `ofl/roboto`. */
    upstream_dir: z.string().min(1),
    /** The upstream page a reader can open to see these bytes at their source. */
    source: z.string().min(1),
    /**
     * The copyright notices the family's own `METADATA.pb` declares. OFL requires
     * the notice to travel with the distribution, so this is carried in order to
     * be *served*, not in order to be recorded.
     */
    copyright: z.array(z.string()),
    /** Mirror-relative path of this family's own licence file, `<slug>/OFL.txt`. */
    licence_file: z.string().min(1),
    mirrored: dateString,
    files: z.array(platformFontFileSchema).min(1),
  })
  .strict()

/**
 * `fonts/platform.json` — the platform tier, and the pin.
 *
 * It is committed while the bytes it describes are not, which is the whole
 * arrangement: a GB of fonts in git is the thing a shared origin exists to avoid,
 * and a manifest recording every digest is what lets two builds of the same
 * commit serve provably the same faces.
 */
export const platformFontManifestSchema = z
  .object({
    /** Which catalogue this mirror was built from — the reproducibility pin. */
    catalogue: z.object({ retrieved: dateString, family_count: z.number().int().nonnegative() }).strict(),
    /** Where the bytes came from, at which commit. */
    upstream: z.object({ repo: z.string().min(1), ref: z.string().min(1) }).strict(),
    /**
     * What was done to the bytes on the way through, stated so a reader of the
     * manifest alone can see that the answer is "nothing but the container".
     */
    format: z
      .object({
        container: z.literal('woff2'),
        source: z.literal('sfnt'),
        transform: z.literal('none'),
      })
      .strict(),
    families: z.array(platformFontFamilySchema),
  })
  .strict()

export type PlatformLicence = z.infer<typeof platformLicenceSchema>
export type PlatformFontFile = z.infer<typeof platformFontFileSchema>
export type PlatformFontFamily = z.infer<typeof platformFontFamilySchema>
export type PlatformFontManifest = z.infer<typeof platformFontManifestSchema>

export type PlatformFontManifestResult =
  | { ok: true; value: PlatformFontManifest }
  | { ok: false; errors: { path: string; message: string }[] }

/** Validate a parsed `fonts/platform.json`, reporting like {@link validateFontRegistry}. */
export function validatePlatformFontManifest(candidate: unknown): PlatformFontManifestResult {
  const parsed = platformFontManifestSchema.safeParse(candidate)
  if (parsed.success) return { ok: true, value: parsed.data }
  return {
    ok: false,
    errors: parsed.error.issues.map((i) => ({
      path: '/' + i.path.map(String).join('/'),
      message: i.message,
    })),
  }
}

/**
 * The licence terms each mirrored licence carries — the whole of the "no family
 * needs an individual legal decision" claim, written down.
 *
 * `redistribute_in_product: true` is not a judgement made per family here; it is
 * a property of OFL 1.1 and Apache 2.0, both of which permit redistribution as
 * part of a larger work in terms. That is precisely why the mirror can be
 * generated: the question the site tier has to ask a human is already answered
 * for every member of this one.
 */
const PLATFORM_LICENCE_TERMS: Record<PlatformLicence, FontLicence> = {
  'OFL-1.1': {
    name: 'SIL Open Font License 1.1',
    url: 'https://openfontlicense.org/open-font-license-official-text/',
    commercial_use: true,
    self_host: true,
    redistribute_in_product: true,
  },
  'Apache-2.0': {
    name: 'Apache License 2.0',
    url: 'https://www.apache.org/licenses/LICENSE-2.0',
    commercial_use: true,
    self_host: true,
    redistribute_in_product: true,
  },
}

/**
 * The platform tier as registry entries — derived, never stored.
 *
 * This is the join that lets `1c fonts check` ask ONE question of both tiers. It
 * is a projection rather than a second file because a generated registry sitting
 * beside the generated manifest would be two artifacts describing one fact, free
 * to drift the moment somebody regenerates one of them.
 *
 * `foundry` carries the designers the catalogue records, which is the honest
 * answer for a corpus with no foundry: these families have authors, not vendors.
 */
export function platformRegistryEntries(manifest: PlatformFontManifest): FontRegistryEntry[] {
  return manifest.families.map((family) => ({
    family: family.family,
    tier: 'platform' as const,
    foundry: family.copyright[0] ?? family.family,
    source: family.source,
    downloaded: family.mirrored,
    licence: PLATFORM_LICENCE_TERMS[family.licence],
    actions: [],
    files: family.files.map((file) => ({
      path: file.path,
      ...(file.weight === undefined ? {} : { weight: file.weight }),
      ...(file.style === undefined ? {} : { style: file.style }),
      note: `mirrored from ${family.upstream_dir}/${file.upstream}`,
    })),
  }))
}
