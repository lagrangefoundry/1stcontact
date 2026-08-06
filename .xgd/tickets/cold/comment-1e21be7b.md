---
uid: comment-1e21be7b
id: COMMENT-527
type: comment
title: Comment on request REQ-98
created_by: xgd
created_at: '2026-07-27T19:22:49.901754+00:00'
updated_at: '2026-07-27T19:36:34.978063+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7e70b1db
  kind: chat_transcript
---

<!-- xgd-turn id="2e2bbe70-18e3-4259-84d3-ef17cb9ae09d-user" -->

<!-- xgd-chat role="user" ts="2026-07-27T19:22:47.352344+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="2e2bbe70-18e3-4259-84d3-ef17cb9ae09d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-27T19:36:34.943309+00:00" -->
#### Claude
I'll start by reading the ticket and understanding the current schema.

REQ-96 already landed, so the sequencing constraint is satisfied. Let me read the schema.

Now the renderer:

Now I'll make the schema change — one shared surface/paint axis group.

Now replace the duplicated chip axes on text and the box/image bags:

Now the node kinds — slot, box, container:

Now the types module:

Now the renderer — one shared surface emitter used by every kind:

Now wire it into each node kind, replacing the per-kind copies:

Now the envelope validator — one shared surface check:

Now the fold + assets consumers in `tools/generate`:

Now generalize asset localization to any node kind carrying a background image:

Now let me typecheck and run the test suite.

All three packages typecheck. Now the full test suite:

Identical hashes — all three on-disk reproductions render byte-for-byte the same. Restoring:

Now the UATs:

All green. Now the version bump and commit:

Now the DOC-23 amendment (the architecture doc whose node table this change supersedes):

Now update the ticket body and move it to `free_coded`:

Done. REQ-98 is at `free_coded` with commit `fc5d83aff`.

## What changed

**One group, declared once.** `l1SurfaceAxesSchema` holds the eleven paint axes (`surfaceFill`, `borderRadiusPx`, `opacity`, `surfaceGradient`, `backgroundImageUrl`, `overlay`, `boxShadow`, `border`, `borderLeft`, `backdropBlurPx`, `blendMode`) and is spread into every kind's axis bag. Each kind now declares only what is genuinely its own — `text` the type axes, `image` `objectFit`, `container` the layout fields, `slot` `name`/`behavior`, `control` the module-declared element.

`l1BoxAxesSchema` is deleted rather than kept as an alias — it *was* the surface group, so keeping it would be the duplicate mechanism the project rule forbids. `L1BoxAxes` → `L1SurfaceAxes`, with its three `fold.ts` call sites updated.

**One emitter, one envelope check, one asset resolver.** `surfaceDecls()` replaces the per-kind copies in the renderer. The validator bounds the group once for any node carrying `axes` — which incidentally closed two gaps the kind-keyed version left: `borderLeft`'s width was range-checked on *no* kind, and `backgroundImageUrl` was scheme-checked only on a `box`. `localizeAssets` likewise resolved a background image only on a `box`, so a painted container would have hotlinked the captured origin.

## Evidence

- 5 UATs in `tests/req98-uniform-surface-axes.test.ts`, including a table that drives all six kinds through the real emitter and asserts each produces the identical declaration sequence.
- **Byte-identical reproductions**: I hashed html+css for `gigabytealchemy`, `xgd` and the `joyful` sandbox site with the change stashed and unstashed — all three sha256s match.
- Full suite green (118 files, 831 tests) and a clean workspace typecheck across site-schema, framework, tools/generate and both apps after deleting the compiled `dist`.

[[DOC-23]] has a matching amendment — its §2 table stated `box` paints and `container` lays out. The `box`/`container` merge stays deferred for the reason the ticket gives.

Two things worth flagging: `CLAUDE.md` has an uncommitted modification I didn't make (a REQ-96 doc update that appeared during the session) — I left it alone. And `storage/sites/xgd/` is still untracked from before this session.

<!-- xgd-chat-end -->