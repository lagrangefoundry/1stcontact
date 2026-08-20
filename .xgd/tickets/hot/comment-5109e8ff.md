---
uid: comment-5109e8ff
id: COMMENT-1250
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T03:54:53.683592+00:00'
updated_at: '2026-08-20T03:54:53.683592+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-cb71281a
  kind: note
---

Report created: **REPORT-2356** (`report-cb71281a`) — result **FAIL**, 1 violation, 2 warnings, 0 needs_review.

## Attempt 9 outcome

**Coverage is now clean.** I rebuilt attempt 8's store-wide sweep from scratch rather than trusting the prior report — bundle membership parsed from bundle bodies, story references collected from all 31 stories' `intent_uid`/`updated_by` — and confirmed all four attempt-8 repairs landed: REQ-64/REQ-76 → STORY-116, REQ-72 → STORY-76, REQ-73 → STORY-75. No further unstoried in-scope intent exists. I also confirmed the matrix-genesis boundary mechanically: BUNDLE-1…5 are referenced by no story anywhere, every bundle from BUNDLE-6 on is referenced — a contiguous prefix with no interior hole, so REQ-31/35/38/47/48/51/53 are genuinely pre-history.

**The failure is a consistency finding that only became detectable after attempt 8's repair.** The capability declares, for the whole command set, that "boolean flags parse as boolean and do not swallow following positionals". That's implemented as one allowlist at `tools/generate/src/cli/args.ts:11`, and it has drifted six flags behind the CLI. Unregistered but read as booleans: `collapse` and `clusters` (`cli/index.ts:794-795` — the two flags STORY-116 documents for the first time), `edit`, `dry-run`, `prune`, `apply`. For an unregistered name `args.ts:26-32` eats the next non-`--` token, and each of those commands then calls `requireSlug(rest[0])` — so `1c values-diff --multi-viewport --collapse <slug> --ref <dir>` dies with the exact `Missing required <slug>` signature REQ-58 fixed for `--multi-viewport`.

Repair is a code change plus generalising STORY-79 §1 from the single flag to the flag set — not a matrix restructure.

Two warnings ride along: stale CAP-64/65/66 cross-references in five story bodies (those capabilities are `deprecated`, CAP-63 was renamed), and STORY-116 §5 listing `outline` in the control-styling cause where REQ-76's taxonomy has only `shape + border`.

**Worth surfacing beyond this capability:** the unbundled-intent class attempt 8 found here is matrix-wide and CAP-63 is the only capability repaired for it. 28 live requests and 3 live bugs are reconciled, unbundled, and referenced by no story anywhere — notably REQ-67/68/70/71/75/77/87 (CAP-70) and BUG-5 (CAP-71, L1 gate text-leaf pairing). All postdate BUNDLE-6, so the genesis exemption doesn't cover them. Running the same sweep against CAP-70 and CAP-71 is likely the highest-yield next move.

One note: REQ-150 (`free_coding`) will retire STORY-79 §4 and rewrite §2's bootstrap clause when it reconciles — recorded as info, not counted, since `free_coding` is neither reconciled nor imminent.
