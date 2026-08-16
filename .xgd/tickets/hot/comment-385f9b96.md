---
uid: comment-385f9b96
id: COMMENT-1093
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T08:34:16.544522+00:00'
updated_at: '2026-08-16T08:34:16.544522+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4433bf39
  kind: note
---

**Result: FAIL** — REPORT-2094 (`report-4433bf39`), 2 violations / 5 warnings / 0 needs_review.

## Scope

7 stories, **100 live ACs** (98 active, 2 pending). Set moved +4 since the last uat cycle: +5 new (AC-1124…1128, REQ-136) and −1 relocated (AC-932 moved to STORY-97). **Every one of the 100 has a matching `test_UAT_AC<n>_*` test** — no name-level coverage gap, and only AC-685 has two tests (legitimate split across its two paragraphs).

## Execution limitation — reported, not worked around

I could not run the suite. `npx vitest run` and `./node_modules/.bin/vitest run` were both denied by the permission layer in don't-ask mode. I did **not** restate the prior cycle's green result as current. All findings are established by static verification at named file:line, which is sufficient here because none turns on a runtime outcome — they're about assertions that are absent, a gate that hides a skip, and a mock that's present. Prior cycles recorded the suite fully green while carrying six of these same seven findings, so greenness was never the signal.

## Violations

1. **AC-685 over-claims the emitter's guarantee.** ¶1 says the neutralisation "holds even for a value that bypassed validation"; ¶2 lists closed enums as re-derived. `grep cssEnum render.ts` → 0 hits; enums are still interpolated raw at `:227`, `:624`, `:676`, `:1992`, `:1993`, `:1996`, `:2006`, `:2089`. DOC-2 §2 lists the Layer-2 guarantees as text/colour/font-family/length/image-src — enums aren't among them, so policy and code agree and the AC is wrong. Exposure is bounded (Layer 1 rejects it). Fourth cycle.
2. **AC-1012's test proves neither half of its Verification.** The browser arm sits behind a bare `if (!HAVE_CHROMIUM) return` at `:460`, so an unrun arm reports *pass* rather than *skip*; and the round-trip fidelity clause is exercised by no arm at all — the fixture is synthetic with no capture to compare against, and "fidelity" appears only in a comment.

## Warnings

Same silent-gate pattern at AC-1009/AC-1011; the internal `vi.doMock` in AC-702's negative arm; AC-686/687's second Verification clauses (proven by AC-849, so an attribution gap); AC-930's conversion drive duplicating STORY-97's AC-942.

## The new signal this cycle

**AC-718's test has moved past its own AC** — the reverse of normal drift. The test already asserts the post-REQ-96 truth (`submitLabel`, `control` leaf, no `contact-form__submit`) while the AC still describes `intro`/`submit` slots and the retired "capability" type. That's independent evidence for the ac-level cycle's changed recommendation to **deprecate** AC-718/719 rather than edit them a fifth time: the evidence layer has already voted, for AC-701's wording.

Two items resolved and closed explicitly so a later cycle doesn't re-open them: AC-932's cross-capability duplicate (fixed by relocation) and REQ-136's five new ACs, which land clean with substantive UATs on real entry points.
