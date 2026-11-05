---
uid: comment-082f0837
id: COMMENT-5834
type: comment
title: Comment on request REQ-487
created_by: xgd
created_at: '2026-10-29T21:15:11.467849+00:00'
updated_at: '2026-10-29T21:43:55.206256+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ad980a0a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d08c0284-1614-4039-85cc-b4238c00705f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-29T21:14:54Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-29T21:14:54Z" -->
#### You
The initial user prompt should encourage the user to choose a business/project name. I assume the consultant can change that name? And I think we support changing it in settings so this is probably just text to add to that initial chat session.

<!-- xgd-chat role="assistant" ts="2026-10-29T21:14:54Z" -->
#### Claude
Settings and the Settings assistant can rename (rename_business), but the Site consultant has no rename tool; the settings surface is kept out of site sessions. Proposed: opening asks while the business is Unnamed; grant the Site consultant the rename alone, same code path; do not ask when already named.

<!-- xgd-chat role="user" ts="2026-10-29T21:14:54Z" -->
#### You
yes please

<!-- xgd-turn id="3211653c-1c17-422e-8b8e-ebf7fabb598c-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T21:24:33.339818+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="3211653c-1c17-422e-8b8e-ebf7fabb598c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T21:43:51.210891+00:00" -->
#### Claude
Reading the settings surface and how site sessions get their tool grants.

Checking where the client-name line is rendered (priming vs per-turn reminder) to pick the cheapest place for the one-line instruction.

Worktree has no `node_modules`; looking up the framework's manual projection in the main checkout meanwhile.

Still checking whether granting one settings group pulls the settings surface's long overview into the consultant's priming (budget risk).

Writing the code now — starting with the narrowed rename surface in `settings-core.ts`.

Now editing `settings-core.ts`.

Now wiring it into the Site consultant's toolbox in `host-core.ts`.

Now the opening text: seed lines plus a function choosing between them.

Now the one-line instruction: folded into the existing `client.name` reminder, rendered only while the business is unnamed.

Typecheck clean. Now the UATs — reading REQ-403's workers test helpers to reuse its harness.

Writing the UAT suite.

3/3 pass. Now the regression scope: priming budget (BUG-129), reminder tail (REQ-171), opening (REQ-403/481), settings (REQ-237/239), client name (REQ-476).

All green. Checking for suites that scan `priming.json` templates, `plan-seed.json`, or `clientNameLine`.

No output — the zsh variable didn't split (known pitfall). Rerunning with `xargs`.

REQ-115 failures look like the known worktree location artifact; REQ-342 and REQ-466 are probably mine. Reading those errors.

Need a baseline: running the same two suites on clean xgd-working in the main checkout.

Updating the ticket body first so it matches what was built, then committing.

Committed. Now the merge-back sequence: lock → merge xgd-working into the branch → bump → commit → xgd-merge → move-to-free-coded.

REQ-487 is built, merged into xgd-working and parked at `free_coded`. The commits are `78781ad4` (the change) and `91515290` (version 0.2.707). The three new UATs pass. It isn't deployed, so dev won't show it until the next `bin/deploy --env dev`.

**What changed**
- **Opening:** while the business is still `Unnamed business` (or a numbered variant like `Unnamed business-2`), the last line of the opening becomes *"So, to start: what's your business — or your project — called, and what do you do? And who are your customers?"* Once it has a real name, it says *"tell me about Cole's Bakery…"* and never asks for the name. The rest of the opening is unchanged. Both versions of that line are in `plan-seed.json`.
- **Site consultant can rename:** it now has `rename_business` and nothing else from the settings surface. It goes through exactly the same code as the Settings tab and the Settings assistant. It gets a trimmed copy of the settings definition that leaves out the long text about free web addresses. Granting the full surface would have added about 5k characters to a priming budget that's already at its 100k cap, and the trimmed version still passes that check (BUG-129).
- **The one-line instruction:** it's added to the existing per-turn reminder about the client's name. It appears only while the business is still unnamed, and says the name is the first thing to record.

**Where I differed from the ticket**
- **No `unnamedbusiness` address:** the ticket's example offers to fix one, but none ever exists. `hostname.ts` never assigns an address from the placeholder; the client always chooses it. So the consultant only offers to fix what a rename actually leaves out of date: the site's title and pages whose wording still uses the old name. The ticket body now says this.
- **Rename check:** the ticket said "the business list shows the new name". The test instead reads the business record with the function `/api/business/name` uses.

**Tests**
- I updated REQ-403's opening test. Its test business is named `req403`, so the opening now correctly says "tell me about req403".
- **Already failing:** REQ-342, REQ-466, REQ-398 and REQ-115 fail with or without this change; I checked them on clean xgd-working.
- **One thing worse:** REQ-466's consultant prompt budget was already over (209,678 against a 205,000 target). The rename tool's description adds about 1.8k (to 211,525). I kept that description identical to the Settings assistant's rather than writing a shorter second copy. If you want that test green, it needs a trimming pass, which is separate from this change.

<!-- xgd-chat-end -->