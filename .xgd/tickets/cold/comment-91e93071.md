---
uid: comment-91e93071
id: COMMENT-65
type: comment
title: Comment on request REQ-36
created_by: xgd
created_at: '2026-07-08T19:20:29.279653+00:00'
updated_at: '2026-07-08T19:20:29.279653+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-d05379d0
  kind: note
---

## Loop run 1 — outcome (DOC-21 first worked example)

**Fidelity: config-only ceiling 64.57 → 46.20 / 255** (perceptual `1c diff`, desktop).
The treatment gaps that dominated the overlays are closed; the residual is now mostly
structural (vertical alignment) and typographic (heading weight).

**Framework changes free-coded into REQ-36 (each: code + `test_UAT_FC_REQ-36_*` + [FREE-CODED] + bump):**
- `9e9fda0` — services-grid `cardSurface: bare` (text-column cards on dark bands). 64.57→46.68, the single biggest lever (cleared the white-box regions).
- `91567a5` — `headingTreatment` colour dial (plain/accent/gold) generalized onto text-block + services-grid (the gold section headings / card titles).
- `214e367` — `headingCase: upper` dial (hero + text-block + services-grid; keeps DOM text literal so values-diff stays clean) + left-hero CTA now hugs its label instead of stretching full-width. 46.67→46.20; the hero now reads like the reference.

**Attempted + reverted (a DOC-21 self-correction):** a role-driven `surface: panel`
(schema role + dial + 6 modules) for the green testimonials band. The perceptual diff
**regressed 46.2→53.4**, and the overlay showed why: the testimonials is an **inset**
sage-green card on a white band, not a full-bleed green band. `surface: panel` was the
wrong branch of the attribution ladder (§5) — the real gap is an *inset coloured panel*
primitive (larger, deferred). Reverted cleanly; the diff caught the wrong attribution.

**Remaining gaps (ranked, for the post-mortem):**
1. **Vertical band alignment** — our page is 4504px vs the reference 4744; bands drift, so `1c diff` (pixel-aligned, single-viewport) penalises every band below the first mismatch. Dominates the residual mean. *Tooling finding: the diff is shift-sensitive; there is no band-alignment tool.*
2. **Heading weight** — the reference headings are Oswald ExtraLight (200); the modules hardcode `--font-weight-bold`. Very visible; needs a `headingWeight` dial (framework).
3. **Inset coloured panel** (green testimonials) — see above.
4. **Process grid gold icons**; **hero divider rule + heavier scrim** — smaller.

Sandbox: `storage/sandbox/joyfulculinary/draft`. Full render captured for review.
