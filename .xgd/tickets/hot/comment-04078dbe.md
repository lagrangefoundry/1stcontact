---
uid: comment-04078dbe
id: COMMENT-1270
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-20T07:02:51.843455+00:00'
updated_at: '2026-08-20T07:02:51.843455+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a753fcc4
  kind: note
---

Assessment complete. **Result: FAIL** — 1 violation, 4 warnings, 0 needs_review. Report `REPORT-2396` (`report-a753fcc4`).

## The violation (new this attempt)

**AC-657's test never runs the command the AC is about.** Its Criterion is command-level — "When a `values-diff` command (single-width or `--multi-viewport`) is run with `--json`…" — and its Verification says "Run a `values-diff --json` command and capture stdout only."

`reconciliation-1c-cli-output-hygiene.test.ts:53-94` runs no command. It calls `withCleanStdout` around a hand-written body that prints three fake diagnostics and returns a literal `{matched:3, unmatched:0, deltas:[]}`, writes that literal to stdout itself, then asserts it equals the literal written twelve lines above. Its own comment concedes it: *"Faithful reproduction of run()'s `--json` path"*.

It proves `withCleanStdout` diverts stdout — which AC-658 and AC-659 already prove. It does not prove the composition the AC is about: that `run()` wraps the values-diff compute (`cli/index.ts:810`) and the multi-viewport compute (`:777`), then emits exactly one document. **Delete either `withCleanStdout` call in `index.ts` and the test still passes.** No other test closes it — the FC sibling at `req58-multi-viewport.test.ts:218` is the same helper-only shape, and the one end-to-end `runCli(['values-diff','demo','--json'])` exercises the *refusal* path, which returns before any render and so has no chatter to keep off stdout.

This is not a carry-forward. Every prior cycle recorded STORY-79 as covered 13/13, including the clause-by-clause audits of attempts 9 and 10.

## What I verified independently

- **AC→test index rebuilt from source** (byte-mode, so NUL-byte files aren't silently skipped): all 63 non-deprecated ACs carry ≥1 test *and* ≥1 ungated test; AC-637 (deprecated) correctly carries none.
- **Executed the 22 test files**: 172 passed, 23 skipped, 0 failures, 8.82s. All skips are honest `it.runIf(browserOk)`.
- **Attempt-9's violation is genuinely closed** — `itA` at `bug27:98-101` is now `it.runIf(browserOk)` and the hook guard precedes `serveDir`.
- **Anti-pattern sweep**: ten source-text/AST stand-ins exist in this repo, all in *other* capabilities' files; none in these 22.

## Warnings (non-blocking)

W1 — AC-1310's body contradicts its own normative rule and its tests (says "one run per line"; code and tests do per-text-node) → ac-edit, don't touch the tests. W2 — one of AC-1311's six cases (pre-`surface` bundle) has no test → uat-add. W3 — AC-720's end-to-end crop-pair clause is unexercised and, per the capability's own CLI ownership rule, belongs to whichever capability owns `aligned-crops` → shrink the AC, file it with REQ-78. W4 — AC-1307's `oklch()` case is browser-gated, carried forward a fourth cycle, no action possible headless.

Verdicts written to all 64 ACs, all 6 stories (STORY-79 fail, five pass), and the capability (fail).

One note for whoever runs the fix: the general pattern is that when an AC's Criterion opens with "When a `<verb>` command … is run", the evidence has to run that verb. AC-1290 and AC-1016 in this same story already meet that bar — AC-1290 even mutation-tests its own derivation — so the fix has a local standard to copy.
