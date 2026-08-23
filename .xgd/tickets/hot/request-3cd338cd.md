---
uid: request-3cd338cd
id: REQ-114
type: request
title: L1 palette colour model (literal base, palette overlay) + retrofit existing
  sites
created_by: xgd
created_at: '2026-07-31T19:36:30.336865+00:00'
updated_at: '2026-08-07T00:45:25.607144+00:00'
completed_at: '2026-08-07T00:45:25.607144+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: c5541f86a6628b86f1ce3260497d3c89596c521d
    reconcile_sha: null
    main_sha: null
  version: 0.1.12
  story_points: 13
  bundled_in: bundle-0385746c
  chat_comment: comment-a3fa692b
---

## What this builds

The **palette colour model** for L1 ([[DOC-23]] §5), plus the retrofit of every
existing site onto it.

Today `l1Color` is hex-only by construction, so **every colour in every site is an
individually chosen literal** and there is no way to change one conceptual colour
and have its uses follow. This ticket makes the palette the unit of colour change,
without weakening reproduction.

## The model (DOC-23 §5)

Colour takes the same shape geometry already has — **absolute base, overlay**:

- **A literal hex is always valid.** Transcription from a capture stays lossless
  and inference-free; nothing is gated on a palette existing.
- **A palette reference is the refinement**, resolving to an entry whose value is
  a hex — so rendered output is identical either way.

## Scope

### 1. Schema (`packages/site-schema`)

- **Palette shape**, site-level: an ordered map of named entries
  `{ name → { value: hex, steps?: { <step> : hex } } }`. **Arbitrary size**; names
  are free-form (validated as kebab-case), with [[DOC-23]] §5.4's standard
  vocabulary as a *starting set*, not a schema constraint.
- **Widen `l1Color`** from hex-only to `hex | PaletteRef`. It is one type alias used
  in **12 places** (gradient stops, shadows, borders, textures, link states, surface
  fills…), so all 12 inherit the change.
- **Reference syntax**: a role name, optionally with a step. Must not collide with
  the hex grammar. Exact form is an implementation choice; keep it a *typed object*
  rather than a magic string if that reads better against the strict-object rule.
- **Validation**: a reference naming a missing entry is a **validation failure**,
  never a render-time fallback ([[DOC-23]] §6). Palette entries are opaque —
  translucency stays a separate axis, so no alpha in an entry.

### 2. Renderer (`packages/framework/src/l1/render.ts`)

- Resolve references to their entry's hex at render time.
- The renderer stays the only emitter; no new raw-CSS path, no `var()` hole opened
  in L1's output unless it is provably equivalent and still round-trips.

### 3. Retrofit of existing sites

Convert `storage/sites/{xgd,gigabytealchemy,1stcontact,harbor-cafe}` (and the
sandbox sites if cheap) from literals to palette references:

- **Alpha collapse first — exact, zero inference.** `xgd` carries `#2e86a3`,
  `#2e86a3a6` (α .65), `#2e86a355` (α .33): one colour at three opacities → one
  entry plus the existing opacity axis. This is mechanical and lossless.
- **Then ramp grouping — mild, reviewable inference.** Measured hue families:
  `xgd` neutrals hue 215–220 at lightness 17/34/46/65/84; brand teal hue 192–196 at
  33/41/54/95; warm surfaces hue 49–53 at 87/94/99. `gigabytealchemy` shows ~6 such
  families across 29 colours. Group each family into one role with steps.
- **Anything unclustered stays its own entry.** A slightly large palette is a fine
  outcome; a *wrong* one is not.
- Name entries from [[DOC-23]] §5.4's vocabulary where the role is obvious.

### 4. Retire the legacy palette — completely

The closed 15-slot `paletteTokensSchema` is what this ticket replaces. Both cannot
survive: two colour systems is the legacy-mode state the project forbids. **Delete
it and everything that exists only to serve it.** Scope is the *colour* group only
— typography, spacing, radius, shadow and breakpoint tokens are a different axis
family with no replacement here and stay untouched.

Surveyed targets (verify each is fully cut, do not leave stubs):

**`packages/site-schema`**
- `paletteTokensSchema` and the `PaletteTokens` type.
- The required `palette:` key on `themeTokensSchema` (`schema.ts` ~L914) — every
  site currently must carry one.
- `layerColorRoleSchema` (`schema.ts` L286) — a second closed colour-role enum
  (13 names) used at L313 (layer border colour) and L354 (layer text colour). Layers
  belonged to the deleted semantic layout modules; confirm dead, then delete with
  its two use sites.

