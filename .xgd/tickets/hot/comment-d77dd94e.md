---
uid: comment-d77dd94e
id: COMMENT-3673
type: comment
title: Comment on request REQ-312
created_by: xgd
created_at: '2026-09-23T18:02:52.600472+00:00'
updated_at: '2026-09-23T21:52:29.984325+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-fec4b115
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "53333aee-6265-42f6-b4a0-1d528929715d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="dd262acd-e5d3-4251-819b-97064f4ee29e-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T18:01:37.152300+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="dd262acd-e5d3-4251-819b-97064f4ee29e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T18:11:12.596128+00:00" -->
#### Claude
I've read REQ-312, EPIC-21, DOC-56, `fonts/catalogue.json`, `fonts/registry.yaml`, `1c fonts check`, the L1 font-face schema + renderer, and public-site's route grammar. Three things need your call; the rest I'll decide.

## 1. There is no upstream woff2 — the ticket's central premise doesn't hold

`github.com/google/fonts` ships **TTF only**. Verified just now: `ofl/roboto/Roboto[wdth,wght].ttf` → 200, 488 KB. There is no `.woff2` anywhere in the release trees.

The only woff2 Google publishes is what `fonts.gstatic.com` serves, and those are precisely the unicode-range-split subsets the ticket rules out — *and* they are the same provenance class as the five capture-derived `REVIEW_REQUIRED` entries the epic wants closed ("hash-named capture mirrors with unverified subset/delivery provenance"). Mirroring them would reproduce the state we're trying to leave.

So "unmodified upstream release woff2" has to resolve to one of:

- **(a) — my recommendation.** Mirror the upstream TTF and losslessly re-container it to WOFF2: brotli compression with the **null glyf/loca transform** (transform version 3, explicitly permitted by the WOFF2 spec). Every glyph, the `name` table and the copyright string are byte-preserved, and the transform is reversible — it is a compression container change, not a modification, so the Reserved Font Name question still doesn't arise. ~250 lines of encoder over Node's built-in `zlib.brotliCompress`, **no new dependency**, and self-verified by decoding back and comparing bytes against the upstream TTF. Costs ~10% more bytes than a fully-transformed woff2; still roughly half the TTF.
- (b) Serve the upstream TTF unchanged — zero conversion code, ~2× the bytes on every page load.
- (c) Mirror gstatic's subsets after all, and accept split files with the provenance caveat.

The alternative to (a) on the dependency axis is `wawoff2` (a 1.4 MB emscripten WASM blob). I'd rather write the encoder: the format is frozen, so its maintenance cost is ~zero, and it adds nothing to the supply chain.

## 2. The size estimate is low

The epic says "a few hundred MB". That holds only if most families are variable. 1,383 of the 1,941 are static-only, shipping up to 18 files each (9 weights × 2 styles), so the real figure is **~8–10k files, 1.5–3 GB of TTF in, ~700 MB–1.2 GB of woff2 out**. Storage cost is still noise; the *transfer* is hours, and it's ~10k requests against `raw.githubusercontent.com` (which is already rate-limiting me unauthenticated).

Fine by me — but it means the mirror has to be resumable and incremental by construction, which it should be anyway ("re-running against an unchanged catalogue transfers nothing").

## 3. Do you want the real 1,941-family transfer run in this session?

I can land the machinery and prove it against a fixture upstream in a couple of hours; kicking off the real mirror is a separate, long, detached operation that also needs the R2 destination to exist. Happy to start it in the background at the end — say the word.

---

## What I'll decide myself unless you object

- **Where the bytes live**: shared prefix `platform/fonts/<slug>/<file>.woff2` in the existing `1stcontact-sites` bucket (no new infra; `sites/` is the only other root, so no collision).
- **The serving origin**: public-site gains a reserved `/_fonts/…` path, matched ahead of the site grammar exactly as `/api/download/…` already is — immutable cache, `Access-Control-Allow-Origin: *`, plus `/_fonts/LICENSES.txt`.
- **The `src` a page carries is an absolute platform-origin URL**, not root-relative. This is forced: the renderer's `relativizeUrl` rewrites `/_fonts/x` to the *document-relative* `_fonts/x`, which would break on every page not at the site root. Absolute `https://` URLs pass through untouched.
- **`1c fonts check` recognises a platform `src` by its `/_fonts/` path, not by host**, so the same site definition checks clean in dev, preview and production with no configuration.
- **The platform tier is derived, not serialised twice**: `1c fonts mirror` writes `fonts/mirror.json` (the manifest — family, licence, upstream commit, per-file sha256 and size); `loadFontRegistry` composes the registry as authored site entries + platform entries derived from that manifest, with `redistribute_in_product: true` following from the licence field. `tier: 'platform' | 'site'` on the entry schema, defaulting to `site`. No 1,941-entry YAML blob, and nothing hand-written.
- **Staged bytes under `fonts/mirror/` are gitignored**; the manifest is committed.
- **Scope**: I'll build it as one ticket (mirror + encoder + manifest + registry tier + check + publish + serving). It's at the top of the free-coding size band but it is one intent, and splitting it leaves a half-present feature.

Say "go" (or pick differently on 1 and 3) and I'll cut the branch.

<!-- xgd-turn id="73d4c64c-1959-4421-806a-5741acdda2aa-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T18:32:40.380083+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="73d4c64c-1959-4421-806a-5741acdda2aa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T19:02:46.404133+00:00" -->
#### Claude
Ticket re-read. The measurements and the build-integration direction settle most of it; two items are still marked OPEN, and one of them the ticket itself names a default for. I'm taking both and recording them before I cut the branch.

