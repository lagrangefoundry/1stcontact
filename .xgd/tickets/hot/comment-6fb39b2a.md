---
uid: comment-6fb39b2a
id: COMMENT-1911
type: comment
title: Comment on request REQ-164
created_by: xgd
created_at: '2026-08-31T21:51:24.040165+00:00'
updated_at: '2026-08-31T22:10:43.532964+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-909e42f8
  kind: chat_transcript
---

<!-- xgd-turn id="58e7dc7e-d19b-4a05-86f9-a60066c6b1cc-user" -->

<!-- xgd-chat role="user" ts="2026-08-31T21:50:50.625527+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="58e7dc7e-d19b-4a05-86f9-a60066c6b1cc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-31T22:10:43.273911+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

I've read the ticket and surveyed the code. Both blockers have landed in the installed xgd (`doc_kind` enum includes `system_kb`; `ticket list --no-limit` exists). No blocking questions — one judgement call I'll flag below. Starting now.

Now let me make the code changes.

Now the `kbStatus` change so a truncated export is visible rather than inferred:

Now the CLI output in `index.ts` and the checked-in declaration:

Now updating the existing reconciliation suite to the superseded intent:

Now AC-1295, which pins the old boolean semantics:

Now the new UAT file for REQ-164:

All 12 new UATs pass. Now the regression scope:

The CLI-driven export test writes into the repo's real corpus — that's a side effect I need to remove:

Sweep is running. Meanwhile, version bump and commit prep:

Pre-existing failures, unchanged by my work (same 9 on the untouched baseline). Committing:

Now merge back into `xgd-working`:

Known pattern in this repo — the version got claimed at the working tip by a concurrent ticket auto-commit. Bumping again, as prior commits here did:

Now updating the ticket body to reflect what actually landed:

Done. REQ-164 is at `free_coded`, both commits merged into `xgd-working`, branch cleaned up.

## What landed

Both blockers had already shipped in the installed xgd (0.15.419) — `system_kb` is in the `doc_kind` enum, `ticket list --no-limit` exists — so nothing was deferred.

**1. Membership is the kind.** `INCLUDE_FIELD`/`optedIn()` are replaced (not extended) by `DOC_KIND_FIELD` + `MEMBER_KIND` and `inSystemKb()`. The retired boolean is no longer honoured at all. DOC-33, DOC-35, DOC-31 and DOC-17 now carry `doc_kind: system_kb`.

**2. The corpus is unrestricted.** `kb/knowledge_bases.json` and the `ensureConfig` scaffold both declare `corpus: {}` — asserted separately, since `ensureConfig` never overwrites and the two can drift silently. Proven behaviourally: a bare markdown file with no frontmatter, dropped into the corpus directory, now resolves.

**3. Exhaustive listing, and truncation refused.** `readDocTickets` passes `--no-limit` *and checks the envelope it gets back* — `--no-limit` is upstream's promise, the check is the assertion it was kept. A truncated page from a stale `xgd` is now a loud failure naming the flag rather than a quietly shorter corpus.

**4. A short corpus is visible.** `kb status` prints the ticket count on the corpus line: `corpus: 4 document(s) (of 4 ticket(s) carrying doc_kind: system_kb)`, or a `⚠` with `run 1c kb export` when they disagree. An unreadable store reports unknown, never zero.

## Two judgement calls worth flagging

- **`kb status` now shells out to the ticket store.** The acceptance criterion asks for a count matching the tickets carrying the marker, which a files-on-disk count can't show alone. `status` is no longer pure-filesystem — that's the cost.
- **The envelope check exceeds the stated scope.** Passing `--no-limit` alone leaves the same silent failure reachable from a stale `xgd`.

## Tests

12 new UATs in `tests/test_UAT_FC_REQ-164_corpus_export.test.ts`, including a 60-ticket fixture (larger than one page on purpose — a smaller one passes vacuously, which is how the bug survived). Only the `xgd` subprocess is stood in for, and the shim is handed the real argv so "does it actually ask for every page" is observable.

I updated two reconciled suites that pinned the boolean rule (implicit supersession), and repaired two UATs that had been red since the upstream `prompt` → `description` rename — out of scope strictly, but they're the suites this change is evidenced by.

**Verification:** KB scope 55/55 passing; typecheck clean; end-to-end against the real store confirmed. The full sweep has 15 failures across 7 suites — I checked all of them: 9 reproduce identically on the untouched baseline, the other 6 pass in isolation (known `dist-assets` full-run interference). None touch the KB.

Ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->