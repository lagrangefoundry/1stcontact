---
uid: comment-daa4603f
id: COMMENT-1252
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T04:09:30.098038+00:00'
updated_at: '2026-08-20T04:09:30.098038+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f9f7075d
  kind: note
---

**Report created: REPORT-2358 (`report-f9f7075d`) — FAIL, 1 violation, 1 warning, 0 needs_review.**

## What I found

**Attempt 9's repairs all landed and are correct.** I verified each one against the actual artifacts rather than trusting the fix report: the six drifted flags are registered at `cli/args.ts:29-34`, `BOOLEAN_FLAGS` is re-exported at `cli/index.ts:183`, both new UATs exist at `tests/req58-multi-viewport.test.ts:113-150`, and all five stale capability cross-references plus STORY-116's `outline` paraphrase are genuinely fixed.

**But the violation is one flag short of closed.** `--assign` is a fourteenth boolean the CLI reads and it is unregistered:

- `cli/index.ts:987` reads it as `if (flags.assign)` — a bare truthy check
- `--help` at `:313` documents it as a bare toggle (value placeholder on `--names`, none on `--assign`)
- Absent from `BOOLEAN_FLAGS`, `parseArgs` falls to the value-taking branch (`args.ts:49-56`) and eats the next token
- `colors` takes `requireSlug(rest[0])` at `:986`, so `1c colors --assign gigabytealchemy --names slate=text` dies with `Missing required <slug> argument.` — REQ-58's exact signature, through a seventh verb

Attempt 9 enumerated booleans by grepping `flags.X === true`, which doesn't match the truthy-check form. I re-enumerated from the other direction: all 35 distinct `flags.*` reads in `cli/index.ts` (the only file in `tools/generate/src` that reads flags), classified by consumption. Fourteen boolean, twenty-one guarded by `typeof … === 'string'` or handed to a parser, four computed reads all inside string/number helpers. `assign` is the only remaining gap.

**The warning is why this recurred.** `test_UAT_FC_REQ-58_boolean_flag_set_is_pinned_entire` compares `BOOLEAN_FLAGS` against a hardcoded literal — it pins the registry *to itself*. It goes red when someone edits the registry and stays green when someone adds a boolean to a verb and forgets it, which is the actual failure mode. Unlike REQ-44's gated-set UAT it cites as its model, where `COMMAND_DEPS` is a dispatch-level map a new verb must be added to. Without deriving the boolean set from the CLI source, this finding is likely to recur a third time.

**Coverage is clean.** I re-checked the delta since attempt 9's sweep — all requests/bugs after 2026-08-14 plus the two status-dependent tickets. REQ-150 is still `free_coding` (doesn't count; would retire STORY-79 §4 when it reconciles), BUNDLE-19 still `reconciling` with no CAP-63 member. Nothing new in scope.

Also worth noting: attempt 9's reported stale-capability-body read did **not** reproduce — `xgd ticket get` returns the full 9959-char body, so an editor can safely read-modify-write it now.
