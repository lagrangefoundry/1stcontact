---
uid: request-e8c3ebcf
id: REQ-446
type: request
title: 'Copy: the principal writes it for a stranger (''true to her words, written
  for a reader''), builders place it unchanged — no more interview answers pasted
  onto the page'
created_by: EPIC-19
created_at: '2026-10-24T19:32:07.412994+00:00'
updated_at: '2026-10-24T20:12:33.449714+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 3
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-a8d4d9e9
  commits:
  - working_sha: 24bbce5a112eed2594d68f37ff32b8e5a8d017ac
    reconcile_sha: null
    main_sha: null
  - working_sha: 8227c126d65e9ef6e90f733b57cf67fbd2b49e5f
    reconcile_sha: null
    main_sha: null
  version: 0.2.619
---

## Why

Dina's Diner's home page carried her interview answers verbatim, in the order she
gave them, with the questions removed:

> Hal's counter, since 1981.
> Hal was a friend. I worked for him, and he came to my graduation.
> When Hal said he was going to sell to some chain, I said "sell it to me".
> I didn't have the money… a promise to Hal that I'd keep the counter stools.
> Hal still comes in Tuesdays and complains about the coffee being too good.

In the chat each line answered a question, and the question was the context. On
the page the context is gone. Nobody has met Dina, "I" is nobody, and "Hal's" reads
as a second business. A review signed "— Hal B., stool #1" only makes sense if you
already know who Hal is.

The pipeline moves the client's words from chat to notes to page and **never
writes them for a reader**. The builder reported "All client copy was preserved
verbatim" as a success. The consultant asked the questions, the builder was told
to keep the words, and the critic was handed the notes (BUG-271). All three were
insiders, so nobody read it as a stranger.

The operator: "critical". Copy is something "we want to get mostly right" by the
first draft. This is done without adding steps or checkboxes for the client: no
"approve the copy" stage, and nothing new on the story board.

## What changes

### 1. The principal writes the copy, and builders place it

- The principal (consultant) writes every section's copy before it briefs a
  build. The `Delegate` brief carries the **finished copy**. The builder places it
  and does not write, rewrite or reorder words. If a layout needs a shorter line,
  the builder says so in its report and the principal decides.
- This is writing, not transcription. The rule changes from "keep the client's
  words verbatim" to **"true to their words and voice, written for a stranger"**:
  - **Introduce before relying:** every person, business and history is introduced
    where the page first needs it ("Dina Alvarez took over Hal's diner in 2015…")
    before a first-person line or a second name leans on it.
  - **Anchor the voice:** first-person passages are clearly the owner speaking (a
    lead-in, a signature, or a quote attribution), not unattributed "I".
  - **Order for the visitor:** sections and lines go in the order a visitor needs
    (what this is, why stop, what to eat, how to get here), not the order the
    interview happened.
  - **Keep the voice:** the client's own phrases, facts and turns of speech are
    kept wherever they work. Joining text is short and plain. Nothing is invented:
    no new facts, numbers or claims the client has not given.
  - **One idea, written as a passage:** related lines become a paragraph with a
    point, not a stack of one-sentence statements.
- The consultant's and builder's instructions (`priming.json`, the `Delegate`
  description, and any "preserve verbatim" lines) change to match, within the
  priming budget.

### 2. The reader checks it

