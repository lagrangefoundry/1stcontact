---
uid: comment-b2646f1b
id: COMMENT-875
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-09T04:53:14.279884+00:00'
updated_at: '2026-08-09T04:53:14.279884+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-8cf19783
  kind: note
---

Report **REPORT-1727** (`report-8cf19783`) created and schema-verified: `result=fail`, `report_kind=capability_validation`, `subject_uid=capability-ae9d65d6`, `level=uat`, `violations=2`, `warnings=5`, `needs_review_count=0`.

## Verdict: FAIL — 2 violations, 5 warnings, 0 needs_review

**Nothing was repaired since attempt 5.** All seven findings were re-verified at the exact file:line cited and all remain present.

**Violations**
1. **AC-685 ¶1 over-claims the emitter guarantee** (`ac-edit`). The AC says the guarantee "holds even for a value that bypassed validation." I reproduced the counterexample independently: rendering an unvalidated doc with `border.style = 'solid; } body { display: none } .pwn {'` through the real `renderL1Document` emitted `.l1-0 { border: 2px solid; } body { display: none } .pwn { … }` — live CSS. Nine raw enum interpolation sites confirmed in `render.ts`; no `cssEnum` guard exists. **Exposure is bounded** — I confirmed `validateL1` rejects the same doc, and DOC-2 §2 lists the Layer-2 guarantees as text/colour/font-family/length/image-src, with enums *not* among them. So policy and code agree; the AC is what's wrong.
2. **AC-1012's test proves less than it reports** (`uat-edit`). The browser measurement arm sits behind `if (!HAVE_CHROMIUM) return` and did not run, yet reports **pass** rather than skip; the round-trip fidelity clause is exercised by no arm at all.

**Warnings**: the same silent-gate pattern at AC-1009/AC-1011; AC-930 and AC-932 duplicating STORY-97 UATs cross-capability; the lone internal mock at AC-702; and unexercised second clauses on AC-686/AC-687 (behaviour proven by AC-849, so an attribution gap).

Two things worth flagging beyond the findings:

- **Greenness is not the signal here.** The suite is 18/18 files, 96 passed, 2 skipped — and will stay green through all seven repairs. A fix loop that only re-runs the suite will keep reporting success without converging, which likely explains six stalled attempts. Five of the seven are matrix/test-text edits; only Finding 1 touches production code, and that branch is explicitly the operator's call.

- **An archived-ticket trap nearly produced 20 bogus findings.** A raw filesystem walk returns 118 ACs for these 7 stories; 22 are archived (`AC-660`…`AC-681`, `AC-717`) and only 96 are live. The archived set is exactly the module-dial ACs REQ-84/REQ-85 retired — `git log -S` confirms their tests were deleted by the same commits that stripped the modules. Scanning without the `archived/` split would report ~21 uncovered ACs and propose `uat-add` for behaviour whose implementation no longer exists. That retirement is already correctly recorded.

One caveat on method: the ticket index was under continuous lock contention from concurrent dispatcher/dashboard processes (`index_fcntl_lock` timeouts on both tiers), so `xgd ticket list`/`query`/`reports` were unusable for most of the run. I enumerated the tree via the sanctioned `xgd_source.core.ticketing` module instead — which is what surfaced the archived split. Both notes are recorded in the report for the next runner.
