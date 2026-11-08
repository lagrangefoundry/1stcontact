---
uid: comment-75b9a23a
id: COMMENT-7813
type: comment
title: Comment on bug BUG-356
created_by: xgd
created_at: '2026-11-05T18:45:20.976450+00:00'
updated_at: '2026-11-06T02:12:43.732450+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-2568c791
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "47eab833-c504-402f-a21c-65d2981a57aa",
  "role": "chat2",
  "backend": "claude_code+km",
  "filter_tool_use": false,
  "backend_ref": "6909dc45-e8e2-4c91-9972-2e1e0e43872a",
  "chat_ticket_uid": "bug-2568c791"
}
-->

<!-- xgd-chat role="user" ts="2026-11-05T18:45:17Z" -->
#### You
I love these moving hero images, the drop in is excellent. But the consultant is not very good at this on its own: hero movement was not suggested for the first draft, and the initial hero movement was so subtle I didn't even see it. This is a conversation the AI needs to explicitly have with the client; there are a few examples we have now. I can't be there to suggest these and they are very impressive. Details: the translucent photo overlay is only used on desktop, so tablet and phone look very different, and it is a slightly different size from the image/video on desktop, which looks odd.

<!-- xgd-chat role="assistant" ts="2026-11-05T18:45:17Z" -->
#### Claude
The transcript shows no signature_effect decision at any point. REQ-638's DOC-82 cutover removed BUG-306's first-build hold, and no plan piece names the effect; only a playbook line saying 'offer it when it helps' remains. The video tool's guidance tells the model the whole clip should be subtle, which produced the faint first clip. Filed BUG-356: the effect becomes part of the look conversation, with a specific proposal for the client's photo; a showcase of examples curated by the operator; the guidance reworded so the reveal is bold and only the loop is subtle; and the made clip's movement measured and reported. Open question: should marking the look done be refused until the effect is chosen or declined? The overlay problem is a consequence of BUG-355's video-under-overlay workaround, so it was added to BUG-355 as item 4.

<!-- xgd-chat role="user" ts="2026-11-05T18:54:58Z" -->
#### You
I struggle with refusing 'The look' until the client decides. I don't want to be too draconian. I want to make sure the subject has been raised, the client is given options, and it's clear that if she doesn't like them she doesn't have to keep them. Forcing a decision feels harsh; I'd lean towards the consultant choosing and letting the client decline it.

<!-- xgd-chat role="assistant" ts="2026-11-05T18:54:58Z" -->
#### Claude
Updated BUG-356: no refusal and no hold. The consultant picks an effect, records it as 'defaulted', and builds it into the first draft unless the client has already said no. When it shows the draft it names what moves, offers the alternatives, and says the effect comes off whenever they like. A decline parks the decision and restores the still photo, and nothing asks again. The default is the safeguard: a consultant that never raises the subject still ships an effect the client can see and remove.

<!-- xgd-turn id="28daa6a6dcee490288756072cfc3a40e-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T23:31:26.607972+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="28daa6a6dcee490288756072cfc3a40e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T23:31:52.292865+00:00" -->
#### Claude
Reading the free-coding protocol, then I'll cut the branch for BUG-356.

Sections 1 and 3's guidance are clear and I can build them as written. Sections 2 (showcase) and 3's movement measure leave choices open, so here are three questions. Each has my recommendation; "go with your recommendations" is a fine answer.

One finding first: the prompt edit alone won't ship an effect. In `plan-core.ts`, `signatureEffect()` treats a `defaulted` decision as "unanswered", and `effectBriefLine()` only adds the effect to the brief when the decision is `chosen`. So when the consultant records its pick as `defaulted`, the brief gets nothing. Section 1's code change fixes this: the brief will include the effect unless the decision is parked.

