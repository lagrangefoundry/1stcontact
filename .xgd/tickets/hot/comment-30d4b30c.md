---
uid: comment-30d4b30c
id: COMMENT-1026
type: comment
title: Comment on request REQ-142
created_by: xgd
created_at: '2026-08-16T00:22:57.314754+00:00'
updated_at: '2026-08-16T01:07:33.892558+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-0dd62a5d
  kind: chat_transcript
---

<!-- xgd-turn id="71b82a70-bfe9-4282-89c7-1a27a96b190f-user" -->

<!-- xgd-chat role="user" ts="2026-08-16T00:22:51.882354+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="71b82a70-bfe9-4282-89c7-1a27a96b190f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-16T00:29:06.045280+00:00" -->
#### Claude
I've read the ticket, `edit.ts` (all 2321 lines), the `store/` modules, `preview.ts`, `builder.ts`, `commands.ts` and the toolbox call sites. The shape is clear and I'm ready to cut `free-REQ-142` and start — but five decisions are genuinely underdetermined by the ticket, and getting the first one wrong would be expensive to redo in REQ-143. My recommendation is attached to each; say "all fine" and I'll proceed on them.

**1. How the store reaches `edit.ts`.**
`edit.ts` can't import `FsSiteStore` (that re-imports `node:fs` transitively, which is exactly what §4's `docs_store.js` precedent avoids), so the store must be passed in.
*Recommend:* a required `store: SiteStore` field on the options object every `edit*` function already takes (`EditOptions extends GlobalOptions`), with `fsSiteStore(ctx)` living in a Node-only entry (`store/fs.ts`). `edit.ts` imports the port's types only. Making it required rather than optional is deliberate — the compiler then finds every call site.
*Alternative:* a `SiteEditor` class holding the store, 31 methods. Nicer call sites, much larger diff, changed public surface.

**2. Port width beyond §5's eight verbs.**
`edit.ts` also reaches the change journal (`appendChange` / `changesSince` / `draftCounter` → `.journal.json`) and computes `editStatus` by diffing the live revision *directory* against `draft/`. AC2 ("no `node:fs`/`node:path` in `edit.ts`") forces both behind the port.
*Recommend:* the port gains `counter` / `appendChange` / `changesSince` and a single `pendingChanges(slug)` verb, rather than leaving them for REQ-143. Confirm that widening is wanted here.

**3. `editAssetAdd(slug, file)` reads the operator's own disk** — a source path that is not the store, and has no meaning in a Worker.
*Recommend:* the source read moves out to its two callers (the CLI and the AI toolbox adapter); the function becomes `editAssetAdd(slug, name, bytes, opts)`. `1c asset add <file> --as` and the tool's declared `file` parameter are both unchanged; the `NOT_FOUND` envelope for a missing source file is raised at the call site with identical code/path/hint, so AC3 holds.

**4. The preview asset path.**
`DraftStore.asset()` returning an absolute path is precisely the leak §5 rules out, so it becomes `readAsset(slug, rel): Promise<Uint8Array | null>` and `PreviewFile`'s `{ kind: 'file', file }` becomes bytes. That trades `sendFile`'s streaming for a buffered read in the dev builder. Dev-only and assets are small, so I think it's right — but it is a real change on the serving path, not just a type change.

**5. How to read AC1.**
"The full existing suite passes with no assertion changed" — I'll read that as *assertions* untouched, while ~17 test files gain `await` and a `store:` in the options they pass. There's no way to keep sync call sites once the functions are async. Confirm that's the intended reading.

Out of scope unless you say otherwise: `commands.ts` (`new`/`publish`/`checkout`/`render`/history) stays on the filesystem directly — `FsSiteStore` will delegate `loadDraft` to the existing `loadSite`, and the fake in-memory adapter for AC4 will implement the port only.

One addendum from the call-site survey I had running, which sharpens two of the questions above:

- **REQ-141 landed, but it shipped no site-fixture harness** — only the three-config vitest split plus two self-evidencing tests. There is no reusable site factory; every test that needs a site still rolls its own `mkdtemp` + `cmdNew` preamble. So AC4's fake in-memory adapter has nothing to build on and I'll write it fresh, in the **node** project (it needs no workerd — proving no caller touches the filesystem is a port-level claim). Flagging it because the ticket's "depends on REQ-141 for the harness the fake-adapter UAT runs in" reads as though more had landed than did.
- **The async conversion is cheaper than §3 suggests.** All eight `builder.ts` call sites are already inside `async handleBuilderRequest`, and `toolbox.ts`'s operations are typed `(params) => unknown` with an invoker that already awaits (`publish` is async today) — so neither needs a signature change. The real churn is `index.ts`'s sync `dispatchEdit`, and 5 test files that import `edit.ts` directly; ~37 more exercise it through the builder's HTTP API and are already async.

Also worth knowing: `builder.ts` and `fidelity.ts` contain non-UTF-8 bytes, so a plain `grep -r` silently skips them as binary. Not something to fix here, but it hid `builder.ts` from my first pass and would hide it from any later review of this refactor.

I'll cut `free-REQ-142`, set `status=free_coding`, and implement on the recommendations above as soon as you confirm.

<!-- xgd-turn id="2d28b353-2bb1-4a38-832b-a004a07be888-user" -->

<!-- xgd-chat role="user" ts="2026-08-16T00:35:24.250472+00:00" -->
#### You
I was concerned about that - we need a site factory - please create one

<!-- xgd-turn id="d5dbef78-18ac-4cd4-acb4-49d58ff4077f-user" -->

<!-- xgd-chat role="user" ts="2026-08-16T00:37:32.136418+00:00" -->
#### You
Lets go with your recommendations

I was concerned about that - we need a site factory - please create one

<!-- xgd-turn id="d5dbef78-18ac-4cd4-acb4-49d58ff4077f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-16T01:07:33.345946+00:00" -->
#### Claude
Now the port. Starting with the node-free model modules:

Now `journal.ts` becomes the filesystem binding over that model:

Now the pure assemble-and-validate step, so both adapters share one definition of "a loaded site":

Now the port itself:

Now the two adapters:

Now wire the barrel and rewrite `edit.ts`:

Now the store-access helpers — the block that had all the path arithmetic:

Now the copy commands:

Now the L1 authoring pair:

Now the page commands:

Now the module (behavior-instance) commands:

Now config and palette:

Now `editPaletteRename` — the multi-file write AC-5 names:

Now the asset commands:

Now `editAssetAdd` — the one whose signature changes, since its source was never the store's:

Now `editStatus`, `editChanges`, and the gap-fix command:

Let me typecheck `edit.ts` to catch what I've missed:

Now reconcile `preview.ts`'s read seam with the port:

Now the builder:

Now let me apply the builder edits:

Now the AI toolbox, and the CLI dispatch:

Those three are clean. Now the CLI dispatch:

Now the site factory:

Now the UAT that drives the whole surface through both backends:

Now the `await` pass over those same call sites:

<!-- xgd-chat-end -->