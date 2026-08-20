---
uid: comment-7e8dfed4
id: COMMENT-1213
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T01:59:43.978555+00:00'
updated_at: '2026-08-20T01:59:43.978555+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-8894ebb0
  kind: note
---

Attempt 4 complete — report `report-8894ebb0`, 7 mutations, 0 violations remaining.

**Both violations closed:**

- **Finding 1 + 4 (one edit, AC-966)** — dropped "a re-generation" from the exclusion list, which REQ-119 had made the actual mechanism, and replaced it with "produced when the request arrives … equal *by construction* … one production with a writer and a reader over it". Ceded the artifact-equality claim to AC-1032 by name and re-pointed AC-966 at what only it owns: the pane shows the selected site's rendering whole, assets resolving over the same origin. Verification now runs against a site never rendered to disk. Title updated to match.
- **Finding 2 (ac-add)** — created **AC-1240** under STORY-99: the editing gesture's client code is served from this origin with bytes derived at serve time from the renderer's own source, not a hand-written second copy. Scoped to derivation and serving; mechanism deliberately unpinned so it survives the edge-runtime move. Confirmed shipping at `tools/generate/src/cli/builder.ts:472-483`.

**All five warnings addressed:**

- **Finding 3** — took resolution **(b)**, not (a): STORY-99's body now records that refusal fidelity is owned by AC-992 under the write-path story, and the bullet claims only the transport. Per the finding, only one resolution applied.
- **Findings 5, 6** — story-body edits, not AC edits: added BUG-32's bounded exclusion list to the scope bullet, and the symmetric-disposal clause (teardown, not just replacement) to the toolbar bullet, so AC-960 and AC-1110 stop outrunning the body.
- **Finding 7** — AC-1036's second paragraph is now explicitly labelled a regression rider naming AC-978 and AC-979 as owners, keeping every probe rather than trimming.

**One item forwarded, honestly:** AC-1240 carries `uat_coverage: fail`. I could not author its UAT — every origin-driving test fails in this sandbox with `EPERM` on `listen` (verified: `npx vitest run tests/req117-edit-loop.test.ts -t "bridge_reaches"` → 1 file failed, 8 skipped, error at `builder.ts:623` in `startBuilder`). Writing an unrunnable test would have put unverified code in the tree. The behaviour has evidence via the REQ-117 feature-check UAT, which is precisely why finding 2 said it leaves no matrix entry; the AC-linked test is the uat level's work, and the report names the existing test as its template and the derivation assertion it must add.

The only file touched under `tests/` was the AC-966 comment that repeated the stale wording — comment only, no assertions or production code changed.
