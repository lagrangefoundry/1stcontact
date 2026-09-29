---
uid: comment-daafdee7
id: COMMENT-4284
type: comment
title: Comment on bug BUG-162
created_by: xgd
created_at: '2026-09-29T02:50:47.082845+00:00'
updated_at: '2026-09-29T02:57:41.391989+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-057e496a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "895ee6a2-3ad0-4c05-8537-9a7d0deeb8dd",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="cf01b8fa-89cf-401c-934f-9cbf0d2a651b-user" -->

<!-- xgd-chat role="user" ts="2026-09-29T02:49:30.053909+00:00" -->
#### You
bin/build gave me this:

```
((.venv-working) ) martin@nyx 1stcontact % bin/build 

==> Preflight
ok    shared/browser  webui-shell
ok    shared/browser  webui-split
ok    shared/browser  webui-fields
ok    shared/browser  webui-chat
ok    shared/browser  webui-markdown
ok    shared/browser  webui-list-detail
ok    shared/browser  webui-scroll
ok    shared/server  ai
ok    shared/server  ai-knowledge
ok    shared/server  auth-passwordless
ok    shared/server  knowledge
ok    shared/server  ticketing
ok    npm            playwright

Preflight passed: 12 shared components, 1 declared packages.
Index seam: the installed knowledge component takes `indexes`.

==> Knowledge base
kb: the index covers all 13 corpus document(s) and 3 projection(s) match their source — nothing to build.

==> Control-app assets
modules    4 css, 4 client.js → packages/framework/src/modules/module-assets.ts
builder    51 files
webui      61 files, 7 import-map entries, 6 stylesheets
framework  edit-client.js, site-schema-edit.js, site-schema-shade.js, page-state.js, marked-points.js, site-schema-anchors.js, measure-svg.js, packages/site-schema/src/l1/text.js, packages/framework/src/l1/dialog.js
graph      96 modules, 6 stylesheets — every import resolves
ai         /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai/src/workers.js
ticketing  /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ticketing/src/index.js
knowledge  /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/knowledge/src/index.js
bridge     /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai-knowledge/src/index.js
auth       /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/auth-passwordless/src/index.js
imagegen   /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai-imagegen/src/index.js
tickets    /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/ai-ticketing/src/index.js
logging    /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/logging/src/index.js
kb         13 document(s), 1669KB inlined, awareness primed not indexed
out        /Users/martin/lagrangefoundry/1stcontact/apps/control-app/dist-assets

==> Typecheck and package builds
Scope: 8 of 9 workspace projects
Scope: all 9 workspace projects
✓ Lockfile passes supply-chain policies (verified 4d ago)
Lockfile is up to date, resolution step is skipped
Already up to date
Scope: 8 of 9 workspace projects
packages/builder-ui build$ echo placeholder build: builder-ui
│ placeholder build: builder-ui
└─ Done in 14ms
apps/public-site build$ tsc --noEmit
└─ Done in 1.5s
packages/ui-kit build$ echo placeholder build: ui-kit
│ placeholder build: ui-kit
└─ Done in 14ms
apps/control-app build$ tsc --noEmit
│ ../../tools/generate/src/render/render.ts(226,60): error TS2345: Argument of type '{ fatal: true; }' is not assignable to parameter of type 'TextDecoderConstructorOptions'.
│   Property 'ignoreBOM' is missing in type '{ fatal: true; }' but required in type 'TextDecoderConstructorOptions'.
└─ Failed in 3.5s at /Users/martin/lagrangefoundry/1stcontact/apps/control-app
/Users/martin/lagrangefoundry/1stcontact/apps/control-app:
[ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL] @1stcontact/control-app@0.0.0 build: `tsc --noEmit`
Exit status 2
((.venv-working) ) martin@nyx 1stcontact %

```

<!-- xgd-turn id="cf01b8fa-89cf-401c-934f-9cbf0d2a651b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-29T02:57:41.045506+00:00" -->
#### Claude
Now the ticket, then the fix.

Now the guard UAT. Let me see how source trees are enumerated in an existing guard for the house style.

Now write the guard UAT.

The guard would have caught the original line. Now the real regression scope — the build.

Green. Bumping version and committing.

Fixed — `bin/build` runs clean through to `Build complete. 2 app(s).`

**What was wrong**: `pageDrawings()` in `tools/generate/src/render/render.ts:226` (added by `5ea0b90de5`, the timed-motion commit) wrote `new TextDecoder('utf-8', { fatal: true })`. That's legal in `tools/generate`'s own program, whose `lib` includes `DOM` — `lib.dom`'s `TextDecoderOptions` has both fields optional. It is not legal in `apps/control-app`'s program, which sets `types: ["@cloudflare/workers-types"]` and no `DOM` lib, so the only `TextDecoder` in scope is the Workers one, and its `TextDecoderConstructorOptions` declares **both** `fatal` and `ignoreBOM` required.

The Worker's `include` is only its own `src/**`, but its source imports the render engine, so that module gets pulled into the stricter program and checked there. One line, whole recursive build red.

**Fix**: spell both fields out, matching the existing pattern in `apps/control-app/src/mime.ts`. `{ fatal: true, ignoreBOM: false }` is the same decoder — `ignoreBOM: false` is the WHATWG default, so no runtime behaviour change.

**Evidence** (`tests/test_UAT_FC_BUG-162_textdecoder_options_shape.test.ts`): a source scan over tracked first-party `apps`/`packages`/`tools`/`tests`, asserting every `new TextDecoder(label, { … })` that supplies an options object names both fields. Repo-wide rather than scoped to what the Worker reaches today, since reachability changes with the next import and a guard tracking it would go quiet exactly when it mattered. A second UAT pins the scan against itself — it must see the `render.ts` and `mime.ts` constructions, so a regex that stopped matching can't report a clean tree. I verified the regex flags the pre-fix line.

Ran: the two new UATs plus `test_UAT_FC_REQ-335_animated_illustration.test.ts` (the 41 UATs from the commit that introduced the line) — 43 passed; and full `bin/build` green.

BUG-162 is at `free_coded`, `fields.commits=[b3d1ccad49]`, version `0.2.402`, body populated with symptom/root cause/fix/test plan. Session lock released.

<!-- xgd-chat-end -->