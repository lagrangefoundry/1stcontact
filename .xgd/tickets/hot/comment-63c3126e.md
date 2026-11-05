---
uid: comment-63c3126e
id: COMMENT-3152
type: comment
title: Comment on request REQ-280
created_by: xgd
created_at: '2026-09-19T00:17:19.944630+00:00'
updated_at: '2026-09-19T01:22:41.447507+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-aa42dbaf
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "9ea5918e-02b1-43ba-826f-ec6baa2b073f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0e103fad-2d7e-4034-8b45-cd436a5fce5b-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T00:16:41.988146+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0e103fad-2d7e-4034-8b45-cd436a5fce5b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T00:41:19.225450+00:00" -->
#### Claude
Now the routes and browser API.

Now cutting the branch.

Now let me make the edits. Starting with `tickets.ts`:

Now `material.ts` — the core of the change:

Now `listMaterial` with the catch-up pass, and `storedImageOf`:

Now `storedImageOf` — the label as an alias:

Now the ingest creation site:

Now `capture-material.ts` — create branch only:

Now `imagegen.ts`:

Now the surface declaration:

Now the priming carve-out:

Now the Library tab UI:

Now let me typecheck.

Now let me write the UATs. First, the workers suite over real D1:

Now writing the workers UAT:

All 7 pass. Now the node-side surface UAT and the jsdom Library-tab UAT:

Now the node-side surface UAT:

Now the jsdom Library-tab UAT:

I'll wait for the suite to finish before committing.

The implementation is complete and the targeted suites are green; I'm waiting on the final full-suite run before committing. Summary of where things stand:

**What landed (in the `free-REQ-280` worktree, not yet committed):**

- **The label** — `<PREFIX>-<n>`, prefix derived from `kind` (`DOC` is the one entry in the table; everything else is the kind in capitals, so a fifth kind arrives labelled), number from `counters` under `material:<kind>` via the store's own atomic `nextCounter`. Stored on `fields.label`, never recomposed on read.
- **Assigned at all three births** — upload/fetch, capture adoption (create only, so a recapture keeps the number), and generated pictures — plus a one-time catch-up in `listMaterial`, oldest-first, for the Libraries that were already full when the label was invented.
- **Read in three places** — the catalogue item (`label` on `CatalogueItem`/`itemView` and in the declaration), the Library row (beside the title, in the row filter, and read-only in the detail pane as *Refer to it as*), and as an **input**: the label joins `storedImageOf`'s aliases, so `IMAGE-5` resolves through the one naming rule — in `get_library_item`, `place_on_site`, and `screenshot`/`edit_image` alike.
- **The carve-out written down** — in the library surface prose (version 1→2) and in the priming's no-vocabulary paragraph.

**Two things worth your attention:**

1. **`DOC-n` is already a namespace.** The product's own corpus addresses its method documents as `DOC-33`, and `BUG-65` forbids authored priming from naming anything in that namespace. I kept your prefix — the two never meet where either is used — but the priming carve-out spells only `IMAGE-5`; the surface prose carries both examples. Rationale is on the ticket, along with the cheap escape (one entry in `LABEL_PREFIX`; already-written labels stay valid because they're stored strings).
2. **The catch-up write is a change event**, so an open Library tab redraws those rows once with their new numbers. Correct behaviour, but it meant `REQ-201`'s change-feed fixture had to write a label — it was modelling a pre-label record without meaning to.

**Tests:** 19 new UATs across three suites (real D1 + counters; the surface over a doubled host; the Library tab in jsdom), all passing. Two pre-existing suites needed fixture updates (`REQ-221`'s recording store grew a counter; `REQ-201`'s fixture grew a label) — both were genuine consequences, not test massaging. Typecheck clean on both projects. The 13 other full-suite failures I've verified are pre-existing: 7 fail identically in the clean main checkout, and 6 more are the known worktree webui/dist-assets artifacts.

<!-- xgd-turn id="ba88b724-6c05-4736-bca1-0bfc9163d22d-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T00:45:17.060667+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="ba88b724-6c05-4736-bca1-0bfc9163d22d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T00:59:27.502753+00:00" -->
#### Claude
All 19 REQ-280 UATs green. Now the version bump and commit:

Merge clean. Re-running the affected suites after the merge, in the foreground:

Merged back. Now the free_coded gate — letting it allocate the version under its own lock:

Free-coding of REQ-280 is complete.

**Landed** — `03cf1403` `[FREE-CODED] REQ-280 — IMAGE-5 and DOC-7: one name both halves can say`, merged into `xgd-working` (tip `a861d93e`), version bumped to `0.2.278` (`ca12107e`), ticket at `status: free_coded` with both SHAs in `fields.commits`.

**The change:** a material now carries a label — `IMAGE-5`, `DOC-7` — drawn from that kind's own per-tenant counter through the store's atomic `nextCounter`, so every client's numbering starts at 1 and a label can carry no fact about anyone else's Library. It is assigned where a record is born (upload/fetch, capture adoption on *create* only so a recapture never renumbers, generated pictures) and back-filled once, oldest-first, by `listMaterial` for the Libraries that were already full. It is read on the catalogue item, on the Library row and detail pane, and — via `storedImageOf`'s aliases, the single projection from record to name — accepted as an *input*, so `IMAGE-5` resolves in `get_library_item`, `place_on_site`, `screenshot` and `edit_image` alike. The uid is untouched.

