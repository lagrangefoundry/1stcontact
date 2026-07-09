---
uid: request-ffdc3e43
id: REQ-26
type: request
title: 'services-grid card treatments: accent border, status badge, ✓ checklist'
created_by: xgd
created_at: '2026-07-02T18:37:59.320519+00:00'
updated_at: '2026-07-09T23:59:12.747184+00:00'
completed_at: '2026-07-09T23:59:12.747184+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  story_points: 5
  auto_merge_back: true
  needs_review: false
  commits:
  - 686fbd608595d9d99a40a1ff0a78364b577d77f8
  version: 0.0.18
  bundled_in: bundle-adc60ee8
---

## Scope — module capability (services-grid)

Add first-class card treatments to `services-grid` so cards can carry:

1. **Accent left border** — a colored vertical bar per card (e.g. gold, blue), driven by a semantic token, not raw CSS.
2. **Status badge** — a pill in the card's top-right (e.g. "In development", "Coming soon"), with a semantic color.
3. **Checklist items** — bulleted body items rendered as green ✓ checks rather than plain markdown `•` bullets.

Driven by the **gigabytealchemy.ai** import (REQ-20): the reference "What We're Building" cards (Sanctum Voice, XGD) use all three. We currently fold status into the markdown body as italics and lists render as plain bullets, so the cards read flat.

## Acceptance criteria

- `services-grid` item schema gains structured fields for accent color, badge (label + variant), and checklist items — validated by `validateModuleContent`, no raw props.
- Framework emits the border/badge/check styling from those structured values (semantic tokens), scoped per instance.
- gigabytealchemy "What We're Building" cards match the reference: per-card accent border, top-right badge pill, green ✓ checklist.

## Notes

- Keep it within the closed content-value model (structured fields, not raw CSS/HTML).
- Green ✓ should key off the theme `primary` (or a dedicated success token), consistent with the reference.
- Blocks REQ-20 fidelity gap #3.

## Implementation (as landed)

Structured, closed-value, token-backed — no raw CSS/HTML at any layer.

**Content contract (`ContentFieldSpec`, generalized — not services-grid-specific):**
- Added `values?: readonly string[]` for `enum` fields and `itemSchema?` for `list`/`object` fields.
- `validateModuleContent` now recurses through `itemSchema` and enforces `required` + `enum` `values` to arbitrary depth. Violations report dotted/indexed paths (e.g. `items[0].badge.variant`). Any module can now declare structured, validated item fields — the reuse-first path, not a services-grid special case.

**services-grid meta (`items.itemSchema`):**
- `accent`: enum `CARD_ACCENT = [primary, accent, muted]` → palette-role name, resolves to `--color-<role>` in scoped CSS.
- `badge`: object `{ label (required), variant enum BADGE_VARIANT = [neutral, primary, accent] }`.
- `checklist`: list (max 8) of strings.
- All three optional — a card declaring none renders exactly as before (backward compatible).

**services-grid render + scoped CSS:**
- Accent: `border-left` thickened and coloured via `--color-<role>` (`accent`→gold, `primary`→green on the gigabytealchemy palette).
- Badge: absolute top-right pill; variant maps to a token background/foreground pair.
- Checklist: `✓` pseudo-element keyed to `--color-primary` (the reference's green check).

**Applied to gigabytealchemy** `draft/pages/home.json` "What We're Building": Sanctum Voice (accent border + "In development" badge + ✓ list) and XGD (accent border + "Coming soon" badge + ✓ list). Rendered draft verified: 2 distinct accent borders, 2 badges, 6 ✓ items. (The `storage/sites/gigabytealchemy/` tree is untracked seed data from the REQ-20 session, so it is not part of this ticket's commit; the demonstration content is captured inline in the AC3 UAT.)

## Test plan (UATs — `tests/framework-services-grid-cards.test.ts`)

- **AC1 (schema):** accepts structured accent/badge/checklist; rejects accent outside `[primary, accent, muted]`; rejects badge variant outside `[neutral, primary, accent]`; requires `badge.label`; untreated card still validates.
- **AC2 (render):** emits accent-border class + `border-left-color: var(--color-<role>)`; emits status-badge pill with label + variant class (defaulting to `neutral`); emits checklist items with `::before` `✓` keyed to `--color-primary`; untreated card emits no treatment markup.
- **AC3 (fidelity):** the two "What We're Building" reference cards render with per-card accent border, top-right badge, and green ✓ checklist.

Full suite: 130 passed (44 in the services-grid + schema + tokens regression scope). Framework/site-schema typecheck clean.