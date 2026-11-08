---
uid: comment-7233c5c3
id: COMMENT-8025
type: comment
title: Comment on bug BUG-383
created_by: xgd
created_at: '2026-11-08T19:10:19.436319+00:00'
updated_at: '2026-11-08T19:42:55.360598+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-c960af0a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0401c7c8-0596-425f-a65e-842710c03158",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="cfa9e326-16a5-46ee-8377-ee0911ce6a1d-user" -->

<!-- xgd-chat role="user" ts="2026-11-08T19:09:45.476245+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="cfa9e326-16a5-46ee-8377-ee0911ce6a1d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-08T19:42:52.156861+00:00" -->
#### Claude
Ticket read. The footer is wrapped by the renderer itself, so the regex risk is real but narrow. I'm now looking at the consultant-rules pattern and the page create/rename paths.

Plan set: replace the footer regex, add rule 15 plus a footer note, and reserve `legal`. Now finding where page slugs are validated.

Reserving in the schema would invalidate any stored site that already has a `legal` page, so I'll put the refusal in the create/rename tools as the ticket says. Locating them.

I'll put the `/legal` refusal in `claimPageIdentity` and `editPageUpdate`. Setting the ticket to free_coding and cutting the branch.

Worktree ready. Now the renderer change: the legal row goes inside the footer wrapper the renderer itself writes, no regex.

Now the `/legal` reservation in the page tools.

Now the consultant rule (rule 15) and the footer note, spliced textually per the priming.json escape quirk.

Now the UATs. Looking at REQ-665's tests for the setup to reuse.

Writing the UATs now; checking the catalog fixture for a footer first.

Five pass; the "nothing written" check just needs to compare before and after, because the page list also includes the generated order pages.

All six pass. Now the regression scope: legal, page-name, shared-parts, copy-page, priming and surface suites.

The batch timed out and shows some failures. Checking which ones fail on clean xgd-working too.

BUG-92's failures are the generated order pages showing up in the page list, nothing to do with this change. Confirming all three files fail the same way without my diff.

Same 9 failures at baseline, so none come from this change. Last check: suites that pin the rules text or the priming budget.

REQ-473's failure is the knowledge-base lookup that fresh worktrees lack (no generated KB); every rules-text assertion passes. Running a typecheck before committing.

Typecheck is clean for the touched files. Reading my promotion notes, then committing.

Update the ticket body first so it matches what was built, then commit.

The broad run left two untracked test fixtures in `bin/deploy.d/`; removing them. Then the merge-back loop.

Done. A quick search for duplicate tickets turned up none, so I implemented it rather than closing it as a dupe.

BUG-383 is implemented and merged into xgd-working. The ticket is at `free_coded` with commits `35fefe8e` (the fix) and `e7092fce` (version 0.2.829). The only related tickets are REQ-665, REQ-666 and REQ-669, and none of them covers this.

**What changed**
1. **Footer legal links can't go missing.** The renderer now writes the legal links inside the footer element it builds, instead of patching them into the finished footer HTML. The old pattern did happen to match today, because the renderer always ends the footer with `</footer>`, so this removes a weak point rather than fixing a live outage. A page without the site's footer still gets a footer holding just the links.
2. **New consultant rule 15:** legal pages and footer legal links are provided by the platform. The consultant must never write legal text, a legal page or a legal link, and sends the owner to Paperwork → Legal for anything legal. The `add_page` guidance on footers now also says the platform adds the legal links and the consultant shouldn't add its own.
3. **`/legal` is reserved.** Creating, copying or renaming a page to `legal` or anything under `legal/` is refused, with a message pointing to Paperwork → Legal. Addresses that only start with the word, like `legal-services`, still work.

**One decision for you to check:** the `/legal` block is in the page tools, not the site schema. A schema rule would make any site that already has a page at `legal` fail every later save; this way such a site still loads and the page can be renamed. The old "nested address" error also suggested `legal-privacy` as an alternative, which is exactly the kind of made-up legal page this ticket is about. The new refusal now comes first.

**Tests:** the 6 new tests in `tests/test_UAT_FC_BUG-383_legal_pages_are_the_platforms.test.ts` pass. The rule-text tests pass (44 passed, 2 skipped). In the related suites, 9 tests fail, and all 9 fail the same way without my change:
- 2 in BUG-92, because the page list now includes the generated order pages.
- 7 in two older consultant prompt-text suites.

REQ-473 also fails, because a fresh worktree has no generated knowledge base. The typecheck is clean for the files I touched.

The ticket body now describes what was built. Moving it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->