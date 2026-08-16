---
uid: comment-e31e47ef
id: COMMENT-1040
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-16T01:45:14.325758+00:00'
updated_at: '2026-08-16T01:45:14.325758+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f700fb44
  kind: note
---

All four findings from report-aabaf2e1 are fixed as `uat-edit`s in `tests/reconciliation-beyond-l1-authoring.test.ts`; completion report is **REPORT-2042 (report-f700fb44)**.

**What changed (8 mutations, all test-side, all additive):**

- **Finding 1 (the violation, AC-1099)** — the surface's declared `presentation` parameter is now driven: `box.run('add_component', {…, presentation: { slide: [...] }})` on a second seeded carousel seam, asserting the stored `slots.slide` is what was supplied and that the copy reaches the render. A mis-wire at `toolbox.ts:312` now fails a test.
- **Finding 2 (AC-1099)** — `expect(typeof node.kind).toBe('string')` replaced with equality against the stored `modules[0].slots.form`, plus the missing module-scoped `set_l1` round-trip (read a text run inside the component, rewrite its words, assert stored *and* rendered).
- **Finding 3 (AC-1096)** — the refusal's advice is now proven actionable (the group-plus-object form is accepted straight after and writes the setting the refused call meant), with a comment recording why `edit.ts`'s hint text itself is unobservable.
- **Finding 4 (AC-1109)** — the CLI/surface parity pair gained `module set`↔`configure_component`, `module rm`↔`remove_component` (on a new `spare` seam, so the closing assertions still read `signup`), and a replacing `asset write --force`↔`write_image {replace:true}` with byte assertions on both roots.

**One honest limit:** I could not execute anything — this session's permission mode refused `npx vitest`, `pnpm test`, the local vitest binary, and `tsc --noEmit`, the same block the assessor hit. Every new assertion is justified by reading the production code it drives (the report names the specific file:line readings — `presets.ts:23-29` for the single-node `form` slot, `contact-form/meta.ts:58-62` for the one-slot declaration, `args.ts:11` for `--force`, `scaffold.ts:36` for `assets: []`), but none is verified by a green run. That verification is what the assessor should do next.

I also forwarded the assessor's own AC-1096 tail: `editConfigSet`'s top-level refusal hint is unreachable from both boundaries, so it may want an `ac`-level correction rather than a contorted test.
