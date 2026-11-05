---
uid: comment-e000806f
id: COMMENT-5784
type: comment
title: Comment on bug BUG-303
created_by: xgd
created_at: '2026-10-27T20:44:23.448316+00:00'
updated_at: '2026-10-27T21:14:43.810879+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-1656144d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c3985972-4017-405e-8d6e-922319297de2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-27T20:44:18Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-27T20:44:18Z" -->
#### You
Can you explain why 33 is still there? I ran bin/build and kb said nothing to do.

<!-- xgd-chat role="assistant" ts="2026-10-27T20:44:18Z" -->
#### Claude
kb ensure only checks the index against the files in kb/system and projections against their sources; it never compares the files against the doc tickets. exportCorpus would have removed DOC-33 but only runs inside a build, which ensure never started.

<!-- xgd-chat role="user" ts="2026-10-27T20:44:18Z" -->
#### You
No fix for tonight - please file a bug and we will do it properly.

<!-- xgd-turn id="be5f4187-9c88-42b4-b6ba-88d0727b6e27-user" -->

<!-- xgd-chat role="user" ts="2026-10-27T20:47:32.932543+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="be5f4187-9c88-42b4-b6ba-88d0727b6e27-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-27T21:14:41.130136+00:00" -->
#### Claude
Ticket scope is set; I've cut the `free-BUG-303` branch and am reading `kb.ts` (export + coherence check) before writing the fix.

Still reading: checking how existing KB tests stub the ticket store, since adding a ticket comparison to the shared coherence check will affect every test that calls it.

Typechecks. Now running the existing KB suites to see what the new check disturbs (fixtures that hand-write corpora with no agreeing ticket store).

Pointing the four affected suites at the new fixture ticket store (BUG-48, REQ-358, BUG-156, REQ-322).

Now the four BUG-303 UATs.

All seven pass. Running the remaining KB-touching suites; first copying the gitignored control-app `generated/` dir into the worktree (fresh worktrees lack it).

Passes (it's a ~103s test near its 120s limit; the earlier failure was load, not this change). Lint check, then commit.

Before committing, updating the ticket body so it matches what was built (it now names the fixture helpers and the new `behind` list).

Ticket body updated (on xgd-working). Now the promotion sequence: lock, merge working into the branch, bump the version there, fast-forward back.

BUG-303 is fixed and merged into xgd-working. `1c kb ensure` and `1c assets` now compare `kb/system/` against the doc tickets, not just the index against the files. The ticket is at `free_coded` (version 0.2.682). It needs promoting to reconcile when you're ready.

**What changed** (`tools/generate/src/cli/kb.ts`)
- **New dry-run check:** `corpusBehind` works out what `exportCorpus` would change, without writing anything. It renders and selects documents exactly the way the export does, so the two can't disagree. It returns one line per document:
  - `DOC-33: no longer system_kb (now architecture), will be removed`
  - `DOC-9: no doc ticket, will be removed`
  - `DOC-75: now system_kb, will be added`
  - `DOC-74: ticket changed, will be rewritten`
- **Wired into the existing coherence check:** `kbSkew` reads the tickets with one `xgd ticket list` and records any differences in a new `behind` list. Because both `kbEnsure` and `1c assets` already rely on `requireCoherentKb`, a corpus that's behind its tickets now triggers a build in `ensure`, and `1c assets` refuses to ship it before writing anything.
- **Messages:** the refusal has a new "BEHIND its tickets" section naming each document. The quiet line now reads "the corpus matches its doc tickets, … nothing to build".
- **Unchanged corpus:** nothing is rewritten and no file stamps move.

**Tests**
- I added the four UATs from the ticket in `tests/test_UAT_FC_BUG-303_corpus_follows_its_tickets.test.ts`. They cover a doc leaving the KB, a doc joining or changing, staying quiet when the tickets match, and `1c assets` refusing.
- The BUG-48, REQ-358, BUG-156 and REQ-322 suites hand-write their own fixture documents with no matching tickets, so the new check read them against this repo's real tickets and failed eight tests. I added three helpers to `tests/support/kb-fixture.ts` (`useTicketStore`, `writeTicketCorpus`, `adoptCorpus`) that give each fixture an `xgd` stand-in answering with matching tickets, and pointed those suites at them.
- All 13 KB suites pass. In one batch, `test_UAT_AC1293_status_reports_the_corpus_size_and_each_artefact` hit its 120s timeout. Alone it passes in the main checkout, and in the branch with a longer timeout it took 103s, so I put that down to machine load, not this change.
- Lint didn't run: `npx eslint` failed because `~/.npm` contains root-owned files. The fix it suggests is `sudo chown -R 501:20 "/Users/martin/.npm"`.

`kb/system/DOC-33.md` is still on disk and in your current index. Your next `bin/build` should report DOC-33 as to-be-removed and rebuild. That rebuild needs the Workers AI credential (`CLOUDFLARE_API_TOKEN`). The dev deploy keeps serving the old snapshot with DOC-33 until you redeploy.

<!-- xgd-chat-end -->