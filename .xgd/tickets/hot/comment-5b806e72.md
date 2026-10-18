---
uid: comment-5b806e72
id: COMMENT-5493
type: comment
title: Comment on bug BUG-227
created_by: xgd
created_at: '2026-10-18T22:08:58.454924+00:00'
updated_at: '2026-10-18T22:24:30.134041+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d889d831
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "dff453d4-1daf-455f-b481-591e601c8f89",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="33f0f166-d9c4-43a6-80de-2c2445e079ea-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T22:07:36.409680+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="33f0f166-d9c4-43a6-80de-2c2445e079ea-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T22:24:29.165126+00:00" -->
#### Claude
I'm tracing where `/_fonts/...` gets served. Next I'll check the ticket's linked chat for which site and environment hit the bug.

The renderer emits `@font-face` correctly. Now I'm checking what "page style" `resources.fonts` is, and whether it reaches `doc.resources`.

A local dev server is running on 8789. I'm going to request a font path through it.

Both the screenshot and the client's browser load fonts through the same preview route. I'm checking whether the dev R2 store actually holds the font objects.

The fonts are in the store, so serving isn't the gap. Next I'm reading the actual draft pages to see what they declare.

The drafts live in D1. I'm copying the database to a temp dir so I can read it, including recent writes in the WAL.

The stored data is right: the look declares Bebas Neue under `resources.fonts`. So the break must be in rendering or serving. I'm going to render the page offline.

Rendering and font-family code both look correct, so I need to render the real page. I'm looking for how the preview renderer composes a page, so I can drive it offline against the stored rows.

Rather than keep reading code, I'll render the stored "Bold & alive" look through the real `assembleSite` + `renderSiteFiles` path and inspect the HTML it emits.

Home needs to be included; I'll add it (sections omitted, which is fine for the looks).

Bebas Neue is served with 200. I'm counting requests per font file and status, and checking what bytes come back.

Fonts reach the browser with 200, so the next suspects are how the iframe loads them (sandboxing / CORS) or the bytes themselves. Checking both.

No sandbox or CSP in play. Now checking that the stored font bytes are a valid woff2 matching the mirror.

Branch cut. Reading the rest of the woff2 module and the existing tests before editing.

Now the encoder/decoder edits.

Now the mirror's carry check.

Now the screenshot origin resolver.

Now wiring the reader through `shot.ts` and the router.

Typechecking next.

Tidying the test helpers before running.

My 3 UATs pass. The REQ-312 suite fails only because the fresh worktree lacks control-app's generated files (a known artifact). Checking how to generate them.

All green. Checking the screenshot UAT actually catches the bug by temporarily disabling the new `_fonts` branch in the resolver.

The screenshot UAT fails with the old behaviour (404) and passes with the fix. Same check for the encoder tests: removing the padding.

Both falsification checks pass, and the files are restored. Running the wider font regression scope.

That list is too broad (the `shot'` pattern matched a lot). Narrowing to the font and fidelity suites.

Only 4 files ran: zsh passed `$F` as a single argument (a known pitfall). Rerunning via xargs.

235/235 across 21 suites. Now the version bump and commit. First, a check of how this repo bumps its version.

Plan from those notes: commit without a manual bump, merge back, then run `move-to-free-coded` with no `--version` so the gate bumps the version itself. Committing.

Committed. Locking and merging back into xgd-working.

Merged, with no ticket overlay changes needed. Before promotion I'm making the ticket's test plan name the actual UATs.

Ticket is at `free_coded` (version 0.2.539, 2 commits). Cleaning up the branch.

BUG-227 is fixed in code and parked at `free_coded`, but the fonts you've already staged and published are still broken. You need to regenerate them (commands below).

**Root cause: the font files themselves were bad.** The page data and the `@font-face` rules were fine, and the preview served the fonts with a 200. But our mirror's WOFF2 encoder (`tools/generate/src/fonts/woff2.ts`) left the end of each file unpadded. Chrome's font decoder rejects that silently and paints a fallback, and Firefox uses the same decoder. I loaded the three fonts in real Chromium: the stored files failed with "Invalid font data", and the same bytes padded by one to three zeros loaded fine. 2680 of the 3566 mirrored files (about ¾) are affected, which is why some fonts happened to work and these didn't.

**A second bug only affected screenshots.** The screenshot tool's browser is served in-process, and that path never answered `_fonts/…` requests, so every platform font 404'd in pictures. It now reads the same font source as the `/preview` route.

**What changed:**
- The encoder pads its output.
- The decoder rejects unpadded files the way a browser does, so the mirror's own round-trip check catches this from now on.
- A re-run of the mirror re-encodes any already-staged broken file. Before, it kept them because their checksums still matched.
- Screenshots get the same font source as the preview.

**Tests:** four new UATs. Each fails with its fix removed and passes with it. 21 related suites (235 tests) pass.

**Commits:** `444226ac7d` (the fix) plus the auto version bump to 0.2.539, merged into xgd-working. Story points 3. The ticket body records the root cause, the fix, the test plan and the follow-up.

**What you need to run** (I haven't run any of these):
1. `bin/1c fonts mirror --repo <google/fonts checkout>`. This re-encodes only the broken files. At the default quality it is slow; I don't know how long for just these files, since 75–90 minutes is the figure for the whole corpus. `--quality 9` is about 20× faster but gives slightly bigger files.
2. `bin/deploy --fonts --env dev` to update local dev's font store.
3. `bin/deploy --fonts --env production` to publish.

Screenshots also need the code itself deployed (`bin/deploy --env dev`, then the usual production deploy).

**Not done:** the ticket's "`describe_page` should flag a font that failed to load". `describe_page` never renders the page, so it can't see a load failure. That failure only happens when a browser decodes the bytes. Since the decoder now rejects bad files when the mirror runs, I left it out and wrote down why in the ticket. The worker that wrongly reported the fonts as working is still BUG-225's to fix.

<!-- xgd-chat-end -->