---
uid: report-2bb02f5d
id: REPORT-2137
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-16T22:03:08.909442+00:00'
updated_at: '2026-08-16T22:03:08.909442+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-d9226698
  plan_item_index: '1'
---

Verified on disk: story body updated (25,581 chars, both new passages present), AC-1040 rewritten, AC-1143 created and linked to the story (34 ACs now). No runtime code touched, no new story created.

**Scope**
- In scope for change: `story-3bf94bd4` (STORY-101), `acceptance_criterion-15ea0e87` (AC-1040)
- Explicitly out of scope, unchanged: `story-c490f1cf` / `story-5e7eb0c5` (plan items 2 and 3), AC-1042 (the size-clamp criterion, untouched by this change), and every other STORY-101 AC.

**What changed**
- **STORY-101 body** — the "words in a box" In-scope bullet now says the dressed box mirrors both the paint *behind* the words and, where a run's glyphs are painted by its own background, the paint that *is* the words. Two Technical Context bullets added: the two reads named as distinct (backdrop starts one layer past the run; the clip is what makes an element's own background readable as glyph paint; it lands on the control because `background-image` does not inherit, behind initial-value fallbacks), and the transparent-foreground backstop stated as general rather than gradient-specific.
- **AC-1040 modified** — adds the explicit statement that the backdrop stack begins one layer past the edited run so the run's own background is not part of it, and the backstop: a fully transparent resolved foreground with no glyph paint is withheld, leaving the chrome's own colour. Verification extended to both. Covers `test_UAT_FC_BUG-34_a_foreground_that_paints_nothing_falls_back`.
- **AC-1143 added** — the glyph paint itself: image + clip + fill read off the rendering with relative addresses absolutised, landing on the element that draws the words rather than the box, and a run without such a fill completely unaffected by construction (initial-value consumption, not a per-run check). Covers the three remaining FC tests.

One judgment call worth flagging: the plan asked the glyph-paint AC to assert the paint lands "on the control, not the box", which the FC test proves by reading the stylesheet rather than through a rendered outcome — jsdom cannot compute it. I kept the criterion behavioural ("the element that draws the words", with the mechanical reason given) rather than naming the class selector, so the AC stays boundary-observable while the existing FC test still evidences it.

```
Upgrade mutations applied for plan item 1 of 3

Target Stories: story-3bf94bd4
Primary Story UID: story-3bf94bd4
Stories Modified: 1
ACs Modified: 1
ACs Added: 1
ACs Removed: 0

tickets_modified:
  stories:
    - "story-3bf94bd4"
  acceptance_criteria:
    modified: ["acceptance_criterion-15ea0e87"]
    added: ["acceptance_criterion-86ec6932"]
    removed: []

Progress: 1 of 3 plan items complete
```
