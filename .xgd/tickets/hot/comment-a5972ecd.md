---
uid: comment-a5972ecd
id: COMMENT-2314
type: comment
title: Comment on request REQ-182
created_by: xgd
created_at: '2026-09-08T01:42:52.721767+00:00'
updated_at: '2026-09-08T01:50:42.944498+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-8c474a78
  kind: chat_transcript
---

<!-- xgd-turn id="fbbd7acc-6d29-45cc-bdd3-07bf7ebd112e-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T01:42:27.413795+00:00" -->
#### You
Please review the updated doc and implementation. Many things have changed since this ticket was originally written.

I am in some final stages of testing the new set up but it is far enough along you can start reviewing the integration.

Please update the ticket with your findings?

<!-- xgd-turn id="fbbd7acc-6d29-45cc-bdd3-07bf7ebd112e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T01:50:42.021155+00:00" -->
#### Claude
Reviewed and appended to REQ-182 (title and original body untouched; the review is a dated section below it). No code changed — this was a read-only review.

**The headline: BUG-63 already did most of this ticket, for a different reason.** When `bin/install` pulled four days of framework movement on 2026-09-07, `KnowledgeDocs` was gone and `Role` had frozen, so the control app stopped building. That forced migration landed the entry model, the provider registry and the death of the role mutation. What REQ-182 has left is smaller and differently shaped than when it was written.

**Item status**: 5, 12, 13 done; 7 done in substance; 2 and 6 half; 1, 3, 4, 8, 9, 10, 11 open.

**Four findings that change the ticket rather than just tick it off:**

- **Item 1 contradicts REQ-171.** Tiers concatenate product-then-role, but REQ-171 composed the preamble role-first on purpose — the first thing a model reads about itself sets the register. Putting `PRODUCT_SYSTEM` in the product tier inverts that. While there is one role, both halves belong in the role tier.

- **The cache boundary matters, but not for the reason stated.** KM is *already* off the per-turn path — an undeclared marker means nothing is volatile, so providers run once per session. What the missing marker actually costs is wire caching: the computed rule caches `consultant-system` alone (~4.2k of ~16–20k assembled), leaving the landscape and the ~10.8k manual summary charged fresh every turn.

- **Adopting the shipped defaults has two preconditions, both measured.** The product tier's own marker makes `_seedForTurn` fire, and an undeclared role tier then re-renders *everything* — 4 landscape reads across one cold start plus three turns instead of 1. And an upstream defect: `manager.js:530` hands the backend `assembly.stable` with `assembly.offsets`, but offsets are sliced over `sections` including the volatile ones, so a breakpoint lands mid-landscape, off by the summary's length. Reproduced against the framework source. Harmless today, live the day we adopt.

- **Items 2 and 8 are blocked upstream.** Both rest on reading the slug from `ctx.scope`. `SessionContext` declares `scope` and `toolbox` in both languages and neither manager ever populates them. That is why BUG-63 keyed reminders by `managerKey(slug, deps)`.

Also flagged: "readable in YAML" is unreachable on the Worker path (the framework ships its own defaults as JSON for that reason), and item 9's premise about archived `caretaker` sessions directly contradicts the comment in `roles.ts` — a question about the deployed store, worth confirming before deleting the alias.

I did not file the lagrange-framework bug for the offsets defect — say the word and I will.

<!-- xgd-chat-end -->