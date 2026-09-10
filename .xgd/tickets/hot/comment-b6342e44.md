---
uid: comment-b6342e44
id: COMMENT-2614
type: comment
title: Claude response for fix_uat_coverage report
created_by: xgd
created_at: '2026-09-10T22:04:43.253594+00:00'
updated_at: '2026-09-10T22:04:43.253594+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c078cd4c
  kind: note
---

Done. Attempt 4 closed all three violations; two warnings remain and are forwarded.

**What the three violations actually were: one event.** `@lagrangefoundry/ai-knowledge` moved since 2026-08-20 — five declared read operations instead of three, provenance relocated from the operation onto the knowledge base, and priming replaced by two named providers. Fixed as one pass against the installed package, with no assertion relaxed.

**Code (finding 1).** `host.ts` called `bridge.KnowledgeDocs.open(...)`, which no longer exists — reproduced as `TypeError: Cannot read properties of undefined (reading 'open')` before any edit. Rewired onto `registerKmProviders` / `LANDSCAPE_PROVIDER` / `MECHANISM_PROVIDER`. Because KM now renders only its own two texts and names no role, the priming **order** had to move into this host: `host-core.ts` declares it in the role's entry list (map → purpose → manual), and `CARETAKER_PURPOSE` moved to `roles.ts` beside `CARETAKER_SYSTEM`. The knowledge wiring is now one named function, `knowledgeDeps` — the surface and the priming are one decision, and a named seam is something a test can observe.

**Tests.** AC-1319's case no longer assembles the priming itself; it opens a real conversation, takes a real turn, and reads the order off `seen[0].system`. I checked it adversarially — swapping the two entries in `host-core.ts` fails it (`expected 2553 to be less than 2258`) — then restored. AC-1318's equality is derived from the declaration's read group instead of hand-listed; AC-1317 asserts the untrusted wrapping on what the call returns plus `origin` on every declared shape.

**Verified, not asserted.** The knowledge suite passes 4/4 (was 1/4). Six neighbouring node suites pass 67/67 with it. The same drift had also broken 2 of 6 cases in `test_UAT_FC_REQ-123_session_knowledge`; repaired identically, 6/6.

Three suites still fail — `BUG-39`, `REQ-127`, `REQ-122` — and I confirmed by stashing every change that they fail identically on the clean tree. None is an AC-named UAT of this capability.

**Left undone, deliberately.** Finding 5 (no UAT drops the host mid-turn to prove the junction's bound) needs the workerd suites, which can't bind a socket here. Finding 6 (AC-1320 renames the repository's own `kb/system/corpus/index` aside) can't be fixed without a corpus-root seam — `kbRoot()` is `repoRoot()/kb` with no override, and adding an env var whose only consumer is a test is a decision worth making explicitly rather than in passing. Both are forwarded in REPORT-3804 with `needs_more_work: true`.
