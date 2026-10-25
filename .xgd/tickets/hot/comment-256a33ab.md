---
uid: comment-256a33ab
id: COMMENT-5519
type: comment
title: Comment on request REQ-412
created_by: xgd
created_at: '2026-10-19T20:28:08.457818+00:00'
updated_at: '2026-10-19T20:47:30.259413+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-175092b8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c5731a8d-a627-455f-b615-408546a00f7a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d3b21b71-8ce7-4885-a38a-b58423481bb3-user" -->

<!-- xgd-chat role="user" ts="2026-10-19T20:27:30.873808+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d3b21b71-8ce7-4885-a38a-b58423481bb3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-19T20:47:29.627418+00:00" -->
#### Claude
Scope is clear. Let me study bin/deploy and the fonts tooling.

I'm reading the existing font delivery code (`1c fonts publish`/`seed`) so the deploy change can reuse it.

Still surveying: looking at how existing UATs drive `bin/deploy` so the new tests follow the same harness.

Design is settled. Now I'll mark the ticket `free_coding`, cut the branch, and update the body with the decisions.

Now writing the code. First the shared record module.

Now publish.ts: extract the cloud bucket access so the deploy check reads the record through the same code, and write the record after a full publish.

Now seed.ts — same treatment for the local stores.

Now the orchestrator, in the operator-facing command layer beside `cmdFontsPublish`/`cmdFontsSeed`.

Now the CLI verb `1c fonts deploy`.

Now `bin/deploy`: the `--no-fonts` flag, the font step before the app loop, and the docs.

Now typecheck.

Clean on the touched files (the remaining errors are the worktree's missing generated files). Now the UATs.

All nine decision UATs pass. Now the `bin/deploy` wiring UATs (slower — they run the real script).

The help text wraps mid-phrase; tightening the assertion to an unwrapped phrase.

2.4 s against the real 7,132-object manifest, including CLI boot. Now the regression scope: the neighbouring font and deploy suites.

I'll give the REQ-264 fixture a `bin/1c` stub beside its `npx` stub, since the driver now calls `1c` as a collaborator. Then I'll implement the local "nothing staged" outcome.

Adding a UAT for the new local "nothing staged" outcome.

Ignored (the directory pattern only matches with a trailing path). Copying and re-running.

REQ-318 is fully green. Running BUG-203, which also exercises the production dry-run path where the cloud record can't be read from the sandbox.

Committing on the branch first, then updating the ticket body before the merge-back.

Now the ticket body: preserving the existing text and adding what was built, the design decisions, and the UAT mapping.

Body updated. Now lock, merge back into xgd-working, and rematerialize.

Merged. Now the gate to `free_coded`, letting it bump the version itself.

REQ-412 is built and merged into xgd-working. The ticket is at `free_coded` with two commits: `e4d251b9` for the code and `c98639bc` for the gate's version bump to 0.2.543. Nothing has been promoted. The 14 new UATs pass, and so do the neighbouring font and deploy suites: REQ-315, REQ-312, REQ-144, REQ-318, REQ-264, REQ-259, REQ-149 and BUG-203.

**What `bin/deploy` does now**
- Once per deploy, after the workerd guard and before the first app, it runs a new `==> platform fonts` step (`1c fonts deploy`).
- That step compares `fonts/platform.json` with a record that the target bucket or dev store keeps of its last full font delivery. The record lives beside the fonts at `platform/fonts-deployed.json`, outside the served prefix.
- If they match, it prints one line, `platform fonts: unchanged`. On the real 7,132-object manifest that check took 2.4 s, including CLI start-up.
- If they differ, or there is no record, it runs the existing `1c fonts publish` or `seed` unchanged. Publish and seed now write the record once every object has landed, so `bin/deploy --fonts` also counts for the next code deploy.
- The decision is printed in the deploy output and added as a row to the capability report.
- `--dry-run` reports the decision and how many objects would move, and writes nothing.
- `--no-fonts` still checks but never delivers, and warns when the fonts are stale. `--fonts --no-fonts` together is refused.
- The header comment and `--help` now describe this behaviour, replacing REQ-315's "name what you want moved" reasoning.

**Decisions I made that you may want to check**
- **The check reads no font files.** The record is built from the manifest alone. Fonts use the manifest's sha256; licence notices and `LICENSES.txt` use a digest of what determines their content. So a machine without the 1.35 GB mirror staged can still deploy code to a target that is already current.
- **An incomplete mirror only blocks when something would actually be sent.** A real deploy stops before any app ships and names `1c fonts mirror`. A dry run reports "a real deploy would stop here" and carries on.
- **One exception: a local target with nothing staged at all**, such as a fresh checkout or branch worktree, deploys with a warning that dev will serve no platform fonts. Without this, the existing REQ-318 tests that do real local deploys in worktrees would fail. The cloud target gets no exception.
- **A real deploy that can't read the cloud record fails**, for example with no `CLOUDFLARE_API_TOKEN`, and the error suggests `--no-fonts`. A dry run reports `unknown` instead.
- **I changed another ticket's test.** REQ-264's test builds a throwaway repo around `bin/deploy`, and it now needs a `bin/1c` stub next to its `npx` stub, because `bin/deploy` now calls `1c`.

**Expect a full font delivery on the first deploy of each environment**, because no destination holds a record yet:
- **Dev:** this is the BUG-227 reseed you need anyway.
- **Production:** a dry run reached the real bucket and confirmed it has no record, so the next `bin/deploy` will publish before the apps. It checks every object first and only sends what differs, but it will take a while.

The ticket body now describes what was built and lists each UAT against the requirement it covers.

<!-- xgd-chat-end -->