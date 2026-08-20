---
uid: comment-7db961ca
id: COMMENT-1199
type: comment
title: Comment on request REQ-43
created_by: xgd
created_at: '2026-08-20T00:54:56.983510+00:00'
updated_at: '2026-08-20T00:57:05.831300+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-11bf4b9a
  kind: chat_transcript
---

<!-- xgd-turn id="8eb181dd-6cfc-445d-912d-0914137e8d9d-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T00:54:52.068442+00:00" -->
#### You
Is this ticket still relevant?

<!-- xgd-turn id="8eb181dd-6cfc-445d-912d-0914137e8d9d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-20T00:57:05.608037+00:00" -->
#### Claude
**Mostly not — about 60% of it has been overtaken by the pivot, and the rest duplicates REQ-17.**

**What broke the premise.** REQ-43 was written when a "module" was a *layout* unit (hero, services-grid, …) and the set was 8+ and growing per design gap. Template-and-stamp exists purely to amortise 4×M prose duplication across a growing M. Post-pivot (REQ-79/84/96), layout is L1 and "module" means *behavior module* — there are exactly two (`carousel`, `contact-form`), and DOC-26 makes authoring a new one the last resort/highest bar. At M=2 with rare growth, the stamp machinery costs more than the duplication it removes.

**What's already done.** REQ-85 (free_and_reconciled) landed the backfill in code form:
- Both behaviors declare the full obligation set — `packages/framework/src/modules/carousel/meta.ts:47`, `contact-form/meta.ts:78` (`conformance.obligations`). That declared field is effectively the code-native "stamp."
- Both are exercised across all dimensions: `tests/req39-conformance.test.ts` … `req42-conformance-x-browser.test.ts` plus `tests/req85-conformance.test.ts` (isolation, with a negative fixture proving it discriminates).
- The harness itself (REQ-39–42, all reconciled) lives at `tools/generate/src/conformance/`.

**What's stale in the body.** The template is specified as 4 ACs; REQ-85 added a fifth (`isolation`), so the template prose would need rewriting before it could be stamped anyway.

**What genuinely remains unbuilt:**
1. **Publish gate** — `fast` advisory on draft / `full` mandatory at harden→Tier-A. Real and unbuilt, but it is already REQ-17's deliverable ("publish gates on module hardening"), which is still `draft`.
2. **Exemption recording** — the harness has an `except` option, but nothing records an opt-out on the story or surfaces it in the evidence projection.
3. **Matrix stamp + supersession fan-out** — this is matrix authoring, which per DOC-21 reconciliation derives from free-coded commits; this loop doesn't author it. It's really the XGD trait-AC / multi-surface gap (FRAGILE §6 #6), which REQ-43 itself lists as out of scope.

**Recommendation:** withdraw REQ-43 (`wont_fix`/`abandoned`), noting that the backfill landed under REQ-85 and folding the publish-gate wiring + exemption surfacing into REQ-17 as its hardening criteria. Alternative if you'd rather keep the ticket: narrow it to "publish-gate wiring + exemption surfacing only," drop the stamp/template entirely, and close REQ-17's overlap.

Want me to do either? I haven't touched the ticket.

<!-- xgd-chat-end -->