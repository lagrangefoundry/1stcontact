---
uid: report-500afbb8
id: REPORT-1847
type: report
title: 'Code Review: request-5946d045 (REQ-132 image picker thumbnails)'
created_by: xgd
created_at: '2026-08-12T17:11:13.340507+00:00'
updated_at: '2026-08-12T17:11:13.340507+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: request-5946d045
  anchor_uid: request-5946d045
---

# Code Review

**Result**: PASS

## Summary

REQ-132 replaces the native `<select>` of `/assets/…` handles with a thumbnail
grid labelled by file name, on the two fields whose descriptor now carries
`format: 'image'`. The change is genuinely presentational: the committed value is
still the full handle, the closed list is still `enum`, and `applyCopyFields`
still enforces membership against `enum` alone (`packages/site-schema/src/l1/edit.ts:398`)
— `format` is inert on the write side, exactly as the ticket claims. No new
route, command, or value vocabulary. Verified end-to-end through the real CLI,
not inferred from the diff.

## Quality Gates

| Gate | Source | Result |
|------|--------|--------|
| Lint | report-aeaaf649 | success (0/0) — but see Warning 1 |
| Build | report-aeaaf649 | success |
| Typecheck (independent) | `tsc -p packages/site-schema` | exit 0 |
| Typecheck (independent) | `tsc -p tools/generate` | exit 0 |
| Tests (independent) | 5 REQ-132-related suites | 36 passed / 0 failed / 0 skipped |
| Tests (independent) | full suite | 1430 passed / 13 failed / 67 skipped — see Warning 2 |

The scoped quality reports on this branch (report-aeaaf649, report-41cb242c,
report-cc06f1a4, report-2da6f331) all record `"suites": {}` and 0 tests, so the
automated gate proved nothing about this change. I ran the suites directly
instead; the evidence above is mine, not the gate's.

## External Interface Accessibility

Wired in, verified at each seam rather than by inspection alone:

- `mountImagePicker` / `isImagePicker` — exported from `image-picker.js:68,161`,
  imported and used at `editor.js:3,271-276`.
- `assetUrl` — exported from `api.js:47`, consumed at `image-picker.js:1,136`.
- `format: 'image'` — set at `edit.ts:322,339`, passed through untouched by
  `editCopyGet` (`tools/generate/src/cli/edit.ts:487` — `fields: derived?.fields ?? []`).
- CSS classes emitted by the JS (`builder-modal__picker`, `__tile`,
  `__tile-input`, `__tile-thumb`, `__tile-name`, `is-missing`, `is-selected`)
  all have rules in `builder.css:282-400`.

**Live proof over the real entry point** — `1c copy get gigabytealchemy home 0.6 --json`
returns the new hint on a real painted surface:

```json
{"name": "backgroundImageUrl", "label": "Background image", "type": "enum",
 "format": "image", "enum": ["/assets/AlchemistLabWithTech.png"], "required": true}
```

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| editor.js:302-306 | `mountFields` is handed only `formFields` and a filtered `values` map, and `stagedValues()` spreads pickers last — belt-and-braces against the component echoing a stale picker value back into the change map. Correct, and the comment says why. | none |
| editor.js:237,334,337 | `let fields = null` with every post-mount use optional-chained (`fields?.destroy/getValues/isDirty`), so the background-only path (no form at all) is safe. | none |
| image-picker.js:36,71-72 | Per-instance radio group name via `groupSeq`; correct — radio scope is the document without a form owner, and the modal shares a document with the rendered page. | none |
| api.js:21 | `COMPLETE_REFERENCE` duplicates the scheme test in `tools/generate/src/l1/assets.ts:44`, deliberately: `apps/control-app` declares no dependency on `site-schema` or `tools/generate` and reaches framework code only through the served `/framework/site-schema-edit.js` shim. Justified, and the regex is a documented superset (adds protocol-relative `//`). | informational |
| builder.css:204 | Panel-narrowing rule extended to `:not(:has(.builder-modal__box, .builder-modal__picker))` so an all-thumbnails dialog keeps full width. Matches the stated intent. | none |

No leftover debug code, no commented-out blocks, no TODO stubs, no magic values
belonging in config. Comment density is unusually high but matches the
surrounding files' established style.

## Security (DOC-2 spot-check — no security_checklist ticket exists)

The structured-only invariant is intact; this change opens no raw-code path.

- No raw-HTML sinks in any changed file — grep for `innerHTML` / `outerHTML` /
  `insertAdjacentHTML` / `eval(` / `document.write` returns nothing. Every node
  is built with `createElement`, `textContent`, `setAttribute`.
- The value vocabulary is unchanged: options come from the derivation's `enum`,
  and the write side validates membership against `enum` alone.
- `img.src` cannot carry an unsafe scheme: `image.src` and `backgroundImageUrl`
  are scheme-checked by the envelope validator's `isSafeUrl` allowlist
  (`packages/site-schema/src/l1/schema.ts:611,779-780,1012`), so a `javascript:`
  handle is rejected before it could ever reach a tile.

## Checklist Compliance

No architecture_checklist, security_checklist, or design_checklist report tickets
exist (`xgd ticket list --type report --filter fields.report_kind=… ` → "No tickets
found" for all three). Sections omitted per the review contract.

## Evidence Validity

The UATs are valid evidence. `vi.mock` / `vi.fn` / stub / fake appear nowhere in
`tests/req132-image-picker-thumbnails.test.ts` or
`tests/reconciliation-copy-edit-image-picker.test.ts` — zero internal mocking.
The suites drive real `1c render --edit` bytes, a real builder origin, the real
`mountL1EditBridge`, the real installed `webui-fields`, and the real
`defaultModal`. The thumbnail-URL claim (the part that could actually be wrong)
is proven by fetching the URL the tile carries from the real origin and comparing
bytes. Naming is conformant: `test_UAT_FC_REQ-132_*` and `test_UAT_AC####_*`.
No REQ-132 test is skipped.

## Smoke Test

Entry points invoked:
- `1c render gigabytealchemy --edit` → rendered 3 files, no stack trace
- `1c copy get gigabytealchemy home 0.6 --json` → `ok: true`, descriptor carries `format: "image"`
- `1c edit --help` / CLI usage → clean

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix)**:

1. **The reconcile's own quality gate is vacuous for this change.** Every scoped
   quality report on this branch records `"suites": {}` / 0 tests, and `eslint`
   has no `eslint.config.js` in the repo (it errors out when invoked directly),
   so "lint: 0 errors, 0 warnings" means nothing was linted. Pre-existing
   project/gate condition, not introduced by REQ-132 — but it means this review's
   test and typecheck evidence is manual. Worth a separate ticket against the
   quality plugin's suite selection.

2. **13 pre-existing full-suite failures, unrelated to this change.** All in
   `tests/reconciliation-assistant-conversation.test.ts`,
   `tests/test_UAT_FC_REQ-122_chat_host.test.ts`, and
   `tests/test_UAT_FC_REQ-127_session_binding.test.ts`. Verified unrelated rather
   than assumed: none of the three references any changed file (no `copyFieldsOf`,
   `L1FieldDescriptor`, `builder/`, `image-picker`, `assetUrl`, or `mountFields`),
   and every failure is the assistant producing no assistant turn / no draft edit
   — the signature of a missing model credential. `ANTHROPIC_API_KEY` is unset in
   this environment. This matches the ticket's own stated caveat.

## Fix-It Prompt

N/A — PASS.