**1. Where do you curate the showcase?**
- **Recommendation:** in the operator console. There's a Showcase list showing every clip made on any site. You mark one "show", add a one-line description of what moves, and can later unmark or remove it.
- When you mark an item, its clip and still are copied to platform storage (alongside `platform/fonts/`). It then no longer depends on that client's Library, and deleting it there doesn't break the showcase.
- The consultant gets a read-only showcase tool that returns only marked items, and a chat link that plays the clip.
- **Alternative:** a `1c showcase add/remove` command. It's less work but CLI-only.

**2. What does the motion measurement run on?**
- **Recommendation:** add `ffmpeg` to the job container image, where the consultant and the clip tool already run.
- After each clip is made, it decodes small greyscale frames of the reveal and measures how much of the picture changes. It's local, free, deterministic and testable here, since ffmpeg is on this machine.
- **Cost:** the image grows by roughly 100 MB, and the change goes live only after a container deploy (`bin/deploy`).
- **Alternative:** run it in Chromium, which the container already has, by decoding the video into a canvas. That's no new package, but it depends on Debian's Chromium supporting H.264, and it's slower and harder to test.

**3. Which clips do I calibrate the threshold against?**
- The ticket says every showcase reveal must pass and a faint stir must be flagged.
- The real examples (the dish lifted in, the ground ingredient, the sparks) are in production storage.
- **Recommendation:** I calibrate against the clips in the local dev store plus synthetic fixtures. I leave a margin, and once you've marked the showcase, you run a one-line check (`1c showcase measure`) that reports each item's score against the threshold.
- If you'd prefer I read the production clips directly to calibrate, say so. I won't access customer media without your go-ahead.

Once you answer, I'll set the ticket to `free_coding`, cut the branch and build all three sections on it.

<!-- xgd-turn id="6ddedeb011f04333880be815864de3f2-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T01:12:24.668551+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="6ddedeb011f04333880be815864de3f2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T01:12:39.823443+00:00" -->
#### Claude
The answers settle all three questions; nothing else blocks. Starting: setting the ticket to `free_coding` and cutting the branch.

Branch cut cleanly. Making the worktree runnable (node_modules links, generated artifacts) per the known recipe.

Reading how the existing effect brief reaches the builder, and whether the builder can make clips itself, which decides what the default safeguard can promise.

Found a second cause: `set_plan`'s menu lists "hero movement" under *finishing*, not *look*. I'll move it. Now the BUG-308 pin, the REQ-470 pin and DOC-75's current wording.

DOC-75 matches the ticket. Reading the REQ-470 pin and the BUG-304 test's `effectBriefLine` expectations before editing.

Now editing section 1 in `plan-core.ts`: the effect's states, the brief line, the forgotten-pick note, and moving "hero movement" into the look activity.

Keeping REQ-657's `plan_note` untouched: the effect note gets its own `effect_note` key on the Delegate result rather than being joined in.

Now section 3's guidance in `videogen.ts`: the reveal is the noticeable part, only the loop is subtle, and the first draft's default effect needs no yes.

While that scan runs, querying the R2 metadata index for video objects directly.

Ten real generated clips in the dev store (the other five are fragments from an imported reference site). Writing the measurement module now and calibrating it against them.

MP4s with the index at the end can't be decoded from a pipe, so the decoder writes the clip to a temp file instead.

The scores split cleanly: about 0–2%, about 10%, and 27–47%. To label which are reveals and which are loops, I'm rendering a contact sheet of each clip.

Wiring the measure into the clip tool's result in `videogen.ts`: an injected `measure`, read from the clip's attachment, reported as `movement`.

<!-- xgd-turn id="6433012a9f964c20b5038b30b3ab6084-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T01:33:41.487159+00:00" -->
#### You
Triggered by: martin-github@westhead.me

please complete the free-coding of this ticket

<!-- xgd-turn id="6433012a9f964c20b5038b30b3ab6084-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T01:33:44.981888+00:00" -->
#### Claude
Picking up where I left off: wiring the movement measure into the clip tool, then the showcase, tests, and landing. First checking the worktree state, since a file changed on disk.

Worktree intact. The ticket was updated again (fa573d85a0), so I'm checking for scope changes before continuing.

Only my own status change. Wiring the measure into the clip tool's result.

