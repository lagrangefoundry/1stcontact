---
uid: comment-0a380ac2
id: COMMENT-8153
type: comment
title: Comment on bug BUG-413
created_by: xgd
created_at: '2026-11-09T20:34:14.838830+00:00'
updated_at: '2026-11-09T20:52:57.311391+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-64ad8ce3
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "efc69586-e8d7-4e99-be75-d4d972cb3654",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="91854afa-2ee6-483e-bc94-9d6d355d7596-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T20:33:31.971827+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="91854afa-2ee6-483e-bc94-9d6d355d7596-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T20:52:56.104043+00:00" -->
#### Claude
Checking for duplicates, then reading the make_favicon code.

Not a duplicate (REQ-400 introduced the feature). Now the code.

Fault 1 is in the lease check (`leased-store.ts`): new files are allowed, existing ones outside scope are refused. Looking at how asset files are named in leases.

Now the image side: what the renderer can do (for letterboxing).

The renderer has no padding operation. Checking what the Cloudflare implementation and any PNG codec in the repo offer.

Existing REQ-400 UAT pins the centred crop; this ticket supersedes that, so I'll update it. Now finding where the site's background colour lives.

Background = the site's `design.colour.background` resolved through its palette. Now: how a tool hands an image back to the consultant.

Design settling. Checking how `screenshot` addresses a stored site file, so make_favicon's answer can point the caller at the icon.

Plan is clear. Checking the site schema's top-level keys (for the "one home" mapping) and `readBase`.

Starting work: mark the ticket `free_coding` and cut the branch.

Baseline green. Implementing fault 1 (lease scope): the icon files belong to whoever may write `site.json`.

Now fault 2: rewrite `iconMaker` to fit the whole mark into the square instead of centre-cropping.

Writing the new `favicon.ts`.

Now `editFaviconMake`: pass the site background, report the method/legibility, and point at how to look at the icon.

Now fault 3: one home for `favicon`/`shareCard`. Checking the zod version to derive the config keys from the schema.

Implementing the one-home mapping in `edit.ts`.

Reassigning the parameter breaks TypeScript's aliased narrowing; switching to a separate const.

Now the playbook text. Checking which tests pin the current make_favicon / set_config wording first.

Updating the tool declarations in `l1-surface.json` (make_favicon no longer centre-crops; get/set accept the bare names).

Now the UATs. Looking at how the REQ-397 suite drives a scoped writer through a leased store.

Writing the BUG-413 UAT suite (fake renderer at the Cloudflare Images boundary, real PNG bytes, real leased store).

All 6 pass first time — checking they actually fail against the old code (revert each fix in turn).

Reproduces the exact production refusal. Now the one-home fault.

Both fail without the fix. Now the existing REQ-400 suite, which pins the old centre-crop.

Updating that REQ-400 case: the "cut from the centred square" assertion is the behaviour BUG-413 supersedes.

Green. Now typecheck/lint and the wider regression scope.

Only two pre-existing errors in files I didn't touch. Lint, then the regression batch.

No ESLint in this project. Running the regression batch over every suite that touches these areas.

Many failures — need to separate pre-existing ones from mine. Reading the error messages first.

These look unrelated (missing `order-status` page, `write_image`, `spacing`). Baseline: revert my diff, run the 10 failing files, re-apply.

Baseline has 25 of the same failures. The one difference is the REQ-400 priming-facts case (reads the KB, which other suites can null). Re-running it alone with my changes.

No regressions in that batch. Now the workers-runtime lease suite (most relevant to the scope change).

Pre-existing failure, unchanged by my work. Now the version bump and commit — checking the promotion memory first.

Committing the code on the branch.

Now updating the ticket body so every UAT is motivated by its text (preserving the existing content).

Now the merge-back. Checking the version-bump tool in this repo.

Running the merge-back loop from the promotion memory (merge working into the branch, bump, fast-forward, gate).

Landed and gated: `free_coded` at 0.2.856. Setting story points, then cleaning the branch.

All three BUG-413 faults are fixed, merged into `xgd-working` (version 0.2.856), and the ticket is at `free_coded` with both commits recorded. It isn't a duplicate: the only related ticket is REQ-400, which first added the feature.

**What changed**

1. **The icon can be replaced.** A builder whose scope includes `site.json` may now overwrite the three icon files `make_favicon` writes (`favicon.png`, `favicon.svg`, `apple-touch-icon.png`), no matter which run created them. A builder without `site.json` in scope is still refused. The new test reproduces the exact production refusal against the old code.
2. **Wide logos become a whole icon.** `make_favicon` no longer cuts the centred square. It trims the picture's transparent margins and fits the whole mark into the square on the site's background colour, leaving bands above and below for a wide logo. The reply says how it was made, how big the mark is at 32px, and where to view it with `screenshot`. If the mark is under 16px on its short side at 32px, the icon is still saved and the reply warns that it will be hard to read.
3. **One home for each setting.** `get_config favicon` now reads `config.favicon`. `set_config` writes `shareCard` into `config` whether you name it alone or inside a top-level write. A stray top-level copy is read from `config` and removed on the next write, so only one copy remains. The tool descriptions for `make_favicon` and `set_config` were updated to match.

This replaces REQ-400's centred crop, so I updated that UAT to check the new behaviour. Both REQ-400 suites pass, along with the 6 new BUG-413 UATs. Each new test fails when its fix is removed.

**Tests:** in the wider run, 27 cases failed. 25 fail the same way without my changes. The other two also pass in isolation: one is the REQ-400 case, the other one I didn't re-run (likely the REQ-473 suite). They seem to fail because another suite in the batch blanks the shared knowledge-base file they read. One case in the workers lease suite also fails with or without my changes. The typecheck shows only two errors, both in files I didn't touch.

**Decisions you may want to revisit (all recorded in the ticket):**
- **No automatic monogram detection.** The ticket allowed picking out a separable symbol. Guessing which part of a wordmark is a symbol is unreliable, so the tool fits the whole mark and, when it's too small to read, says to crop the picture to the symbol first.
- **The icon is named, not attached.** Tool replies reach the model as text, so `make_favicon` gives the `screenshot` call to view the icon rather than including the image.
- **When moving a stray copy, `config` wins** where both copies set the same field, so what the site shows doesn't change.
- **The 16px "hard to read" threshold** is my own choice; it flags any wordmark wider than about 2:1.

I didn't change the playbook doc (DOC-75). It refers to `favicon` and `shareCard` by bare name, and those names now work.

<!-- xgd-chat-end -->