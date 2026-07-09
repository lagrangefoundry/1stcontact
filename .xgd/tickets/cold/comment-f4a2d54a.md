---
uid: comment-f4a2d54a
id: COMMENT-59
type: comment
title: Comment on request REQ-36
created_by: xgd
created_at: '2026-07-07T22:44:30.335693+00:00'
updated_at: '2026-07-07T22:44:30.335693+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-d05379d0
  kind: note
---

## Pass 2 — diff-driven rebuild (fresh sandbox)

Rebuilt config-only from the capture (theme + 9 bands), then ran **both** gates this
time — the perceptual `1c diff` (skipped in pass 1) with overlay reading, plus
`values-diff`.

**Config-only ceiling (measured):**
- `1c diff` perceptual mean **64.57 / 255** (faelan-grade target is ~2-3).
- `values-diff` **54 matched / 142 deltas**.

Config wins applied: gold CTA (primary→gold swap), scrim strong, exact band colours
(`#7a7a7a` grey bands, gold footer), all fonts loaded, verbatim text.

**Why config can't go further — ranked by perceptual region score (overlay-confirmed):**

| Region (score) | What | Blocker | Tier |
|---|---|---|---|
| #1 y2448 (545k) | Offerings 3-col | services-grid draws **white cards** on the dark band → white-on-white, content invisible | CODE |
| #2 y0 hero (401k) | Hero | heading not **UPPERCASE**; no divider rule; CTA stretches full-width | CODE (mostly) |
| #3/#4 process grid (247k+136k) | Process 6-cell | same white-card gap as #1 | CODE |
| pervasive | every section heading | text-block / services-grid have **no gold `headingTreatment`** (hero has it) | CODE |
| testimonials | green panel `#28542d` | no green surface value (enum: default/subtle/inverse/accent) | CODE |

**Framework generalizations needed (generalize-first, per CLAUDE.md):**
1. `headingTreatment: gold` on **text-block** + **services-grid** (generalize hero's existing dial) — closes the pervasive gold-heading gap. Biggest visual signal.
2. **Bare/transparent card surface** on services-grid (per-card `surface: bare` + gold title + inherit body colour) — lets Offerings/Process render as text-columns on the dark band. Closes regions #1/#3/#4 (the largest scores).
3. **Uppercase heading treatment** (`case: upper`) on hero + text-block — the author uppercases via CSS; DOM text stays mixed (values-diff stays clean), render matches.
4. **Green surface** (5th surface value or palette-driven) for the testimonial band.

Each is a framework CODE change → full free-coding ceremony (scope ticket + `test_UAT_FC_*` + `[FREE-CODED]` + version bump). Awaiting operator direction on ticketing before proceeding.
