---
uid: report-ed7fd573
id: REPORT-3953
type: report
title: 'Reconciliation Review: commits (BUNDLE-26)'
created_by: xgd
created_at: '2026-09-11T07:13:15.996928+00:00'
updated_at: '2026-09-11T07:13:15.996928+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-87be4669
  anchor_uid: bundle-87be4669
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: bundle-87be4669
**Stories Reviewed**: 17 (16 unique; story-c4f329d3 carries plan items 1 and 3)

**What failed**: Step 5b (evidence sufficiency) only. Steps 4 (intent fidelity
and coverage) and 6 (plan-item accounting) both pass. The story and AC work on
this branch is correct and must not be rewritten.

**Why it failed**: the bundle's implementation is not on this branch. Eight of
the twelve behaviour-bearing commits were never applied, so 126 of the 145
acceptance criteria are evidenced by UATs that cannot pass here — and, where the
runtime permits them to run at all, do not.

---

## Behavior Inventory

The plan's inventory (report-2746490a) was re-derived from the commits and is
accurate as a description of what the seven intents *built*. What this review
adds is where that behaviour currently lives.

Of the twelve commits on `bundle-87be4669.fields.commits`, exactly one
behaviour-bearing commit is reachable from `HEAD`: `52fd6302cc` (REQ-165,
projected reference). Verified three independent ways:

- `git merge-base --is-ancestor 858d63202f HEAD` → false. Same for
  `61a0becc61` (REQ-167) and every other behaviour commit in the bundle.
- `git ls-tree -r HEAD apps/control-app/src tools/generate/src/cli db/migrations`
  returns `tools/generate/src/cli/kb-projection.ts` and **nothing else** from the
  bundle. Absent: `material.ts`, `knowledge.ts`, `describe.ts`,
  `fetch-guard.ts`, `identity.ts`, `system-knowledge.ts`, `builder/library.js`,
  `builder/upload.js`, `kb-model.ts`, `0004_identity.sql`, `kbBundle`,
  `writeKbModule`.
- `tools/generate/src/cli/kb.ts` still carries the pre-REQ-164 rule it is
  documented as having replaced: `INCLUDE_FIELD = 'system_kb'` (line 187),
  `optedIn()` (199), the membership gate at line 325, and — the criterion plan
  item 1 exists to restate — `corpus: { type: [CORPUS_TYPE],
  ['fields.' + INCLUDE_FIELD]: true }` at line 544, the query-time predicate the
  intent replaced with `corpus: {}`.
- `fields.commits[]` carries `reconcile_sha: null` on **all twelve** entries.

## Coverage Map