- BUG-271's cold read (a reading of the page with no brief, notes or decisions) is
  the reader for copy: anything the cold read cannot follow ("who is 'I'?", "is
  Hal's the business?") is a finding, and a high-severity one when it is in the
  first screen or the first section.

## Test plan

`tests/test_UAT_FC_REQ-446_copy_written_for_a_reader.*`:

- The `Delegate` description and builder priming no longer instruct verbatim
  preservation. They instruct placing the principal's copy unchanged and reporting
  a needed cut.
- A scripted build whose brief carries copy: the page's text equals the brief's
  copy (the builder did not rewrite it).
- The consultant priming names the writing rules: introduce before relying,
  anchor the voice, order for the visitor, keep the voice, nothing invented.
- With BUG-271's cold read: a fixture page opening on an unintroduced first-person
  line yields a high messaging finding.
- Re-run the priming budget UATs and the REQ-427/BUG-271 critic UATs.


## As implemented (free-coded)

**Consultant (`priming.json`, within the BUG-129 budget, net −3 chars):**
- *Commissioning construction* (`delegation-method`): the "quote the client's
  headline and notes verbatim, say they are the client's own words" paragraph is
  replaced. A brief that puts words on the site carries the principal's
  **finished copy to place unchanged**: the builder never rewrites or reorders
  words and reports a line that will not fit. A brief not about words carries no
  copy and none of the board (BUG-233's rule, kept).
- Each passage of copy is asked for as a host-settled text check
  (`page home contains the text "…"`, BUG-225's existing form; the "Two more kinds
  of check" paragraph now says "each passage of copy"). So a builder that rewrote
  the copy comes back `failed` by the host's record, quoting what it wrote, rather
  than self-certified. No new mechanism: this reuses BUG-225's settlement.
- *The story board*: "Write the copy from the hearted notes and the chosen
  headline, true to their words and voice, written for a stranger", followed by
  the rules: introduce before relying, anchor the voice, order for the visitor,
  keep the voice (nothing invented), and related lines make one paragraph. "A
  builder never sees the board, only the copy in its brief."
- Paid for by tightening unpinned wording without changing meaning: the `note`
  paragraph, "one builder's job", the parallel-work paragraph, the "View on your
  phone" paragraph, the story-board intro, and one clause in "Two things come back".

**Builder (`builder_priming`, both lists):** "The words on the site come from
the brief. Place its copy exactly as written: never rewrite, shorten or reorder
it, and never add words of your own. Where the layout needs a shorter line, or
words the brief did not give, place what you were given and say in your report
which line and why: the consultant decides."

**Critic (`critic_priming`, messaging lens):** BUG-271 landed its cold read and
comprehension checks on xgd-working while this was in progress (6754e1de4d). On
merge, BUG-271's lens text is kept whole, and REQ-446 adds one sentence after "A
name is proof only once the visitor knows who it is.": **"An unintroduced name or
"I" in the first screen or the first section is high."** The conflict resolution
(this sentence, and the updated critic UAT below) is in merge commit 7fe401ba40.
Reconciling 24bbce5a11 onto a main that has BUG-271 must keep BUG-271's lens and
add only this sentence. The lens wording 24bbce5a11 itself carried ("Read the
copy as a stranger who knows only the page…") is dropped.

**Supersedes BUG-233's wording:** its UAT
`test_UAT_FC_BUG-233_the_consultants_delegation_method_says_when_to_quote_the_client`
pinned "quote … verbatim, and say they are the client's own words". It now pins
the new wording and keeps BUG-233's own point (no board in a brief not about words).

**BUG-271's cold read is the reader:** its own UAT
(`test_UAT_FC_BUG-271_an_unintroduced_name_found_by_the_cold_read_is_reported_under_messaging`)
drives the fixture page that opens on an unintroduced first-person line through
the cold read to a messaging finding. REQ-446 pins the severity rule it applies.

**UATs:** `tests/test_UAT_FC_REQ-446_copy_written_for_a_reader.workers.test.ts`
- method and builder priming carry no verbatim instruction; they say place
  unchanged and report a cut
- consultant priming names the writing rules (both priming lists)
- a scripted build through the real route places the brief's copy: the text check
  is `passed` by `account`, and the builder was sent both the copy and the placing
  rule
- a builder that rewrote the copy: the same check is `failed` by `account`, and
  the reason quotes the rewritten text
- `…_an_unintroduced_name_or_voice_up_front_is_a_high_messaging_finding`: the
  messaging lens carries BUG-271's "introduced before the page relies on them" and
  REQ-446's first-screen/first-section "is high" sentence