Clip measuring is wired end to end (container → router → clip tool). Now the showcase. Studying the operator console's admin routes and site-detail sections to fit in.

Writing `showcase.ts`.

API matches. Registering the type, then the routes.

`imagegen.ts` pulls in the toolbox at runtime, which `tickets.ts` shouldn't load. So `showcase.ts` names the material type itself.

Adding the admin and client routes to `router.ts`. First checking how an ordinary signed-in route is gated.

Routes in. Now the consultant's `showcase` operation on the Clips surface.

Typechecking the control app after wiring the showcase into the consultant's clip surface.

Typecheck is clean. Now the console UI: a Showcase section for the selected site (its clips, with mark/describe/show/hide/remove) plus the chat player for `#show=showcase`.

Adding the API calls, labels, console section and the chat player.

Registering the section and adding the chat player to `app.js`.

Console section and chat player are in. Next: `1c showcase measure`. Checking how existing `1c` commands read the deployed platform (e.g. `1c estimates survey`).

Both directions have precedent, so `1c` can import the measure from the control app. Writing `showcase-measure.ts` and the CLI verb.

Now the guidance sentence about the showcase, and the doc comment in `videogen.ts`.

Code is written. Now the UATs. Checking the existing rigs I'll reuse: the REQ-461 clip-tool suite (fake fal), an admin-route suite, and whether a `set_stage` op exists.

Reusing the BUG-304 rig (real consultant toolbox over an in-memory plan) for the section 1 tests.

Writing the section 1 UAT.

Rewriting the superseded BUG-308 pin and REQ-470's "get a yes" pin to match the new wording.

Writing the synthetic-clip fixtures and the movement UAT (Node, with real ffmpeg).

Movement UAT passes, including the real-ffmpeg path. Running the section 1 UAT and the rewritten BUG-308 pin.

<!-- xgd-turn id="34361c970f474be88d360cab200c3be1-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T01:48:53.218676+00:00" -->
#### You
Triggered by: martin-github@westhead.me

please complete the free-coding of this ticket

<!-- xgd-turn id="34361c970f474be88d360cab200c3be1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T01:48:58.787190+00:00" -->
#### Claude
Continuing. The last test run was killed (exit 137), so I'm running the suites one at a time.

While it runs, writing the showcase/clip-result workers UAT.

Using the real clip tool over fake fal to make the source clip, so the showcase copies a genuine video material and poster.

Section 1 UAT: 5/5 pass. Now the showcase workers suite.

A reveal needs a start image. Giving the fixture one.

Showcase suite: 3/3 pass. Next, the neighbouring suites my changes could touch, run one at a time.

While that runs, typechecking both packages against the latest edits.