Step 4 was performed against the intent bodies (the bundle carries no comments)
and against the commits. It passes. No behaviour the seven intents declare is
missing from the stories, no story claims behaviour neither intent nor code
supports, and every intent-silent behaviour formalized into an AC is recorded
under `## Reconciliation Decisions` with a dated rationale.

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Membership is `doc_kind: system_kb`; the retired boolean is not honoured | Covered | story-c4f329d3 | Supersession of AC-1295/AC-1300 recorded as a decision |
| 2 | Shipped + scaffolded declarations restrict nothing; bare markdown resolves | Covered | story-c4f329d3 | |
| 3 | Listing is exhaustive; a truncated envelope is refused by name | Covered | story-c4f329d3 | Envelope check formalized as its own decision |
| 4 | Status reports corpus against the ticket count; unknown, never zero | Covered | story-c4f329d3 | |
| 5 | Three REF-* projections, one machine-readable source each | Covered | story-5836022a | Granularity decision recorded |
| 6 | Two producers, two namespaces, one sweep each | Covered | story-5836022a | |
| 7 | Membership read from the declaration, never hardcoded | Covered | story-5836022a | |
| 8 | An unchanged projection is not rewritten | Covered | story-5836022a | |
| 9 | No projection cites an internal ticket | Covered | story-5836022a | AC-1644; absent from the story prose, present as a criterion |
| 10 | Value sets scoped to the element kind they were written for | Covered | story-5836022a | |
| 11 | `kbBundle()` packs both indexes + corpus, per-document stamps | Covered | story-c4f329d3 | Stamps recorded as reconciliation's own decision |
| 12 | The module is written unconditionally, `null` when nothing is built | Covered | story-c4f329d3 | |
| 13 | An absent knowledge base is loud in the asset report | Covered | story-c4f329d3 | |
| 14 | `cmdAssets` awaited — the build became async | Covered (as context) | story-c4f329d3 | Intentionally not given a criterion; recorded in Technical Context |
| 15 | Worker-safe runtime reaches the packed corpus, no filesystem | Covered | story-a58a0974 | Stated as the setting, not a second import-graph walk |
| 16 | Priming carries the map on the deployed host; grant read-only, both axes | Covered | story-a58a0974 | |
| 17 | Two routes to no knowledge (unbuilt corpus, absent model binding) | Covered | story-a58a0974 | Second route formalized; AC-1320's third example withdrawn |
| 18 | Project KB declared beside system; parsed, not paraphrased | Covered | story-5281f009 | |
| 19 | Tenancy bound once into the handle; barrier over rows and vectors | Covered | story-5281f009 | Vector half formalized as a decision |
| 20 | Index in private storage, outside every servable and attachment prefix | Covered | story-5281f009 | |
| 21 | Incremental refresh; absent index reads null | Covered | story-5281f009 | Absent-index case formalized |
| 22 | Each host serves only the knowledge bases it can resolve | Covered | story-5281f009 | |
| 23 | Transcript growth indexes in batches and never rebuilds the map | Covered | story-ea7b4646 | Cursor-advance half formalized |
| 24 | Material write indexes inline, defers the rebuild to a seam | Covered | story-ea7b4646 | |
| 25 | Character-budget floor; complete listing said in words; nothing bolded | Covered | story-ea7b4646 | DOC-39 §7 supersession recorded |
| 26 | Above the floor with no describer: refuse by name, previous map stands | Covered | story-ea7b4646 | |
| 27 | Blob then record; no record ever names absent bytes | Covered | story-6ccaedd5 | Restated as a property, not an order — decision recorded |
| 28 | Kind from content type, filename as fallback; rights from provenance | Covered | story-6ccaedd5 | Unrecognised-type case formalized |
| 29 | 25MB ceiling and empty-file refusal, nothing left behind | Covered | story-6ccaedd5 | Empty-file case formalized |
| 30 | Index seam called exactly once per material; unwired is loud | Covered | story-6ccaedd5 | Response-reports-indexed formalized |
| 31 | PDF text + declared title; a scan is stored and honestly described | Covered | story-4cabde9a | |
| 32 | Images described by what they depict, behind an injectable seam | Covered | story-4cabde9a | |
| 33 | Fonts read from the name table; WOFF/WOFF2 degrade honestly | Covered | story-4cabde9a | |
| 34 | Six outcomes in one status field, plus the describer that produced it | Covered | story-4cabde9a | Meanings here; vocabulary declared on story-e07c589b |
| 35 | The describer never throws | Covered | story-4cabde9a | |
| 36 | HTTPS only; private/loopback/link-local/metadata refused | Covered | story-77f8fc9e | Non-web and malformed folded in, decision recorded |
| 37 | Every redirect hop re-validated; target never fetched; loop bounded | Covered | story-77f8fc9e | The load-bearing case, stated as such |
| 38 | Size ceiling enforced past a lying content-length | Covered | story-77f8fc9e | |
| 39 | Final address is what the record stores; material lands untrusted | Covered | story-77f8fc9e | Untrusted marking formalized as the provenance triple |
| 40 | The name-resolution gap is recorded and not claimed closed | Covered | story-77f8fc9e | Explicitly not asserted — correct |
| 41 | Promotion refused unless republishable | Covered | story-aacb7060 | |
| 42 | Promotion copies bytes across the bucket boundary | Covered | story-aacb7060 | Intent's own later passage governs — decision recorded |
| 43 | Never overwrites; a free name is picked and reported | Covered | story-aacb7060 | |
| 44 | A failed promotion is reported in the envelope, not as a lost upload | Covered | story-aacb7060 | Secret-scrubbing clause formalized |
| 45 | Library tab; tenant-wide list; site as badge and filter, never a boundary | Covered | story-1500b111 | |
| 46 | Detail pane from existing editors; rights read-only | Covered | story-1500b111 | |
| 47 | Description is the one editable thing; correction re-indexes, client-authored | Covered | story-1500b111 | |
| 48 | Four routes answer 404 not 403 for a non-material uid | Covered | story-1500b111 | Write-route half formalized |
| 49 | One overlay, two entry points, areas that are roles | Covered | story-325da65f | |
| 50 | Ambiguous drop creates nothing and says what is missing | Covered | story-325da65f | |
| 51 | Every area is a real button; a fileless drag never raises the overlay | Covered | story-325da65f | |
| 52 | Chat-route drop is the client's own turn; Library-route drop is not | Covered | story-325da65f | Multi-file reporting formalized |
| 53 | `role`, `description_status`, `description_model`, `filename` declared | Covered | story-e07c589b | |
| 54 | Role narrows, never widens; absent leaves provenance; malformed refused | Covered | story-e07c589b | |
| 55 | Blob addressed by the attachment record's uid; sha256 is integrity | Covered | story-a7a12d81 | AC-1488 dedup clause withdrawn, isolation half kept |
| 56 | One panel per declared tab; the first declared tab opens | Covered | story-e674c60a | |
| 57 | Exactly one control offers a site | Covered | story-7f437d57 | |
| 58 | Invite provisions user, opaque account, owner membership, grant, site | Covered | story-7b1025b8 | |
| 59 | Login binds and provisions nothing; expiry actually expires | Covered | story-7b1025b8 | Person-status check formalized |
| 60 | One refusal message for every reason; the distinction is logged | Covered | story-7b1025b8 | Forbidden/non-cacheable shape formalized |
| 61 | No CHECK on plan/status; no unique index on account grants | Covered | story-7b1025b8 | |
| 62 | The gate reports the verified identity, not a yes/no | Covered | story-182e8cb9 | AC-1761 |
| 63 | AC-1375/1376/1380 restated as the gate's verdict | Covered | story-182e8cb9 | Supersession named by the intent, recorded as a decision |
| 64 | A service identity passes the gate and is refused behind it | Covered | story-182e8cb9 | Boundary stated rather than widened — correct |

