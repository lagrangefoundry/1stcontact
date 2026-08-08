---
uid: comment-bc71b831
id: COMMENT-767
type: comment
title: Comment on bug BUG-32
created_by: xgd
created_at: '2026-08-07T16:46:30.716848+00:00'
updated_at: '2026-08-08T00:37:30.724202+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5cabb340
  kind: chat_transcript
---

<!-- xgd-turn id="c3f40251-e39c-4a81-adb4-a10001c56fbd-user" -->

<!-- xgd-chat role="user" ts="2026-08-07T16:46:26.890732+00:00" -->
#### You
the base packages have now changed - please update the branding here

<!-- xgd-turn id="c3f40251-e39c-4a81-adb4-a10001c56fbd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-07T16:52:44.613632+00:00" -->
#### Claude
Now `builder.ts` — route both import-map keys through `WEBUI_SCOPE`:

Now the tests:

Now the new UAT suite:

Now sync the ticket body to what actually landed (preserving the existing content):

Rebrand landed. BUG-32 is at `free_coded`, commit `e77b933`, version `0.1.25`.

**What I checked first:** the shared artifact store at `../node_modules/` now has `@lagrangefoundry/*` (repopulated today) alongside the stale `@gendevlabs/*` — so sequencing steps 1–2 were genuinely done before I touched anything.

**What changed**
- `WEBUI_SCOPE = '@lagrangefoundry'` in `tools/generate/src/cli/webui.ts:33` — now the single definition.
- `chromeHtml()` in `builder.ts` had the scope hardcoded twice; both routed through `WEBUI_SCOPE`.
- **`apps/control-app/src/builder/app.js` / `editor.js`** — not in the ticket's surface list, but they import the components by bare specifier. A specifier the import map doesn't key throws in the browser and nowhere else, so this was the one surface that would have failed silently even after everything else was renamed.
- `index.html` (tracked chrome artifact), plus the assertions and docstrings in the six webui test files.

**Evidence** — `tests/bug32-webui-scope-rebrand.test.ts`, four UATs, all positive and unconditional so a broken scope fails instead of skipping green: components resolve *and* their own `package.json` `name` is under the new scope (a stale same-named old-scope package can't satisfy it); every import-map key is under `WEBUI_SCOPE`; every browser bare specifier has a matching map key; and no source outside `webui.ts` writes the scope. 4/4 pass, plus 35/35 on the adjacent suites.

**One thing to flag:** the req115/builder suites now genuinely run, and six tests fail — 5 in `reconciliation-copy-edit-gesture-modal`, 1 in `req115-builder-composition` (`open_in_new_tab_matches_the_iframe_exactly`). I stashed my change and re-ran against the old scope: identical six failures. They're pre-existing and unrelated, so I left them alone rather than widening this ticket. Worth a separate ticket if you want them chased.

<!-- xgd-turn id="860ddd31-5a43-4622-814e-d18819525f21-user" -->

<!-- xgd-chat role="user" ts="2026-08-08T00:37:30.361483+00:00" -->
#### You
why is this ticket in ready_to_implement? I think you mean that its free coded and I will move to ready to reconcile - ready to implement triggers automated construction

<!-- xgd-chat-end -->