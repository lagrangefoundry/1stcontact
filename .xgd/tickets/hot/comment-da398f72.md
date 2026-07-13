---
uid: comment-da398f72
id: COMMENT-95
type: comment
title: Comment on bug BUG-3
created_by: xgd
created_at: '2026-07-12T20:05:05.610174+00:00'
updated_at: '2026-07-12T20:05:05.610174+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-e922244a
  kind: note
---

## Investigation: BUG-3 is implemented (as part of REQ-36), but the ticket is still `draft`

**Verdict: the behaviour this ticket asks for exists and is tested — but under REQ-36, not BUG-3.**

### The fix
`PlaywrightDriver.settlePage()` (`tools/generate/src/cli/capture/playwright-driver.ts:131-179`,
called from `navigate()` at line 104) does exactly what the "Expected" section asks:
- collapses entrance-animation timing + reveals Elementor `.elementor-invisible`;
- scrolls the full page height in viewport steps to trip lazy-load / IntersectionObserver triggers;
- promotes residual `loading="lazy"` images to eager (and swaps `data-src`);
- awaits image decode + `networkidle` before the screenshot/query.

This is the root-cause fix for the blank below-fold captures described here.

### Provenance
- Landed in commit **fdd1a239** ("feat(capture,hero): settle lazy/animated content before capture; hero portrait [FREE-CODED]", 2026-07-09).
- Covered by real-Chromium UATs in `tests/req36-capture-settle.test.ts`:
  - `test_UAT_FC_REQ-36_capture_settles_before_response_drain`
  - `test_UAT_FC_REQ-36_capture_settle_reveals_animated_and_promotes_lazy`
  - `test_UAT_FC_REQ-36_capture_below_fold_fadein_text_is_present`
  - `test_UAT_FC_REQ-36_capture_below_fold_lazy_image_is_present`

### Why this is not a clean free-code of BUG-3
1. The commit is **shared with REQ-36** — the same commit also adds the hero portrait feature
   (`hero/index.astro`, `hero/meta.ts`). Claiming `fdd1a239` on BUG-3 would double-own REQ-36 code.
2. The UATs are already named `test_UAT_FC_REQ-36_*` — the evidence is attributed to REQ-36.
3. `fdd1a239` is currently an **unowned orphan** (remapped by resync from `cc66acbe`; present only in
   resync reports, not in REQ-36's `fields.commits` either).

BUG-3 was surfaced *during* REQ-36 work and was fixed there in the same pass. It is effectively a
**duplicate of a slice of REQ-36**.

### Recommendation
Close BUG-3 as a **duplicate of REQ-36** (operator-owned status) rather than moving it to
`free_coded` — free-coding it would fork ownership of a commit and UATs that belong to REQ-36.
No new code or commit is needed; the behaviour ships and is tested.