**No uncovered behaviour, no partial coverage, and no absorbed divergence was
found.** Every supersession the intents name (REQ-164 over AC-1295/1300;
REQ-161 over AC-959/976/1064 and over AC-1488's dedup clause; REQ-161 over
REQ-163's blob-addressing and dedup acceptance; REQ-167 over AC-1375/1376/1380;
DOC-39 §7 over REQ-159's own enumeration budget) is recorded explicitly as a
dated decision rather than silently absorbed. Where an intent contradicts
itself across its planning and implementation halves (REQ-163's "row pointing at
the existing blob" versus its own "What was built" correction), the stories name
both passages and say which governs.

## Ungrounded Stories

None.

A mechanical reading would call all sixteen stories ungrounded, since they
describe behaviour the code *on this branch* does not have. That reading is
wrong and must not drive a fix. The behaviour exists — on `xgd-working`, in the
commits the bundle names. The stories are grounded in intent and in code; the
**branch** is unpopulated. Rewriting them to match an empty tree would destroy
correct reconciliation output.

## Evidence Sufficiency (Step 5b) — THIS IS THE FAILURE

All 145 acceptance criteria in the hot store are `status: active`, and every one
carries a named `test_UAT_AC{N}_*` UAT in `tests/`. Naming coverage is complete;
**passing** coverage is not.

Suites executed this session (`npm test`, node project, 12 suites):

| Suite | ACs named | Result |
|---|---|---|
| reconciliation-projected-reference.test.ts | 13 | **13 pass** |
| reconciliation-builder-private-access-gate.test.ts | 10 | pass |
| reconciliation-builder-workspace-chrome.test.ts | 9 | pass |
| reconciliation-builder-assistant-pane.test.ts | 9 | pass |
| reconciliation-material-blob-storage.test.ts | 2 | pass |
| reconciliation-system-knowledge-base.test.ts | 18 | **17 of 18 FAIL** |
| reconciliation-system-knowledge-base-packed.test.ts | 3 | **3 FAIL** (`kbBundle` / `writeKbModule` not exported) |
| reconciliation-client-knowledge-base.test.ts | 3 | **3 FAIL** (declaration does not declare `project`) |
| reconciliation-assistant-conversation-knowledge.test.ts | 4 | **4 FAIL** |
| reconciliation-builder-private-access-verdict.test.ts | 1 | **1 FAIL** (the test itself reports: "REQ-167 (61a0becc61) is not an ancestor of this branch; identity.ts is absent here. This is missing code, not a broken test.") |
| reconciliation-library-tab.test.ts | 5 | **collection error, 0 tests** — cannot resolve `builder/library.js` |
| reconciliation-upload-overlay.test.ts | 11 | **collection error, 0 tests** — cannot resolve `builder/upload.js` |

Consolidated: `Test Files 7 failed | 5 passed (12)` · `Tests 28 failed | 44 passed (72)`.

The eleven `*.workers.test.ts` suites (103 AC-named tests, covering items 4–14
and 16) **could not be executed**: workerd cannot bind a socket in this sandbox
(`Error: listen EPERM: operation not permitted 127.0.0.1`). That is an
environment limit and not evidence of failure by itself — but every module those
suites import is provably absent from `HEAD`, so they cannot pass here either.

**Net: 19 of 145 active ACs have a UAT observed passing on this branch. 126 do
not.**

| Story | Plan item | ACs | With passing evidence |
|---|---|---|---|
| story-5836022a | 2 | 13 | **13** |
| story-182e8cb9 | 17 | 4 | 3 (AC-1761, the gate's verdict, FAILS) |
| story-e674c60a | 15 | 2 | 2 (see caveat) |
| story-7f437d57 | 15 | 1 | 1 (see caveat) |
| story-c4f329d3 | 1, 3 | 10 | 0 |
| story-a58a0974 | 4 | 4 | 0 |
| story-5281f009 | 5 | 12 | 0 |
| story-ea7b4646 | 6 | 12 | 0 |
| story-6ccaedd5 | 7 | 10 | 0 |
| story-4cabde9a | 8 | 12 | 0 |
| story-77f8fc9e | 9 | 9 | 0 |
| story-aacb7060 | 10 | 5 | 0 |
| story-1500b111 | 11 | 11 | 0 |
| story-325da65f | 12 | 11 | 0 |
| story-e07c589b | 13 | 4 | 0 |
| story-a7a12d81 | 14 | 4 | 0 |
| story-7b1025b8 | 16 | 21 | 0 |

Unproven ACs, in full, for the fix loop:

- story-7b1025b8: AC-1740 … AC-1760 (21)
- story-ea7b4646: AC-1666 … AC-1677 (12)
- story-4cabde9a: AC-1688 … AC-1699 (12)
- story-5281f009: AC-1654 … AC-1665 (12)
- story-325da65f: AC-1725 … AC-1735 (11)
- story-1500b111: AC-1714 … AC-1724 (11)
- story-c4f329d3: AC-1291, AC-1293, AC-1295, AC-1296, AC-1300, AC-1632, AC-1633, AC-1647, AC-1648, AC-1649
- story-6ccaedd5: AC-1678 … AC-1687 (10)
- story-77f8fc9e: AC-1700 … AC-1708 (9)
- story-aacb7060: AC-1709 … AC-1713 (5)
- story-a7a12d81: AC-1486, AC-1487, AC-1488, AC-1739
- story-a58a0974: AC-1320, AC-1651, AC-1652, AC-1653
- story-e07c589b: AC-1492, AC-1736, AC-1737, AC-1738
- story-182e8cb9: AC-1761

**Caveat on the two that pass.** AC-959 / AC-976 / AC-1064 are the criteria
REQ-161 restated *because a second declared tab falsified their proxies*. Their
UATs assert against the live declaration (`expect(panels).toHaveLength(TABS.length)`),
and `TABS` has one entry on this branch — so the restatement is satisfied
without ever being distinguished from the literal `1` it replaced. The criteria
are correct; their evidence is vacuous here for the same reason everything else
is.

**No UAT was found that mocks repository-owned code, bypasses the real entry
point, or asserts by inspecting source text.** Where the suites do run, they
enter through `route()`, `mountBuilder()` or the CLI commands against real
stores. The evidence design is sound; it simply has nothing to run against.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. System KB corpus selection | story-c4f329d3 | ✓ (BUNDLE-26/REQ-164 decisions dated 2026-09-10) |
| 2. Projected reference | story-5836022a | ✓ (new, `intent_uid: bundle-87be4669`) |
| 3. KB bundle emission | story-c4f329d3 | ✓ (BUNDLE-26/REQ-158 artefact-half decisions) |
| 4. System KB in the deployed conversation | story-a58a0974 | ✓ |
| 5. Project KB corpus & index | story-5281f009 | ✓ (new) |
| 6. Project KB triggers & landscape | story-ea7b4646 | ✓ (new) |
| 7. Material ingestion pipeline | story-6ccaedd5 | ✓ (new) |
| 8. Material description | story-4cabde9a | ✓ (new) |
| 9. Guarded fetch | story-77f8fc9e | ✓ (new) |
| 10. Site-asset promotion gate | story-aacb7060 | ✓ (new) |
| 11. The Library tab | story-1500b111 | ✓ (new) |
| 12. The drop-to-upload overlay | story-325da65f | ✓ (new) |
| 13. Material field vocabulary | story-e07c589b | ✓ |
| 14. Blob addressing | story-a7a12d81 | ✓ |
| 15. Workspace criteria vs the declaration | story-e674c60a, story-7f437d57 | ✓ (both) |
| 16. Identity: invite and admission | story-7b1025b8 | ✓ (new) |
| 17. The Access gate's verdict | story-182e8cb9 | ✓ |

**17 of 17 produced output. Nothing was dropped.**

## Judgment Calls

- **The story bodies are correct and must not be edited.** This is the single
  most important instruction in this report. `fix_reconciliation_review` edits
  stories, ACs and UATs; none of those is what failed. The previous cycle
  (report-e21470fb) reached the same conclusion independently and correctly
  returned `progress_made=false` rather than manufacturing an edit.
- **`tools/generate/src/cli/kb.ts` now contradicts itself, and that is a
  symptom, not a separate defect.** Lines 431–432 document REQ-164's rule while
  lines 187/199/325/544 still implement the rule it replaced. The doc-comment
  half arrived with REQ-165's projector commit; the behaviour half did not. It
  will resolve when the branch is populated.
- **The one intent-versus-code tension worth flagging as already handled**:
  REQ-163's acceptance asserts "the same file uploaded twice yields one blob and
  two records" and content addressing at `t/<tenant>/blob/<sha256>`. REQ-161 —
  later, same bundle — withdraws both. story-6ccaedd5 and story-a7a12d81 each
  record the supersession by name and assert only the surviving properties. This
  is correct handling, not absorption.
- **The intents' own open questions are left open rather than closed by
  assertion** — REQ-163's DNS gap (story-77f8fc9e states it is not claimed
  closed), REQ-159's Worker-side describer (story-ea7b4646 asserts the refusal
  and the standing map), REQ-165's awareness-map clustering (story-5836022a pins
  no territory composition). Correct on all three.
