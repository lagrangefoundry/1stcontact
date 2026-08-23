---
uid: comment-2b271313
id: COMMENT-1437
type: comment
title: Comment on request REQ-155
created_by: xgd
created_at: '2026-08-23T23:28:00.084164+00:00'
updated_at: '2026-08-23T23:34:52.232017+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-01ea4eec
  kind: chat_transcript
---

<!-- xgd-turn id="89abfc89-0558-4b88-ab57-a1fe18741b20-user" -->

<!-- xgd-chat role="user" ts="2026-08-23T23:26:27.143443+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="89abfc89-0558-4b88-ab57-a1fe18741b20-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-23T23:34:52.071212+00:00" -->
#### Claude
I read the ticket, the capture subsystem, the `SiteStore` precedent it names, and every consumer of a bundle. Findings below — no changes made.

## The good news: the port is genuinely thin

The capture pipeline is **already workerd-safe**. Only two files under `cli/capture/` import anything from `node:`:

| File | Imports |
|---|---|
| `bundle.ts` | `node:fs`, `node:path` |
| `reextract.ts` | `node:fs`, `node:path`, **`node:http`**, `node:net` |

`pipeline.ts`, `extract.ts`, `values-diff.ts`, `sections.ts`, `theme.ts`, `hints.ts` have zero. And `CaptureResult` is entirely in memory already — `assetBytes: Map<string, Uint8Array>` keyed by bundle-relative path (`pipeline.ts:40`). So `writeBundle` really is "hand these bytes to a store", exactly as the ticket assumes.

The precedent is also complete and copyable: port + `fsSiteStore` + `d1r2SiteStore` + `memorySiteStore`, with one shared assertion module (`tests/support/site-store-contract.ts`) registered from both the node and workers vitest projects. AC1/AC5/AC6 have a template that works.

**Sequencing finding: REQ-155 does not actually block on REQ-154.** The Browser Rendering binding doesn't exist in the miniflare test pool anyway, so AC2 ("capture runs inside workerd, lands a complete bundle") is proved the way REQ-149 proved publish — real D1/R2 bindings, injected fake driver, in `*.workers.test.ts`. Only the end-to-end demo needs REQ-154.

## Corrections

**Count.** `bundle.ts` has **17** call sites (7 `mkdirSync` + 10 `writeFileSync`), not fourteen.

**Blast radius is wider than the ticket's "capture pipeline".** Bundle members are read by four production modules *outside* `capture/` — `repro.ts`, `gate.ts:209,221`, `responsive-diff.ts:174`, `perceptual.ts:454` — plus **23 test files** that use `writeL1` / `writeMultiState` as a fixture-authoring API. Every one of these functions is synchronous today; an async port makes the whole chain async. That's the largest hidden cost in the ticket and it isn't priced.

## Five design problems the ticket doesn't name

**1. `reextract.ts` cannot be ported by a storage port.** Its `readdirSync` is the ticket's stated reason for the list verb, but the file's real dependency is `createServer` — it serves the bundle over ephemeral loopback so the browser performs a *real navigation* of mirrored bytes, deliberately, per DOC-13 §2.3. workerd has no `createServer`. Porting it means a Worker route streaming bundle members from R2 to a browser that has to reach it over the public internet — new design, plus the same Access problem REQ-154 is already wrestling with. Decide explicitly: in or out. If out, the list verb still has a justification (enumerating ladder screenshots and assets) — just say that one instead.

**2. `--ref` is polymorphic, disambiguated by `statSync().isDirectory()`** (`perceptual.ts:451`). `1c diff --ref` takes *either* a bundle dir *or* a loose PNG. A store has no answer to "is this a directory". AC6 collides with this and needs a rule.

**3. `readLadderScreenshotPath` returns a filesystem path** and `perceptual.ts` feeds it to the image layer — precisely the "NO PATHS" leak `site-store.ts` argues against at length. Under the port it becomes bytes, which means the image layer takes bytes, which *is* REQ-156. REQ-155 and REQ-156 are coupled at this one function; whichever lands first eats the other's change.

**4. Bundle identity is a behaviour change, not just a naming scheme.** Today identity is `storage/references/<host>/<pathSlug>/` — deterministic, typeable, and *overwriting*: re-capturing a URL replaces it in place. URL + capture time makes every capture a new bundle. That changes the filesystem adapter too: `bundleDirFor` is pinned by `tests/req22-storage.test.ts`, and `--ref storage/references/joyfulculinarycreations.com/index` is a path the operator types. Options are keep host/path as the name with time in metadata, or timestamped names plus a `latest` alias — settle it here.

**5. Tenancy has no CLI-side answer.** `d1r2SiteStore` refuses an unknown tenant by checking a `tenants` row in D1; there is no `references` table and no D1 on the CLI path at all. Either the R2 ReferenceStore also takes `DB` purely for that check, or it keys off the tenant already validated by the router. The filesystem adapter has no tenant, so AC5 is only meaningful for the R2 adapter — worth stating rather than leaving to be discovered.

## Two ACs that need sharpening

**AC4 lands in the module the ticket excludes.** `cmdRefold` is `repro.ts:229`, the same file as `cmdRepro` / `cmdL1Gate` that "Deliberately not here" carves out. It's sync today, shares `readCapture`/`readMultiState` imports with both, and making it async drags them along. Either refold moves out to its own module, or that boundary doesn't survive contact.

**AC3's non-determinism is an open item, not a stated one.** Visible sources: `capturedAt`; whatever the live site serves at capture time; font-load and layout timing; per-engine ladder differences; and PNG encoder differences between Playwright's Chromium and Browser Rendering's. Realistically a local and a cloud bundle will not be byte-equal for *any* PNG or for `multistate.json` geometry. "Equivalent member-for-member" needs a tolerance, and the honest version is probably "same member set, same schema, geometry within the existing gate's tolerance" — which is `values-diff`'s job, not a new one.

## One cross-ticket note

AC1 says no `node:fs` reachable from the capture pipeline — but `pipeline.ts:210` defaults `driverFactory` to `createPlaywrightDriver`, and `capture.ts:65` defaults `cwd` to `process.cwd()`. Those are REQ-154's leak in the same functions. The "inject or fail, no default" rule should be applied once, to both, rather than twice with different reasoning.

---

Happy to fold any of this into the ticket body once we've agreed which way each of the five design questions goes — particularly (1) reextract in/out and (4) bundle identity, since those change the shape of the port itself.

<!-- xgd-chat-end -->