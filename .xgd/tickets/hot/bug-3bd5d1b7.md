---
uid: bug-3bd5d1b7
id: BUG-272
type: bug
title: 'Builder prompt: carries consultant-facing instructions and tools it never
  uses'
created_by: EPIC-20
created_at: '2026-10-24T22:13:03.531923+00:00'
updated_at: '2026-10-26T00:59:32.569385+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  priority: medium
  parent_uid: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  blocked_by: []
  chat_comment: comment-ef30d053
  commits:
  - working_sha: 88b5053ce6fb96e1e53d283a41b21dd3b7ba2be3
    reconcile_sha: null
    main_sha: null
  - working_sha: bc69efce8aee7978c785e9e7ec2e50d748a1264e
    reconcile_sha: null
    main_sha: null
  version: 0.2.654
  story_points: 3
---

## Symptom

A builder's starting prompt (~46.7K tokens on every run) is largely written for the consultant. The surface manuals and tool descriptions are shared between the two roles, and much of the shared text addresses a reader who talks to the client. The builder never does: its own role section says "A consultant is talking to the client… you are not". Measured on a captured builder request (DOC-68, "Second pass"), the builder is told:

- "Fetching a picture… ASK FOR IT HERE… the client can drop a file straight onto this conversation";
- "Tell your user the page exists and is empty", "acknowledge it to your user", "say that you saw it";
- "say *the crucible, IMAGE-5* when you talk to your client" (Library manual);
- "post the link `make_alternatives` answered with", "Never tell your client something is in the menu", "get their yes first";
- the full delegation manual, written for the party that hands work out (~5K characters), although the builder holds only `ReportResult`;
- "Your memory of this conversation" and "Reaching the rest of this conversation" (turn ids, a chat ticket, a recent window), none of which a one-turn worker has;
- the screenshot tool's statement that a picture "ages out" after two turns. That is false for a builder: images age only when a new user turn opens, and a builder lives for one turn.

Its tool list also carries four tools builders have never called in 329 sessions and the consultant still uses: `capture_site`, `list_references`, `describe_reference`, `KnowledgeChanges`. Tools nobody uses are deleted outright by REQ-453.

Cost: these contradict the builder's role and may hurt work quality, which is the main driver of builder spend (rework). They also add tokens to every builder request and push requests over Haiku 5.5's 100K long-prompt line (REQ-451).

## Fix (narrowed 2026-10-26: deletions plus one role line, no rewording mechanism)

Re-scoped by the operator via EPIC-20. On Haiku 5.5 the token saving is negligible: a simulated 2K / 4K / 8K-token cut on First-Draft-Tests 2–4 saves about $0.04 / $0.08 / $0.17 per first draft. So the case for this ticket is now quality: stop telling the builder things it can't do or that are false. Only low-risk deletions and one added line are in scope:

1. **Remove for the builder:** the conversation-memory blocks ("Your memory of this conversation", "Reaching the rest of this conversation") and the delegation manual. Keep the one line the builder needs: report with `ReportResult`. The builder's own "Reporting" section already covers checks and reporting.
2. **Builder tool list:** remove `capture_site`, `list_references`, `describe_reference` and `KnowledgeChanges` from the builder role's grant, along with their manual text. The consultant keeps them.
3. **One line in the builder's role section, in place of rewording shared text:** wherever a manual or tool description speaks to "your client" or "your user", it means the consultant's conversation. The builder never talks to the client. It reports what it did, and what it would ask the client, with `ReportResult`. The client may still edit the page while the builder works, and a change of theirs must never be overwritten. That rule stays in force, and the line says so.
4. **Screenshot ageing:** the builder's copy of the screenshot description no longer says images age out after two turns, because that is false for a one-turn builder. If the description is shared text, add the true statement to the item 3 line instead ("pictures you take stay for the rest of this run"), and don't build a per-role copy.

