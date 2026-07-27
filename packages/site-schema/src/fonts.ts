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
 * One font file belonging to a family. `path` is the asset basename as it lands
 * in a site's `draft/assets/`, which is what a page's `resources.fonts[].src`
 * resolves to — so a file added by hand without a registry entry is detectable.
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

/** One registered family: what we have, where it came from, what it permits. */
export const fontRegistryEntrySchema = z
  .object({
    /** The family handle exactly as an L1 text leaf's `axes.fontFamily` names it. */
    family: z.string().min(1),
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
