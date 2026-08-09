---
uid: comment-ab46f06f
id: COMMENT-854
type: comment
title: Comment on request REQ-125
created_by: xgd
created_at: '2026-08-09T00:45:36.241205+00:00'
updated_at: '2026-08-09T01:02:30.365817+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-dbdc904a
  kind: chat_transcript
---

<!-- xgd-turn id="78589db9-8ec4-4a73-8c16-564281d33420-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T00:45:32.088529+00:00" -->
#### You
Please take a look at DOC-20 and REQ-74 in lagrange-framework DOC-30 needs to be brought up to date with those

<!-- xgd-turn id="78589db9-8ec4-4a73-8c16-564281d33420-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-09T00:50:40.298573+00:00" -->
#### Claude
I'll start by reading the ticket and the relevant docs.

I have what I need. Now writing the updated DOC-30.

DOC-30 is rewritten and REQ-125 records the change. Documentation-only, so no code, no commit ceremony.

**What DOC-20 + REQ-74 changed for DOC-30.** The premise inverted. DOC-30 was written while the tooling object was *being designed*; DOC-20 now specifies the Toolbox and REQ-74 has shipped it (declaration ingest, config validation, group expansion, wire-spec + manual projection, schema validation, policy gating, provenance, audit, standalone validator — Python and JS, with a conformance corpus). So the declaration format is no longer ours to invent. DOC-30 is now "declare the L1 control surface as a Toolbox surface, and say how far `edit.ts` is from that."

DOC-20 names us twice: we are the **first external surface** (declared in this repo), and a listed refactor target — *"its closed-over site slug and unenforced `writes` flag become a declared scope axis and an effect classification."* Its call-type survey already checked 1stcontact L1 and confirmed `inproc` covers us.

**What the rewrite now carries:**

- R1–R7 mapped onto declaration fields, with the two the format does *not* discharge called out rather than glossed: **R4** (addressing has no field — it goes in an `l1_address` param type plus the `overview`, i.e. prose in the right places, not a checkable contract) and **R6** (DOC-20's `version:` is the *format* version; a surface cannot state its own).
- The concrete declaration: envelope, the full operation list — the surface declares everything `edit.ts` does and the *grant* narrows it, which dissolves the old "AI-facing subset only" complaint — plus param types, shapes, errors, effect-homogeneous groups (`Publish` split out deliberately), sequences, absences.
- Inherited security obligations, with **provenance (S5)** and **audit (S6)** as genuinely new and load-bearing here: every read on this surface returns third-party prose, and `inproc` defaults it *trusted*, which is wrong for all of them.
- REQ-74's two extra rules (quantifier; array base for optional selectors under an `allow_set`) and where they bite.
- `declare.ts` superseded field-for-field, and the **itemised gap list** the ticket asked for.

**Two findings worth taking upstream.** First, DOC-20 lumps our slug closure in with the `writes` flag. The `writes` half is fair — declared, enforced by nothing. The slug half isn't: no tool declares a `slug` parameter at all, which is stronger than a scope predicate (S2's own reasoning one level up — an absent parameter has no bad value to refuse), and `scope_axes: {applies_to: {param: …}}` can't express a construction-time binding. My recommendation in the doc is to keep the binding and propose construction-scoped declaration upstream, rather than adding a `slug` parameter just to fit the field set. Second, the missing surface version. Also noted: DOC-20 has no `examples:` field, while `declare.ts`'s structured examples are test-executable.

**Size of the gap** — bigger than DOC-30's optimistic case, smaller than it looks, because most of it is upstream code we now get free. Local work: the declaration as data (JSON — REQ-74 ships no YAML parser), an `L1Toolbox` over `edit.ts`, eight declared return shapes, the builder-chat instance configuration, the author-time validator in CI, and deletion of `declare.ts` plus the local manual renderer. Predominantly deletion, as DOC-20 predicted for the ticketing and knowledge bridges.

<!-- xgd-turn id="e20b5382-c521-41df-90e6-beacf2824807-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T00:59:44.266974+00:00" -->
#### You
Do you need to make any DOC-20 changes?

<!-- xgd-turn id="e20b5382-c521-41df-90e6-beacf2824807-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-09T01:00:37.501008+00:00" -->
#### Claude
Good question — let me check whether the fold-back REQ-74 itself flagged is still outstanding, and whether a ticket already covers it.

Yes — four changes, but only one of them comes from my work. The other three are a fold-back REQ-74 already committed to and never made.

**Confirmed outstanding (REQ-74's own words: "worth folding back into DOC-20"). Neither rule appears anywhere in DOC-20 today — I grepped it.**

1. **The quantifier rule.** A projection yields alternative denotations of *one* value (any admitted denotation admits it); a list parameter yields *distinct* selections (every one must be admitted). REQ-74 calls conflating them "a security bug in one direction and an unusable policy in the other," and notes it's what makes `ai_ticketing`'s bare-repo/fully-spelled asymmetry fall out with no special case — which is exactly the evidence S4 asks for and doesn't have.
2. **Array base for optional selectors under an `allow_set`.** DOC-20 S4 requires an absent optional selector to *narrow* to the scope, but a `string`-typed selector can't hold a set, so narrowing silently degrades to unconstrained — the precise hole the rule exists to close. Also worth recording REQ-74's finding that `when_unset` needs no matcher of its own (`deny` = an empty allow set).

**Factual correction, from DOC-30.** The refactor-targets bullet reads *"its closed-over site slug and unenforced `writes` flag become a declared scope axis and an effect classification."* The `writes` half is right. The slug half isn't: no tool declares a `slug` parameter at all, which is stronger than a scope predicate — S2's own reasoning one level up, an absent parameter has no bad value to refuse. As written, DOC-20 instructs a refactor that trades a real safety property for a declarative one.

**Genuinely open, not a correction.** `scope_axes` (`applies_to: {param: …}`) can't express a constraint over a construction-time binding; no field for a surface's own version; no `examples:`. Each needs a decision, and the first is the one that blocks our refactor either way.

**What I'd do:** items 1–3 are edits DOC-20 already owes — no new decision, and leaving them out means the next surface author re-derives the quantifier rule from a bug. Item 4 is a design change to a document that's been implemented against; it wants its own lagrange-framework ticket, not an inline amendment from me.

I haven't touched DOC-20 — it's another repo's design record and outside REQ-125's scope. Want me to make 1–3 now (I'd need a lagrange-framework ticket to carry them), and file item 4 as a request there?

<!-- xgd-turn id="474bbef3-acbf-4881-ac3d-f3a14efb66e6-user" -->

<!-- xgd-chat role="user" ts="2026-08-09T01:02:30.187641+00:00" -->
#### You
Please make the changes to the doc-20

Do the changes require an update to what was build in REQ-74? If so can you create and REQ for the delta?

<!-- xgd-chat-end -->