**Dropped from the original scope:** builder-worded copies of client-facing lines in the shared manuals and tool descriptions, and any per-role rewording mechanism (`builder-wording-core.ts` / `builder-wording.json` on the stopped branch). They change the meaning of shared text, add code to maintain, and are the part of this ticket most likely to hurt builder behaviour. Don't land them. The consultant's text is unchanged throughout.

**Keep unchanged:** the page vocabulary (generated from the validator's schemas), the L1 manual's workflows ("How these fit together"), the screenshot instructions apart from item 4, the knowledge manual (REQ-355), and every shared manual's wording.

**Out of scope:** the medium-confidence items (`measure_drawing` / `relate` / `solve`, shortening `compare`'s second picture spec, shrinking the Library manual).

## Gate

Waived by the operator (2026-10-26): implement, merge, try it on a first-draft test, and revert if it fails badly. The REQ-452 comparison, when it exists, is evidence after the fact, not a precondition.

## What landed

- **Memory blocks (item 1).** `roles.ts`: the transcript pointer and the work-log note render nothing for the builder role. The framework's memory charter is configured per manager, and the builder shares the consultant's, so `priming.json`'s `memory` block now turns the core's charter off and `productConfig` renders the same charter text, in the same place (the per-session tier after the role tier), under the host's `memory.charter` provider for every role except the builder. The consultant's, coordinator's and settings assistant's prompts are byte-identical to before.
- **Delegation manual (item 1).** `host-core.ts`: the box the builder's manual is projected from no longer includes the framework's delegation surface. `ReportResult` still reaches the builder as a tool with its own description, and the builder role's "Reporting" section covers it.
- **Grant (item 2).** `instances.json`: the builder's fidelity grant is `operations: [screenshot, compare]` instead of the `SeeSite` group (drops `capture_site`, `list_references`, `describe_reference`). `roles.ts` `builderKnowledge`: the builder's knowledge grant is every knowledge operation except the one whose tool is `KnowledgeChanges`, so an operation added to the surface later still reaches the builder. Their manual lines go with the grant.
- **Role line (items 3 and 4).** One paragraph after the builder role's opening, in both declared orders: "your client"/"your user" in shared tool text means the consultant's conversation, and the builder never talks to the client; what it did and what it would ask goes in `ReportResult`; the client may edit the page while it works and a change of theirs must never be overwritten; pictures it takes stay for the rest of the run and do not age out. The screenshot description is shared text, so it is left unchanged and the role line carries the true statement, per item 4.
- **No rewording mechanism.** Every shared manual and tool description reads the same to both roles.
- **Existing UATs updated:** `test_UAT_FC_REQ-295_delegation_config` now pins the builder's fidelity grant as `{operations: [screenshot, compare]}`. `test_UAT_FC_BUG-210_no_registerdefaults` now pins the core's charter off and the host's `memory.charter` session entry.
- **Size:** measured before the narrowing on a fully composed builder (browser plus system KB), the deletions took system text from 66.6K to 56.7K chars and tools from 49 to 45. The narrowed change keeps the deletions and adds the role line (~550 chars).

## Test plan

- UAT: a builder session's system prompt contains neither conversation-memory block nor the delegation manual. The consultant's system prompt still contains both.
- UAT: the builder's tool list doesn't include `capture_site`, `list_references`, `describe_reference` or `KnowledgeChanges`; the consultant's still does.
- UAT: the builder's system prompt contains the item 3 role line, including that a change the client made while it was working must not be overwritten.
- UAT: the builder's role line states that pictures it takes stay for the rest of the run and do not age out, and the builder's own role text never makes the two-turn claim. The shared screenshot description still says "ages out"; per item 4 it is not reworded, and the role line corrects it.
- UAT: the shared manuals' and tool descriptions' text is identical in the builder's and the consultant's prompts, apart from the removals above.
- Evidence: a first-draft test after landing; compare refusals, rework and report accuracy with FDT 3/4 (EPIC-20 2026-10-26 note).