**`packages/framework/src/tokens`**
- `paletteVars()` (`css.ts` L102-106) and the `t.palette` spread (`css.ts` L30) —
  the emitter of every `--color-<role>` custom property.
- The **dark-mode palette override** (`css.ts` L50-60, `options.dark` →
  `@media (prefers-color-scheme: dark)`). **No caller passes `dark:`** — confirmed
  unused, so it goes with the palette rather than being ported.
- The `palette` block in `defaults.ts` and `PartialPalette` in `contract.ts`.

**`packages/framework/src/modules`** — the residual aesthetic resolvers, now that
REQ-96 is finished. Colour-role references only; leave the non-colour dials alone:
- `dials.ts` — the colour-role dial resolving to `var(--color-<role>)` (L66).
- `text-style.ts` — the palette-role alias (`accent` → `var(--color-accent)`, L103).
- `markdown.ts` — the eight `blockquote.fc-callout--*` colour rules (L48-62).

**`tools/generate`**
- `render.ts` L139 emits `body { … background: var(--color-bg); color: var(--color-text) }`
  — the only live `--color-*` consumption on the L1 path (two uses in a rendered
  page). Its replacement already exists: the L1 document's own `background` field
  ([[DOC-23]] §2). Page-level text colour needs an equivalent home; do not
  reintroduce a token to solve it.

**`storage/sites/*/draft/site.json`** — drop `theme.palette` from all four
(`1stcontact` 9 keys, `gigabytealchemy` 15, `harbor-cafe` 9, `xgd` 15) as part of
the retrofit in §3.

### 5. Tooling

- Whatever the retrofit needs to be repeatable rather than hand-done — at minimum
  a colour census over a site's pages (the analysis in [[DOC-23]] §5.3 was ad hoc;
  it should be a command).
- The capture→L1 fold continues to emit **literals**. Palette assignment is a
  separate, re-runnable pass over a folded site, not a change to the fold.

## Non-goals

- **No colour picker / palette editor UI.** Deferred; this ticket is the data model
  and the retrofit. The editor is [[DOC-28]]'s phase 2 and depends on
  `xgd-framework` REQ-55.
- **No change to the capture→L1 fold's output.** It stays literal-only.
- **The non-colour token groups stay.** Typography, spacing, radius, shadow and
  breakpoint tokens are out of scope — §4 retires the colour group only.

## Acceptance criteria

1. A site definition may declare a palette of arbitrary size with free-form
   kebab-case entry names; a colour axis accepts either a hex literal or a
   reference to an existing entry.
2. A reference to a non-existent entry (or step) fails validation — no render-time
   fallback, no silent default.
3. **Conversion is pixel-identical**: for every retrofitted site, the render before
   and after the retrofit is byte-identical (or, where byte-identity is impossible,
   passes the values-diff gate with zero delta). Any difference is a conversion bug,
   not an accepted cost ([[DOC-23]] §7).
4. Documents using only literals validate and render exactly as they do today —
   the palette is optional, and no existing site is broken by the schema widening.
5. `xgd`'s three `#2e86a3` alpha variants resolve to **one** palette entry plus the
   opacity axis.
6. All four `storage/sites/*` sites are retrofitted, and the resulting palette for
   each is small enough to be a palette rather than a colour list (report the count;
   `xgd` should land well under its current 15 distinct RGB).
7. A repeatable colour-census command exists and reproduces the [[DOC-23]] §5.3
   table.
8. **`paletteTokensSchema`, `layerColorRoleSchema` and `PaletteTokens` no longer
   exist**, `themeTokensSchema` has no `palette` key, and no site.json carries one.
   A grep for `--color-` across `packages/` and `tools/` returns nothing outside
   the new palette model.
9. No rendered page emits a `--color-*` custom property, and no stylesheet
   references one. The page's background and text colour come from the L1 document,
   not a token.
10. The dark-mode palette override path is gone (confirmed to have no callers), not
   ported forward. If dark mode is wanted later it is designed against the new
   model, not resurrected from the old one.
11. The non-colour token groups (typography, spacing, radius, shadow, breakpoints)
   are untouched and still validate/emit exactly as before.
12. Full suite green, and a clean `pnpm -r build` typechecks — the schema cut is
   wide enough that stale `dist/` output would mask type drift.

## Origin

[[DOC-23]] §5, written from the CHAT-9 discussion of the web editor's colour
surface. The measured evidence in §5.3 withdrew an earlier assumption that
palette-driven colour threatened reproduction fidelity.

-