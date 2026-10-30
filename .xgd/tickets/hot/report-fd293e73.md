---
uid: report-fd293e73
id: REPORT-6090
type: report
title: 'Resync resolve conflicts: 397daf02997f5670ac4ce7c26f12ed9050b0f66d'
created_by: xgd
created_at: '2026-10-04T22:56:53.981729+00:00'
updated_at: '2026-10-04T22:56:53.981729+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-10bbd54c
---

## Pick

`858d63202f` — fix(kb): corpus export selects by doc_kind, unrestricted, exhaustive [FREE-CODED] (REQ-164, author 2026-08-31 15:07:55 -0700).
HEAD `d5678200bb`, apply target `397daf02997f5670ac4ce7c26f12ed9050b0f66d`, `prior_stage_failure` empty.

## What I found

Main already replayed this pick's **code** half as `e87695083e`. It has the same author date and subject, and it touches only `kb/knowledge_bases.json`, `cli/index.ts` and `cli/kb.ts`. Later main commits then built on top of it: REQ-165 projections (`4573b1ee81`), `47fe3cc820` and `bf817873a2`. The replay did **not** carry the pick's tests, so those are where the real gaps are.

## Resolution per path

| Path | Resolution | Evidence |
|---|---|---|
| `tools/generate/src/cli/kb.ts` | ours | Every line the pick adds (base→theirs) is in ours verbatim (`grep -vxF` came back empty). Ours' extra lines are REQ-165's `projected` count. |
| `tools/generate/src/cli/index.ts` | ours | Only two pick lines are missing from ours: `s.tickets === s.corpus` and `` `corpus: ${s.corpus} document(s)` ``. REQ-165's exported/projected split deliberately replaced both. |
| `package.json` | ours | `version` is a monotone counter. HEAD is at 0.2.40 and incoming at 0.2.21. |
| `tests/test_UAT_FC_REQ-123_system_kb.test.ts` (DU) | stays deleted | Main retired this suite on purpose in `671a09196f` (09-10): "Retires … All fifteen of its scenarios verify AC-1291..AC-1306 in the same shape". The pick's repairs to it are already in the absorbing file. |
| `tests/test_UAT_FC_REQ-164_corpus_export.test.ts` (A) | **incoming kept** | Main never had this file and never deleted it on any branch. Every symbol it imports (`inSystemKb`, `kbStatus`, `readDocTickets`, `SYSTEM_KB`, …) is exported by HEAD's kb.ts. |
| `tests/reconciliation-system-knowledge-base.test.ts` | mixed (see below) | |

### reconciliation-system-knowledge-base.test.ts

- **Regions 107–1060 → ours.** HEAD has a later rewrite of the same doc_kind intent (`KIND_FIELD`/`MEMBER_KIND` constants, `paging(...)` store, REQ-165 `projected` in the status assertions, tighter AC1300 message checks). It is a superset of what theirs says.
- **Import block and both AC-1295 regions → incoming.** HEAD's AC-1295 test still called `optedIn(...)` with boolean semantics. HEAD's kb.ts no longer exports `optedIn`, and HEAD's import list no longer brings it in, so the test was already broken at HEAD. Incoming's `inSystemKb` assertions match HEAD's own kb.ts and xgd-working's tip (`git show xgd-working:<path>` has the same `inSystemKb` lines). The resolution keeps `async` on the `it(...)` because the unconflicted seeded half uses `await`. It also keeps ours' extra sentence "This holds at any corpus size…".

Net change vs HEAD: +1 import line, the AC-1295 unit assertions (13 lines), and the 2 `shouldBeIn`/`shouldBeOut` lines. Plus the new REQ-164 UAT file (451 lines).

## Flag for post-merge review

The **seeded integration half** of `test_UAT_AC1295_…` was not in conflict. It came from main's `47fe3cc820` (09-10) and was written against the retired boolean rule: it expects `DOC-IN { system_kb: true }` to be exported. Under HEAD's own `inSystemKb` (`doc_kind === 'system_kb'`) that document is skipped, so that half will fail. It was already red at HEAD because of the undefined `optedIn`. I did not hand-port the fixtures, since that would mean writing new test logic outside the conflict. Follow-up: give DOC-IN `doc_kind: 'system_kb'` and turn the near-misses into `doc_kind` variants (`'System_KB'`, `'architecture'`, `system_kb: true`, `{}`).

Tests were not run in this role.
