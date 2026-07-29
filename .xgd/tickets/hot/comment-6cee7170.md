---
uid: comment-6cee7170
id: COMMENT-562
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-29T04:02:20.384573+00:00'
updated_at: '2026-07-29T04:02:20.384573+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f379333d
  kind: note
---

All tests pass and only the new test file is added (build output is gitignored).

**Coverage check:** the story has 12 ACs. Eight (AC-682/683/684/685/686/687/688/723) already have UATs in `tests/reconciliation-l1-substrate.test.ts`, which I left untouched. The four created by this reconciliation run — AC-725/726/727/728, the REQ-91 language-power and REQ-90 language-form extensions — had none, so those are what I wrote.

```
UATs generated for story story-d0a8cfad (plan item 1 of 5)

Story: story-d0a8cfad
Test file(s) created:
  - tests/reconciliation-l1-language.test.ts

Tests written: 4
Tests passed: 4
Tests failed: 0

test_files_created:
  - "tests/reconciliation-l1-language.test.ts"
```

**What each UAT proves, at the emitter/validator boundary:**

- `test_UAT_AC725_structured_axes_emit_derived_css_and_identity_values_are_omitted` — renders text (gradient fill, decoration, glyph shadow, small-caps, list marker), box (scrim+gradient+background-image as three ordered layers, border, shadow, backdrop blur, blend), image (blend/border/shadow), and transform+mask on slot/text/box; then asserts the identity variants emit *no* declaration.
- `test_UAT_AC726_structured_axis_violations_rejected_with_offending_path` — 14 single-rule violations each asserted rejected *with its exact error path*, 7 extra-key forms refused, plus an all-families positive control accepted.
- `test_UAT_AC727_resource_table_emits_font_face_rules_ahead_of_use_and_binds_the_face` — exact `@font-face` rule text, extension-derived `format()` hints, ordering ahead of first use, unsafe/unsanitisable entries producing no rule, and an end-to-end browser probe.
- `test_UAT_AC728_font_entry_scheme_and_weight_violations_rejected_with_path` — data/javascript/vbscript/file schemes and out-of-range weights rejected with per-entry paths; relative, root-relative and http(s) accepted.

Two things worth flagging, neither a failure:

**The AC-727 browser probe really ran** — I verified it rather than trusting the fast wall-clock. With the resource table the face reports `loaded` and the glyph run measures **297.6px**; without it, nothing binds the handle and the same text falls back to **337.4px**. That is the AC's "measurably different glyph run width" observed, not assumed.

**A precision limit in error reporting.** For an unknown key on a *structured form* (gradient, shadow, border, mask, transform, scrim), the returned path is `/root` with message `"Invalid input"` — not the key's own path. Cause: `l1NodeSchema` is a `z.union`, so Zod collapses the branch failure to a generic issue at the union's path. The rejection itself is correct and unconditional, which is what AC-726 actually requires; only the path granularity is coarser than the per-field paths you get for range and hex violations. I asserted the honest observable (`/root` locates the offending node) rather than writing an assertion that implies finer locality than the code delivers. The same violation *inside the resource table* — which sits outside the union — does report precisely (`/resources/fonts/0`, `Unrecognized key: "unicodeRange"`), which is why AC-728's assertions are path-exact.

One environment note: `pnpm -r build` was required before the suite would resolve `@1stcontact/site-schema`; that emits gitignored `dist` only, no tracked change.
