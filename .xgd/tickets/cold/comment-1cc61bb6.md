---
uid: comment-1cc61bb6
id: COMMENT-671
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T20:55:08.688853+00:00'
updated_at: '2026-08-05T20:55:08.688853+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-9f821d26
  kind: note
---

Report **REPORT-1316** (`report-9f821d26`) created — schema verified: `result=fail`, `level=uat`, violations 2, warnings 4, needs_review 0.

## Verdict: FAIL

I executed all 24 AC-linked UATs rather than reasoning about them: **22 passed, 2 skipped**, 5/5 files green in 2.27s.

**Violations (both on AC-685, and they resolve in order):**

1. **`test_UAT_AC685_*` covers only half its criterion** — ¶1's four sinks (text/alt/img-src/font-family). ¶2, added by REQ-90/91 and restated in the AC's own Verification step, demands payloads in gradient stops, border colours, background-image URLs, mask/transform fields and font-face entries. No AC-linked test does that. The nearest FC tests are either validator-only (`req91:109`) or clean-input controls (`req91:290`). The emitter *does* implement the defence (`render.ts:42,178,196,215`), so this is an evidence gap, not a code bug.

2. **AC-685 over-claims against the code.** Its unqualified "holds even for a value that bypassed validation" is honoured for text, colours, URLs, font-family and numbers — but **not for closed enums**, which are interpolated raw: `border: ${w} ${style} ${c}` (`render.ts:220-221`), plus `text-align`, `font-style`, `mix-blend-mode`, `list-style-type` and seven more. Under the AC's own premise a `border.style` payload closes the rule. Exposure is bounded — `schema.ts:538` puts Layer 1 genuinely in the production render path — and escalating to intent resolves it *against the AC*: DOC-2 §2 enumerates the Layer-2 guarantees without enums, so policy and code agree and the AC is the thing out of step. Recommended fix is `ac-edit`, with `code-issue` as the alternative if the operator wants the stronger guarantee. Evidence is by inspection at named lines; I produced no failing test, since this check is read-only.

**Warnings:** one internal mock in AC-702's negative arm (`vi.doMock` of the framework root — no unmocked route exists today, `cmdRender` has no resolver seam); two same-shape test duplications (AC-718↔AC-701, AC-716↔AC-686) that are blocked on the same story-level fold decision as the ac cycle; and retired "capability"/"dial" vocabulary in two test docstrings.

**One thing worth your attention beyond the findings:** AC-683 and AC-688 skipped — not because the repo is wrong, but because the shared Playwright browser cache holds build `-1234` while the declared `playwright@1.61.1` needs `-1228`. The effect is that this run proves the validator and emitter thoroughly and the browser-observable behaviour not at all, including the capability's own headline round-trip gate `capture(render(L1)) ≈ L1`. `npx playwright install` in this worktree would fix it. I filed it as info because no matrix edit fits it, but it isn't cosmetic.