Baseline is green. Now the riskiest piece first — the WOFF2 container. Let me get the format exactly right rather than from memory.

Spec settled. Two requirements change my round-trip claim (DSIG must be removed; `head` flags bit 11 must be set), so I'll write the encoder to match and correct the ticket language after. Encoder first.

Format validated against a real third-party encoder's output. Now let me check whether I can get a browser to actually load one.

Format proven. Now the schema — the platform tier and the one spelling of the platform path, shared by the checker and the server.

Now the platform manifest and the shared path spelling:

Now the upstream reader and the mirror itself.

Now the publish half:

Now the check — teaching it the platform tier.

Now the join itself:

Now wire the commands into the CLI:

Now the UATs:

Now the serving UAT, against the real Worker in workerd:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="29619d5f-70e3-4eab-9be5-1760ef5a2c2c-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T20:13:10.884675+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="29619d5f-70e3-4eab-9be5-1760ef5a2c2c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-23T20:19:45.007556+00:00" -->
#### Claude
All regression batches pass. Now correcting the ticket where the implementation taught me the spec's actual constraints:

The operator edited the ticket since — route 1 confirmed in their own words. Let me read their version in full and amend only what's missing.

Now the version bump and commit:

Now merging back into `xgd-working`:

Confirmed pre-existing and unrelated — site traversal is untouched by my diff. Let me verify the merged tree is green where that local data isn't present:

REQ-312 is free-coded and landed on `xgd-working` as `f62cf1b`, ticket at `free_coded`, 18 story points, branch cleaned up.

## What shipped

**The WOFF2 container, written here** (`tools/generate/src/fonts/woff2.ts`) — the load-bearing piece, because the ticket's original premise turned out false: `github.com/google/fonts` ships TTF only, so there is no upstream `woff2` to mirror. Only the null transform is used (version 3 for `glyf`/`loca`, 0 elsewhere), so every table goes to Brotli literally. **Each file is decoded back and compared table-by-table before it is written** — a file that doesn't invert is never served, its family reported as a gap instead. Two differences are the spec's own `MUST`s (`DSIG` dropped, `head.flags` bit 11 set); everything else — glyphs, `name`, copyright — is byte-identical. No new dependency; Node's built-in Brotli.

I validated my reading of the format against a **real gstatic `woff2`**: header, known-tag indices, `UIntBase128`, and the `transformLength`-iff-transformed rule all parse exactly, and `directory_end + totalCompressedSize == file length` to the byte. That's a third-party encoder as oracle, not my own fixture.

**`1c fonts mirror --repo <checkout>`** → `fonts/platform.json` (committed manifest: family, path, size, digest, pinned to a catalogue and an upstream sha) plus gitignored staged bytes. Incremental, retains entries for families gone upstream, reports every failure by name. **`1c fonts publish`** sends them to `platform/fonts/` over the R2 REST API, digest-checked and resumable; the Cloudflare account resolver moved out of `kb.ts` so both release-time verbs share one credential.

**`1c fonts check`** resolves a platform-origin `src` against the manifest. Tiers are indexed **separately** — five authored entries are Google families the mirror also holds, so one index across both would refuse to load the registry at all. It also joins catalogue to mirror, and reports an unpopulated mirror plainly rather than failing a fresh clone.

**`public-site`** serves `/_fonts/…` ahead of the site grammar (a platform font belongs to no site, so the cross-tenant guard would correctly refuse it on a bound customer domain) — immutable, `Access-Control-Allow-Origin: *`, per-family licence beside the bytes, aggregate index at the root.

Smoke-tested end to end on real Roboto: 488KB TTF → 230KB woff2, clean inversion, re-run transferred nothing.

**20 UATs** (15 node through the real CLI, 5 in workerd through the real Worker). Regression scope green: fonts, catalogue generator, kb, public-site serving, CLI hygiene, naming, site-schema.

## Two things to flag

**A pre-existing failure in your local checkout, not from this change.** `1c fonts check` and `tests/req101-font-registry.test.ts` throw in `/Users/martin/lagrangefoundry/1stcontact` because `storage/sandbox/joyfulculinary/draft/pages/home.json` pins `carousel` v1, below that module's v3 migration floor. `loadSite` throws inside `collectFontUsages`. I confirmed my diff touches no site-traversal code (the only `for` loop I changed is `indexByFamily`'s), and the same tests pass in a worktree without that untracked local data. I left it alone — it's local site data, outside this ticket.

**The real transfer hasn't been run.** The machinery is proved against a checkout fixture; populating production is the GB-scale dependency fetch your build-toolset framing deliberately separates out. When you want it:

```
git clone --depth 1 https://github.com/google/fonts ~/google-fonts
1c fonts mirror --repo ~/google-fonts     # hours of CPU, ~1.35GB out
1c fonts publish
```

Until then `1c fonts check` says `*** NOT POPULATED — 1935 documented families have no bytes behind them ***`.

Ticket body is current: I preserved your edits (route 1 in your words, the sizing/annual-refresh reasoning), settled the serving origin that was marked "still open", and added the invertibility precision plus behaviour bullets for everything the UATs assert. REQ-313 (`use_font`) is now unblocked — it writes the `src` using the same path definition the check resolves.

<!-- xgd-turn id="47005f79-1832-4e53-be2d-7ee63be253a4-user" -->

<!-- xgd-chat role="user" ts="2026-09-23T21:52:29.541767+00:00" -->
#### You
Please review **COMMENT-3711 attached to this ticket and add it to your scope**

<!-- xgd-chat-end -->