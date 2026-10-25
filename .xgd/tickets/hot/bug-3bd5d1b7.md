---
uid: bug-3bd5d1b7
id: BUG-272
type: bug
title: 'Builder prompt: carries consultant-facing instructions and tools it never
  uses'
created_by: EPIC-20
created_at: '2026-10-24T22:13:03.531923+00:00'
updated_at: '2026-10-24T22:13:39.250131+00:00'
completed_at: null
last_field_updated: blocked_by
status: draft
fields:
  severity: medium
  priority: medium
  parent_uid: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  blocked_by:
  - request-2f9b6446
  chat_comment: comment-ef30d053
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

## Fix

Only the cuts DOC-68's second pass rated **high confidence**, plus the per-role rewording it rated medium-high. Every cut keeps the builder's purpose intact, and each is listed in the commit:

1. **Remove for the builder:** the conversation-memory blocks and the delegation manual. Keep the one line the builder needs: report with `ReportResult`. The builder's own "Reporting" section already covers checks and reporting.
2. **Builder tool list:** remove `capture_site`, `list_references`, `describe_reference`, `KnowledgeChanges` from the builder role's grant, along with their manual text. The consultant keeps them.
3. **Builder-worded versions of client-facing lines** in the shared manuals and tool descriptions. Where a line carries something still true for a builder, it survives in builder words. Above all: the client may edit the page while the builder works, and a change of theirs must never be overwritten. Where a line has no builder meaning (asking the client for files, catalogue numbers for talking to the client, posting a link to the user), the builder's copy drops it. The consultant's text is unchanged.
4. **Screenshot ageing:** the builder's copy of the screenshot description no longer says images age out after two turns. It says what's true for a builder: they stay for the rest of the run, so look when there's a reason. If framework in-turn ageing lands first, keep the text consistent with that instead.

**Keep unchanged:** the page vocabulary (generated from the validator's schemas), the L1 manual's workflows ("How these fit together"), the screenshot instructions apart from item 4, and the knowledge manual (REQ-355). DOC-68 rates removing these as unsafe without evidence.

**Out of scope:** the medium-confidence items (`measure_drawing` / `relate` / `solve`, shortening `compare`'s second picture spec, shrinking the Library manual). Those wait for their own evidence.

## Gate

**Blocked by REQ-452** (builder replay evaluation). The change lands only after REQ-452 compares today's builder configuration with this one on the recorded briefs and the operator accepts the comparison. Checks, report accuracy (especially false passes), page warnings, out-of-scope writes and completion must not get worse. The comparison is attached to this ticket.

## Test plan

- UAT: a builder session's system prompt contains none of the consultant-facing passages listed above (memory blocks, delegation manual, "ASK FOR IT HERE", "your client"/"your user" instructions). The consultant's system prompt still contains each of them.
- UAT: the builder's tool list doesn't include `capture_site`, `list_references`, `describe_reference` or `KnowledgeChanges`; the consultant's still does.
- UAT: the builder's prompt still tells it not to overwrite a change the client made while it was working.
- UAT: the builder's screenshot description doesn't claim pictures age out after two turns.
- Evidence: the REQ-452 comparison report for this change.