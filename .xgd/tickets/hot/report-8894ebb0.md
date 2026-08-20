---
uid: report-8894ebb0
id: REPORT-2306
type: report
title: 'Fix Builder Workspace: Chrome, Origin & Display Panel (ac) — attempt 4'
created_by: xgd
created_at: '2026-08-20T01:59:25.749632+00:00'
updated_at: '2026-08-20T01:59:25.749632+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a994b8f3
  level: ac
  fixes_applied: 7
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Builder Workspace: Chrome, Origin & Display Panel (ac)

**Attempt**: 4
**Fixes applied this call**: 7
**Violations remaining**: 0
**Needs more work**: false

Both violations and all five warnings from report-97e0a1d8 were addressed. The
one item deliberately left open is a UAT, which belongs to the next level and is
recorded below with the reason it could not be authored-and-run in this session.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-966 (`acceptance_criterion-6fb2bebc`) | **Findings 1 + 4, applied as one edit.** Dropped "a re-generation" from the exclusion list — REQ-119 made the draft-side channels exactly that — and replaced the mechanism clause with "produced when the request arrives … equal *by construction* … one production of a page, with a writer and a reader over it". Ceded the artifact-equality claim to AC-1032 by name, and re-pointed the criterion at what only it owns: the pane shows the selected site's rendering **whole**, with stylesheet and image references resolving over the same origin. Verification rewritten to fetch what the pane displays and to run against a site never rendered to disk, so the panel's content cannot be coming off a shelf. Title updated ("…byte-identical to the rendered artifact" → "…whole, over this origin") so it no longer advertises AC-1032's claim |
| 2 | ac-add | **AC-1240** (`acceptance_criterion-bd9ce1d6`), under `story-e674c60a` | **Finding 2 — the violation that had to close.** New criterion: the client code the editing gesture runs inside the displayed page is served from this origin and its bytes are **derived at serve time from the renderer's own source** rather than maintained as a second hand-written copy. Scoped to derivation and serving only, naming the editing-gesture story as the owner of what the code does once the browser runs it, and explicitly not pinning the derivation mechanism (it moves with the origin into the edge runtime). Verification: request the route, assert success with a script content type, derive the renderer's own source the same way and assert the served body matches, assert the served text is browser-executable rather than the TypeScript passed through, and assert no separately authored copy exists in the workspace's application sources. Confirmed shipping at `tools/generate/src/cli/builder.ts:472-483` (the `/framework/(edit-client\|site-schema-edit).js` route type-stripping `packages/framework/src/l1/edit-client.ts`) |
| 3 | story-body-edit | STORY-99 (`story-e674c60a`) — write-path transport bullet | **Finding 3, resolution (b) taken, not (a).** Added a sentence recording that refusal fidelity is *not* restated as a criterion here: it is owned by AC-992 under the write-path story, which asserts the same read/write operations as the command line and the same code, path and hint. The bullet now claims only the transport — reachable over this origin, no semantics interposed. Chose (b) over (a) on the assessor's own reasoning: the behaviour is proven and a STORY-99 AC would duplicate AC-992 across stories. Per the finding's instruction, only one of the two resolutions was applied |
| 4 | story-body-edit | STORY-99 — component-scope bullet | **Finding 5.** Added the bounded exclusion BUG-32 actually recorded: the sweep covers every tracked text file *save a declared exclusion list — the ticket and workflow store, whose retention of the previous namespace is a recorded operator decision, and dependency lockfiles*. AC-960 was left untouched; it was already right and intent-supported, and the story body was the thin side |
| 5 | story-body-edit | STORY-99 — toolbar bullet | **Finding 6.** Extended the disposal sentence: disposal is symmetric — tearing the chrome down releases the strip's controls *and the strip's own responsiveness to what is displayed* exactly as replacement does, so a second mount does not leave the previous strip reacting alongside the new one. This is AC-1110's second paragraph, which followed from nothing in the body (BUG-33's recorded effect is about detached survivors after replacement, a different trigger) |
| 6 | ac-edit | AC-1036 (`acceptance_criterion-46e9debf`) | **Finding 7**, taking the "label it" option rather than the trim, so no probe is lost. The second paragraph is now explicitly a **regression rider**: it names AC-978 as the owner of tree confinement and AC-979 as the owner of not-found-for-an-unserved-name, and states that it re-runs their probes against the new request-time mechanism so the mechanism change is tested against them rather than assumed safe. Verification section labelled to match. A future reader can no longer read it as an independent guarantee |
| 7 | test-comment | `tests/reconciliation-builder-workspace-origin.test.ts:115` | The AC-966 UAT's inline comment repeated the stale "not a placeholder, a re-generation, or a differently-serialised copy" wording verbatim (finding 1 called this out). Rewritten to match the corrected criterion and to record that the retained disk comparison is incidental — this fixture has already rendered — with the real equality claim belonging to AC-1032. **Comment only; no assertion was changed** (see below) |

## Code Edits

None. The only file touched under `tests/` was a comment (row 7); no production
code was modified.

## Not Done, and Why — one item, forwarded to the uat level

**AC-1240 has no UAT and is recorded `uat_coverage: fail`.** This is honest state
rather than an oversight, and the next level is where it belongs. It could not be
authored-and-verified here: **every origin-driving UAT in this suite fails in this
session's sandbox with `EPERM` on `listen`**, confirmed by running
`npx vitest run tests/req117-edit-loop.test.ts -t "bridge_reaches"` — 1 file
failed, 8 tests skipped, `Serialized Error: { code: 'EPERM', errno: -1, syscall:
'listen', address: '0.0.0.0' }` at `tools/generate/src/cli/builder.ts:623`
(`startBuilder`). Authoring a test against a real origin that cannot be run to
green would have put an unverified test in the tree, which the fix contract
forbids.

The behaviour itself is not unevidenced — `test_UAT_FC_REQ-117_the_bridge_reaches_
the_browser_as_one_implementation` (`tests/req117-edit-loop.test.ts:144`) proves it
— but that is a feature check against the intent, which is exactly why finding 2
said it leaves nothing in the matrix. AC-1240 is the matrix entry; the AC-linked
UAT is the uat level's work. The existing FC test is a usable template: it already
drives `get('/framework/edit-client.js')` over the real origin and asserts the
type-stripped shape. What AC-1240 asks beyond it is the *derivation* assertion —
derive `packages/framework/src/l1/edit-client.ts` through the same transform the
route uses and compare — rather than shape assertions alone.

## needs_review Items Forwarded

None. Every finding in report-97e0a1d8 carried a resolution category and was
actionable; nothing required an operator decision.

## Consistency at This Call Boundary

The two paired clusters the fix contract asks about were applied together rather
than split across calls:

- Findings 1 and 4 are one edit to AC-966, as the assessor's editor notes
  required — doing them separately would have left a criterion that had dropped
  the stale mechanism claim but still restated AC-1032's equality in weaker form.
- Findings 2 and 3 were kept **asymmetric and separate**, as instructed. Ask (b)
  (the derived client bytes) had neither criterion nor AC-linked evidence and got
  a new AC; ask (a) (the transport) had both, at AC-992, and got a story-body
  pointer instead of a duplicate criterion.

No AC was deprecated this call, so no story body was left claiming a retired
behaviour.
