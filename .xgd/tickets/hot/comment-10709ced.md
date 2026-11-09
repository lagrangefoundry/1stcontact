---
uid: comment-10709ced
id: COMMENT-8134
type: comment
title: Comment on bug BUG-404
created_by: xgd
created_at: '2026-11-09T17:39:07.825460+00:00'
updated_at: '2026-11-09T17:58:29.241109+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-8e764152
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8b31a467-6fc2-48dd-8161-6beff07a8fa7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e2da6d76-b795-4cb8-a0ed-873d79b7656a-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T17:37:21.048088+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="e2da6d76-b795-4cb8-a0ed-873d79b7656a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T17:58:28.849025+00:00" -->
#### Claude
Checking for a duplicate ticket, then reading the width control and `ReportBug` code.

Not a duplicate. Setting status and cutting the branch.

`humanId` is already returned by the project. Now checking what `ReportBug` actually hands the model.

Upstream already passes `id` (the human id) back. Checking whether the platform store's `create` actually fills `human_id` on the ticket it returns.

Writing a probe UAT to see whether `report_bug` returns a human id from the platform store.

Next: running a probe in the worktree to see whether `report_bug` comes back with `id: null` (which would explain the uid).

Root cause confirmed: the platform store's `create` hands back `human_id: null`, so the consultant only had the uid. Finding where `create` drops it.

Upstream's `canonical()` projection drops `human_id` entirely. Checking how the console gets PLATFORM_ISSUE-13 then.

Upstream projection omits `human_id`, yet the product's `Ticket` type claims it. Checking the Python peer to see which side is the outlier.

Now the width wording. Checking how the layout cue template is filled and what `upgrade-check.ts` says.

Making the edits. First the store side: `tickets.ts` and `platform-issues.ts`.

Now `platform-issues.ts`.

Store side done. Now the width wording, taken from `view-width.js`'s labels.

No "computer" left in the consultant's guidance. Updating the one existing UAT that pinned the old 390px wording, then the filing rule.

Now the filing rule. Checking whether `PLATFORM_ISSUES_LABEL` can be imported, so the rule names the console section by the same string the console uses.

The console's own labels are "Console" and "Issues filed"; the rule will use those constants.

Now typechecking, then the UATs.

Control-app typechecks clean; the two `generate` errors are in files this change doesn't touch (`material-import.ts`, `zip-reader.ts`). Writing the UATs.

Test bug: the overlay check names no width. Filtering to the checks that do.

These drive Chromium; checking whether they fail the same way without my change.

Same two failures without my change: Chromium won't launch inside this sandbox. Dropping my stash entry, then running the rest of the priming suites that read the changed templates.

Four UATs pin the old "computer" wording; this ticket replaces that wording, so I'll update them. Checking the exact lines.

A KB-backed test now fails; the memory notes say suites in a worktree can blank `generated/kb.js`. Re-copying it and rerunning the KB suites.

The REQ-648 consultant check reads a system-KB doc, and that doc still says "on a computer". Finding which KB docs carry the phrase.

DOC-75 (the consultant's tools playbook) carries both phrases. It's a doc, so I'll update its wording directly in the store.

The first mention is about the client's own device (how to send a file), not a preview width, so it stays. Replacing the other four.

DOC-75 updated. Rerunning the KB suites in the worktree.

REQ-648 passes now. REQ-472 is about the motion reference doc (DOC-74), which I haven't touched. Confirming it fails the same way on clean `xgd-working`.

Same failure on clean `xgd-working`, so it was already failing. Running the workers suites that read the priming or filing code.

zsh doesn't split an unquoted variable; rerunning with `${=L}`.

Neither failure looks like mine ("LinkedIn" isn't something I added, and the size is 11k over against my ~250 chars). Checking clean `xgd-working`.

Both fail the same way on clean `xgd-working` (my rule adds about 200 chars to an already over-budget prompt). Next: the version bump and commit. Reading the promotion memory first.

Committing the code on the branch (excluding the gitignored generated files).

Code committed on the branch. Now locking, merging `xgd-working` into the branch, and bumping the version.

Fast-forward landed. Running the ticket overlay check with the CLI verb (per the memory note, the printed script path is missing).

Now updating the ticket body to match what landed (keeping the original sections), and setting story points.

Ticket is `free_coded`. Cleaning up the branch.

Saving one non-obvious fact for future sessions.

BUG-404 is fixed and merged into `xgd-working` (version 0.2.848). The ticket is at `free_coded` with both commits recorded, and the branch is cleaned up. It isn't a duplicate of any existing ticket.

**Why the operator couldn't find filed issues.** The ticket store's normal create, get and list results never include the human id (PLATFORM_ISSUE-n), even though the product's type said they did. So `ReportBug` came back with `id: null` and only the uid, which is all the consultant had to quote. The console's "Issues filed" list read the same missing field, so its rows had no id either.

**What changed:**
- **Filed issues:** the human id is now read from the store's stored record, so `ReportBug` and "add detail" answer with `PLATFORM_ISSUE-n`, and the console lists each issue by it. The stale-preview report (from BUG-400) now gets the human id too.
- **What the consultant tells the operator:** when it can file, its rules now say: in `bc`, give the operator the PLATFORM_ISSUE id, never the uid. The first time in a conversation, also say where it is: **Console → this site → Issues filed**. Those names come from the console's own labels. The ticket said "this business → Issues", but in the console you pick a site, so I matched that. The client still hears only "something on our side isn't working yet".
- **Widths:** the consultant's guidance now says Desktop, Tablet and Phone, taken from the width control's label table. This covers the host's layout-check notes, the layout-fault prompt, the hero-effect checks and the grid and logo-size guidance. No "computer" is left in any of that.
- **Upgrade check:** it now captures at the control's own widths (1280 and 375; Phone was 390), and names a width like `Phone 375px`.

**Two things that took effect immediately, outside the code merge:**
- **DOC-75:** I edited the consultant's tools playbook in the knowledge base directly in the ticket store, so the next production deploy ships it. Its "On a computer: click the +" line is about the client's own device when sending a file, so I left it.
- **Updated tests:** five existing tests pinned the old wording (BUG-241, BUG-304, BUG-305, REQ-648, REQ-484), and I updated them to the new wording.

**Tests:** the two new tests (`test_UAT_FC_BUG-404_*`) pass, along with the related suites. These still fail, and failed the same way on `xgd-working` before my change:
- **REQ-472 motion reference:** knowledge-base search ranking and size.
- **REQ-473 priming vs grant:** the prompt names `LinkedIn` and `definition_of_done`, which aren't in the consultant's grant. The consultant prompt is also over its size budget (201,996 vs 191,200), and my new filing sentence adds about 200 characters to that.
- **Two REQ-484 browser tests:** Chromium can't launch in this sandbox, so the new upgrade-check wording wasn't checked in a real browser.

The original test plan asked for a scripted-model check of the consultant's message after filing. I covered that by checking the rule text the consultant is given, not by running a model; the ticket body says so.

<!-- xgd-chat-end -->