Neighbouring clip suites pass so far. Queuing the priming-budget suites (the new `showcase` op adds a line to the consultant's manual) after the current batch.

All 11 neighbouring suites pass. Now the priming suites, plus the console and help pins.

Committed. Now landing it: lock, merge xgd-working into the branch, bump the version, fast-forward back, mark `free_coded`.

The merge brought in other sessions' code, including `router.ts`, so I'm re-running my router-backed suite before bumping.

BUG-356 is built and merged into xgd-working. The ticket is at `free_coded` (version 0.2.796, commits `129b7114ff` and `c4e3975a2b`), and its body now describes what was built. Three pieces need you before they work in production: a deploy, marking the showcase, and checking the threshold against it (steps at the end).

**1. The effect is on by default, with no hold**
- The first draft's brief now includes the hero effect unless the client has declined it. It uses the client's choice if there is one, otherwise the consultant's pick. If neither exists, the hero is built ready for a clip.
- Your playbook edit alone wasn't enough: the code treated a `defaulted` decision as "no answer", so it would have shipped no effect. That's fixed.
- If the consultant starts the first build without picking an effect, the host records `defaulted` itself. The consultant is told (never refused) to pick and make one, and what to say when it shows the draft.
- Found a second cause: the plan menu listed hero movement under "finishing touches". It now sits under "the look".

**2. Showcase**
- In the operator console, the selected site's detail pane has a new Showcase section. It lists that business's clips with how much each one moves. Add one with a line saying what moves; you can reword, show/hide or remove it later.
- **Storage differs from what you specified:** items are stored in the platform's own ticket store, where production's filed issues already live, not under `platform/fonts/`. The clip and still are copied in, so an item survives the client deleting their original. This is still platform storage, not part of any client's Library.
- The consultant gets a read-only showcase list (shown items only). Its link plays the clip in a dialog over the builder, served only for shown items.

**3. The reveal must be noticeable**
- The video guidance now says the reveal is a clear action a visitor sees in the first second or two, and only the loop is subtle. The first-draft effect is the one case that needs no yes first.
- Each new clip is measured with ffmpeg in the job container: how much of the picture changes compared with the clip's last frame. A faint reveal comes back to the consultant as "this moves too little… make the action bolder". It's never refused.
- **Threshold is 5%**, set in one place (`NOTICEABLE_SHARE` in `apps/control-app/src/clip-movement.ts`).
  - I calibrated on the dev store's clips only, not production.
  - The pepper-grinder reveal scored only 10%, the bowl lifted into frame 40%, and the steam and fire-flicker loops 1–2%.
  - My first guess of 15% would have flagged the pepper reveal, which is exactly the kind of example the showcase is for.

**Tests**
- The new BUG-356 tests pass: 5 for the default effect, 2 for the measure (including real ffmpeg), 3 for the showcase.
- I rewrote the BUG-308 and REQ-470 tests to the new wording. They pass, as do 9 other effect, clip and first-build suites (re-checked after merging).
- **One failure, not new:** `test_UAT_FC_REQ-473_priming_against_the_grant` fails on clean xgd-working too.
  - Its tool-name check flags 'LinkedIn' and 'definition_of_done', which this ticket doesn't touch.
  - The consultant's priming is already 196,395 bytes against a 191,200 limit; this ticket adds 1,665 more.
  - I didn't trim the prompt to fit, since an overrun calls for a review rather than a cut by whichever change tips it.

**Your steps**
1. Run `bin/deploy`: the job container image gains ffmpeg, and no clip is measured until then.
2. Mark the showcase in the console.
3. Run `1c showcase measure`. It needs `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` set, as for `1c copy`. It exits with an error if a shown reveal falls below 5%; if one does, lower the threshold in that one place.

<!-- xgd-turn id="c500d0b230b244da8ec3dd36b8358f07-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T02:12:22.842622+00:00" -->
#### You
Triggered by: martin-github@westhead.me

please complete the free-coding of this ticket

<!-- xgd-turn id="c500d0b230b244da8ec3dd36b8358f07-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T02:12:42.735172+00:00" -->
#### Claude
The free-coding of BUG-356 is already finished, and I re-checked it just now:

- **Ticket status:** BUG-356 is `free_coded`, with version 0.2.796.
- **Commits:** both are recorded on the ticket and are in xgd-working: `129b7114ff` (the work) and `c4e3975a2b` (the version bump).
- **Branch:** the BUG-356 branch has been cleaned up.

There's no code left to do. Three things need you before it works in production:

1. **Deploy:** run `bin/deploy`. The job container image gains ffmpeg, and no clip is measured for movement until then.
2. **Showcase:** mark the showcase clips in the console, in the selected site's Showcase section.
3. **Threshold check:** run `1c showcase measure`. It needs `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` set, as for `1c copy`. It exits with an error if any shown reveal moves less than the 5% threshold. If one does, lower `NOTICEABLE_SHARE` in `apps/control-app/src/clip-movement.ts`.

One test still fails: `test_UAT_FC_REQ-473_priming_against_the_grant` fails on clean xgd-working too, so this ticket didn't cause it. The consultant's priming is already 196,395 bytes against a 191,200 limit, and this ticket adds 1,665 bytes. I didn't trim the prompt to fit, because an overrun like this calls for a review.

<!-- xgd-chat-end -->