- **`bin/1c.mjs` awaiting `cmdAssets` is deliberately uncriterioned**, recorded
  in story-c4f329d3's Technical Context as belonging to the build's own story.
  Acceptable: its effect is observable through the packing criteria.
- **The workerd suites' inability to run here is not held against the matrix.**
  It is a sandbox limit. What is held against the branch is that the modules
  those suites import do not exist in `HEAD`.

## Verdict

**FAIL** — on evidence sufficiency alone (Step 5b).

Steps 4 and 6 pass without reservation: the stories faithfully represent the
operator's stated intent across all seven intents, every declared behaviour is
covered, every supersession and every intent-silent formalization is recorded as
a dated decision under `## Reconciliation Decisions`, no story is ungrounded, and
all 17 plan items produced output.

126 of 145 active acceptance criteria have no passing UAT on this branch,
because the implementation they describe was never applied to it. Eight
behaviour-bearing commits — `858d63202f`, `21e6d142d5`, `548c053deb`,
`855dd57a7c`, `f6c1366410`, `d4d50859a2`, `61a0becc61` (and the REQ-158 content
merged by `d4d50859a2`) — are reachable from `xgd-working` and
`reconcile-src-BUNDLE-26` but are not ancestors of `HEAD`. All twelve entries in
`fields.commits` still carry `reconcile_sha: null`.

**`fix_reconciliation_review` cannot repair this**, and re-entering it will not
change the verdict. The required action is the outer workflow's:

1. Land the bundle's behaviour commits on `reconcile-BUNDLE-26`. Note the
   history gap — `git merge-base HEAD xgd-working` is `b167abd969`, with roughly
   ten thousand commits on each side, so a replay is not expected to be clean.
   The cleaner alternative is to re-cut this reconcile branch from a base that
   already carries the commits, **preserving the matrix work on this branch**,
   which is correct and is the expensive part.
2. Treat `Scoped quality: pass (0 tests, 0 failed)` as a gate failure. Every
   scoped-quality report in this run reads that way; consecutive zero-test
   passes are how an unevidenced matrix reached review twice.
3. Re-run `reconciliation_review` only once the suites execute. Until then no
   statement about UAT sufficiency is possible beyond this one.