**Tests, all run in the foreground:** 19 new UATs across three suites (real D1 + counters; the surface over a doubled host; jsdom for the row) — 19/19 green. Full suite after the merge-back: **5044 passed, 6 failed**. Five are the pre-existing set I verified fails identically in the clean main checkout (`BUG-112` ×2, `AC960`, `BUG-50`, `BUG-67`). The sixth, `AC1293`, is the known KB parallel-load artifact — it passes on its own, which I confirmed. Typecheck clean on both projects before and after the merge.

**Two things I decided and recorded on the ticket rather than asking:**

- **`DOC-n` collides with the corpus's own document ids.** I kept your prefix — a catalogue label is always read beside its item, and a corpus document is never said to a client — but the priming carve-out spells only `IMAGE-5`, because `BUG-65` forbids authored priming from naming anything in that namespace and its guard fires on exactly that shape. The surface prose carries both examples. If it ever bites, the fix is one entry in `LABEL_PREFIX`; labels already written stay valid because they're stored strings.
- **Two existing fixtures changed as consequences, not accommodations:** `REQ-221`'s recording store grew the counter ingestion now calls, and `REQ-201`'s change-feed fixture grew a label — a catch-up write is a change event like any other, so a fixture without a label was modelling a pre-label record without meaning to.

<!-- xgd-turn id="42d1d478-c010-41fa-b3f2-6a056afab20f-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T01:04:45.634593+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d4a81c54-eb0d-4ac7-951c-57de5d589977-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T01:05:24.503770+00:00" -->
#### You
please complete the free-coding of this ticket

Blocking details:
- branch `free-REQ-280` still exists at `/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-REQ-280`
- branch HEAD: `a861d93eddd7ad9decb5d067d06f35440f884197`

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="d4a81c54-eb0d-4ac7-951c-57de5d589977-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T01:22:40.217378+00:00" -->
#### Claude
The worktree is clean and both commits are reachable from `xgd-working`. Tearing down the branch:

The one earlier failure was real, not noise — I found the cause. Let me confirm it before fixing:

Confirmed. `created_at` is millisecond-granularity ISO, and my comparator returns 0 on a tie — so two rows created in the same millisecond are numbered in whatever order the store happened to list them. That's a defect in the implementation, not just the test. Cutting a branch to fix it:

Session lock held. First, the ticket-body language the fix's UAT must trace to:

Now the UAT — proving the property at both ends instead of depending on the tie not happening:

All three creates land on the identical millisecond — the tie is deterministic here, not incidental. Asserting it as the case's premise:

The tie isn't guaranteed — that run produced two distinct timestamps. Asserting it would reintroduce exactly the flake I'm removing. Reverting to the rule-based assertion, which holds either way:

Now proving the UAT has teeth — temporarily reverting the fix to confirm the new case goes red:

The UAT didn't reliably catch it — that run had no tie. A regression test that only sometimes fires isn't one. Naming the rule so it can be tested directly:

Now verifying these new UATs actually catch the defect:

Both mutations are caught. Restoring the real rule:

23 UATs green. Full suite in the foreground:

All remaining failures are environmental or other agents' in-flight work (a carousel module version floor, a stray `.claude` dir causing EISDIR, and the known staging-dir scan artifacts) — none touch REQ-280's files. Committing:

All four commits recorded, version 0.2.280. Releasing the session lock and doing a final verification:

REQ-280 free-coding is complete.

**Final state:** `status: free_coded`, version `0.2.280`, four commits recorded, everything on `xgd-working`, working tree clean, branch and worktree gone, session lock released.

**What the second round was.** Verifying the first cut, one UAT failed once and then passed on re-runs. Chasing it rather than shrugging found a real defect in the implementation: the catch-up labelled "oldest first" by comparing `created_at` alone, but the store stamps ISO timestamps at *millisecond* granularity. Records written in immediate succession — a client dropping a folder of photographs — routinely share one. On a tie the comparison returned 0, the sort fell through to whatever order the store happened to list the rows in, and which picture was `IMAGE-1` was luck. Nothing was corrupted (each row still took a distinct number from the atomic counter), but it cost the one property the order exists for: that the sequence reads the way the client filled their Library, the same way every run.

The order is now `(created_at, uid)` — the uid is unique, stable, and already the store's own tiebreak on every sorted read.

**Why it became a named rule.** I first tried to prove the fix through the real store and couldn't: reverting the tiebreak left the end-to-end test *green*, because that run had no tie. Probing showed three concurrent creates sometimes share a millisecond and sometimes don't — so a suite that could only reach this through a store would exercise the tiebreak or not depending on the clock, which is the same intermittent failure in a new place. So `labelOrder` is exported and asserted directly at three points: oldest-first, ties broken the same way from any starting order, and the timestamp deciding before the uid does. I checked each against a mutated rule — dropping the tiebreak reddens the second, dropping the timestamp reddens the third — so these have teeth. The end-to-end case was renamed to claim only what it can guarantee.

**Tests, all foreground.** 23 REQ-280 UATs green (up from 19). Full suite: 5057 passed, 11 failed — every one environmental or another agent's in-flight work, none touching REQ-280's files: a carousel module version floor from work that landed on `xgd-working` at 18:15, a stray `.claude` directory inside `packages/framework/src/modules/` making a `readdirSync` scan throw `EISDIR`, and the known staging-dir scan artifacts (those suites pass in isolation). Typecheck clean on both projects.

One note for your awareness: `xgd branch cut REQ-280` could not re-create its worktree — the sandbox denies `.git/worktrees/free-REQ-280` specifically, even though creating a differently-named directory there works. I used the sanctioned unbranched fast path (`xgd branch session start/end`) instead. If that denial persists it will block re-cutting any previously-cleaned branch name.

<!-- xgd-chat-end -->