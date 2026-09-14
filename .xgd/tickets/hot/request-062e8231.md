---
uid: request-062e8231
id: REQ-246
type: request
title: A file keeps a usable name, and is served as what it is
created_by: EPIC-10
created_at: '2026-09-14T20:28:41.237519+00:00'
updated_at: '2026-09-14T21:08:01.851957+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: medium
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-673ed807
---

# A file keeps a usable name, and is served as what it is

Two defects on one path — a file arriving from a client and ending up as a site asset —
found together when the two XGD whitepapers were uploaded. Neither is about that site, and
neither is fixed by correcting it.

## 1. What is true today

**Nothing sanitises a filename, anywhere on that path.** A file dropped on the conversation
keeps the client's own name: `promoteToSiteAsset` takes `item.filename` and the comment
beside it says so deliberately — *"the client's own filename by default, which is what the
upload route passes"*. That name becomes the site asset name, and the asset name becomes
the R2 key suffix through `assetKey`. The only rule applied anywhere on the way is
`d1r2-store.ts`'s `isUnsafeName`, which refuses `/`, `\` and `..` — and refuses them with
`continue`, so the bytes are silently not written and the caller is told nothing.

Everything else survives. `How_Can_You_Trust_the_Code_Your_AI_Writes?.pdf` is a real R2 key
on the XGD site today, with a literal `?` in it. Two consequences are already visible:
`assetKind` splits on `[?#]` before reading an extension, so that file's kind is derived
from a truncated stem; and the page that references it carries `%3F`, so the stored name
and the referenced name are equal only if every reader encodes and decodes identically.
A name is not a place to find out.

**The MIME table has no `.pdf`, and there is more than one MIME table.**
`tools/generate/src/store/content-type.ts` is documented as the single table, and says why:
*"a second copy of the table is a drift waiting to happen — the day `.avif` is added to one
of them, whichever path did not get it starts serving `application/octet-stream` for reasons
no one will connect to the change."* There is a second copy at
`apps/public-site/src/content-type.ts`, and the two already disagree: the public-site table
holds `otf`, `txt`, `xml`, `mjs` and `webmanifest`; the store table holds none of them. The
drift the header predicted has happened. Neither table holds `pdf`, so both whitepapers are
stored and served as `application/octet-stream`.

**And there are five, not two.** `apps/control-app/src/capture-material.ts`'s
`memberContentType` and `tools/generate/src/cli/capture/reextract.ts` each carry a literal of
their own, and they disagree with the store's about the charset a textual member carries.
Both are folded in here — the only thing either needed that a table cannot hold is
`reextract`'s sniff for an *extensionless* member (Google Fonts' `css2`), which stays as the
fallback behind the shared answer rather than as a reason to keep a table.

The fifth is `tools/generate/bin/smoke.mjs`'s `EXPECTED_CONTENT_TYPES`, and it is the one
whose justification was *true*: that script runs under bare `node` straight after a deploy,
outside every bundler in this repo, and cannot load TypeScript. Its header says the
duplication is "pinned by a UAT rather than by hope" — which is word for word what the
`public-site` table said, and that one drifted anyway. A pinning test only ever compares the
rows both sides happen to have, so the five formats present in one and absent from the other
were never compared and `pdf` was absent from both. The arrangement does not work and is not
kept.

**So the module becomes plain JavaScript with a declaration file beside it.** That is the
only change that makes the smoke script a *consumer* rather than a copy: every other runtime
here reaches it through a bundler, and JavaScript is the one language all five can read.
TypeScript resolves the import to `content-type.d.ts` and never reads the implementation, so
no `allowJs` is needed anywhere and both Workers keep typechecking clean. It is the seam
`apps/control-app/src/builder/*.js` already uses for rules both sides of the browser/server
boundary need. The declaration restates the *shape* and never the table — a signature out of
step is caught by the compiler at every call site, which is not true of a row out of step in
a duplicated map.

The smoke script's asset crawl gets stricter as a consequence, and this is the second half of
the same bug: it used to skip any extension its own list did not hold, which is precisely the
case a drifted copy produces — the check fell silent exactly where it was needed. It compares
every served asset now, against the origin's own table.

## 2. The change: one table, covering the inert formats

The extension-to-type map becomes one table with one reader, and it grows to cover the
document, archive and media formats a site actually carries — `pdf` first among them.

**One reader means the table stops being exported.** A map four callers can index is four
readers, which is how the drift above actually happened — `MIME[path.extname(file)]` and
`MIME[extname(name)]` were subtly different lookups (one lowercased, one did not). `MIME`
becomes private to its module and every caller asks `contentTypeOf`.

**The reader becomes path-aware, because it now answers for both surfaces.** `public-site`
asked its own copy about a whole served key (`sites/<k>/rev/3/out/assets/hero.png`) and the
store asked its copy about a bare name; one function has to do both, so `extensionOf` takes
the last path segment first. It also adopts `public-site`'s rule that a leading dot is a
name and not an extension — `.gitignore` is not an HTML file.

**Breadth is safe here, and the usual objection does not apply.** The argument against a
broad MIME table is that serving an upload under its real type turns the site's own origin
into a place where a visitor's browser will execute what somebody uploaded. That surface is
already open and is not widened by this: `html`, `js` and `svg` are in the tables today and
are served with their real types from the same bucket. What this adds is inert — bytes a
browser renders or downloads but does not execute as script on our origin. No new active
type is added by this ticket, and the distinction between the two groups is written down so
the next addition has to decide which it is — as two separate literals in the source, and
as an enumerated active set a test asserts against.

**`application/octet-stream` remains the fallback.** An unknown extension is still labelled
as bytes rather than guessed at, which is both the safe answer and a legible one.

**Inline-versus-download is a separate question and stays out of this.** A whitepaper served
as `application/pdf` opens in the browser; whether a gated delivery should instead force a
download is a `content-disposition` decision, and it is not made here.

## 3. Names are made safe once, where the bytes are written

Sanitisation belongs at the single write path, not at each surface that can name a file.
`editAssetAdd`'s own comment already claims that ground — *"one write path, one set of rules
about names"* — and the rule is what is missing rather than the place to put it. Every
surface that can name a file arrives through it: `1c asset add`, the AI toolbox's adapter,
and a client's drag onto the conversation.

A stored name is restricted to characters that survive being a URL path segment, an R2 key
and a filename without encoding: the extension is preserved, everything outside the safe set
is replaced, and runs collapse. A name that sanitises to nothing still yields a usable name
rather than an empty one. Case is preserved — it is the client's name for their own file,
and lowercasing it is a second, unrelated opinion. Any leading path is dropped rather than
refused, because a browser's file input hands one over on a directory upload and only its
last segment was ever a filename.

**The rule is idempotent, which is what makes applying it twice legal.** It runs in
`freeAssetName` — so the collision that function decides about is the real one — and again
in `editAssetAdd`, which cannot assume its caller did.

**Sanitising is not deduplicating.** Two different files whose names sanitise to the same
string must not silently become one; `freeAssetName` already mints a free name for a taken
one, and it runs on the sanitised name so that the collision it is deciding about is the
real one.

**`isUnsafeName` stops being a silent skip.** A name that cannot be made safe is a refusal
the caller is told about. Today the bytes vanish and the write reports success, which is the
failure mode that costs the most to diagnose.

**The refusal is one rule, stated once, and every adapter obeys it.** The D1/R2 store is
where the silent `continue` was; the filesystem adapter never checked at all, so a name with
a separator in it composed a path that left the assets directory entirely. Both — and the
in-memory adapter — now run the same guard over the whole change set before the first byte,
so a change set is one act and cannot half-land. The two node-side adapters' `write` becomes
`async` as a consequence: the port declares `Promise<void>` and a caller holding the promise
rather than awaiting the call in place must see a rejection, not a synchronous throw.

**`editAssetReplace` deliberately does not sanitise.** `editAssetAdd` makes a name safe
because it is *minting* one; replace is *addressing* one that already exists. Sanitising
there would turn every re-placement of an already-stored awkward name into a `NOT_FOUND` for
bytes that are plainly live on a client's site. `promoteToSiteAsset`'s re-placement branch
takes the recorded name untouched for the same reason.

## 4. What this does not touch

The material ticket keeps the client's original filename — that is what the client called it
and what the Library shows them. What changes is the name the *site asset* is stored under.
`material.ts`'s own MIME map is deliberately separate ("not a general MIME database", for
what the ingestion steps can read) and stays separate — it answers a different question,
what a file whose own declared type said *nothing* probably is, and it returns a stated type
untouched so it can never disagree with a served header.

`assetKind`'s `[?#]` split stays. It is reached with complete URLs as well as stored names,
so the split is doing a second job that sanitised names do not remove the need for.

Existing assets are not renamed by deploying this. The XGD file is corrected by hand,
outside this ticket.

## 5. Acceptance criteria

1. A PDF placed on a site is stored and served as `application/pdf`.
2. There is one extension-to-type table with one reader — including for the post-deploy
   smoke script, which runs under bare `node` and previously could not reach one. Asserted by
   a test that scans the production source, `bin/` included, and fails if a second table is
   introduced — rather than by a test that compares two.
3. The formats the public-site table held and the store table did not — `otf`, `txt`, `xml`,
   `mjs`, `webmanifest` — are present after the merge, and no route that served one of them
   starts serving `application/octet-stream`.
4. An unknown extension is still served `application/octet-stream`.
5. No type that a browser executes as script on our origin is added that was not already
   served. Asserted against the enumerated active set.
6. A file named with `?`, `#`, `%`, a space, or a path separator is stored under a name
   containing none of them, and its extension is preserved.
7. A name that sanitises to the empty string still produces a usable, unique asset name.
8. Two different files whose names sanitise to the same string are stored as two assets
   under two names, and the page referencing the first still resolves it.
9. The name a page references and the name the asset is stored under are byte-identical —
   no reference requires percent-encoding to match its own asset.
10. A name that cannot be made safe is refused with an error naming the file. Bytes are
    never silently dropped by a write that reports success, by any adapter, and a change set
    carrying one bad name lands none of its assets.
11. An asset already stored under an awkward name goes on resolving until it is renamed:
    deploying this breaks no live reference, and it stays replaceable under its own name.

## 6. Evidence

- `tests/test_UAT_FC_REQ-246_one_content_type_table.test.ts` — AC1–AC5. Served headers come
  from `public-site`'s own `fetch` entry point over a bucket seeded by a real publish; the
  AC2 guard scans the production source tree for a second table rather than comparing two.
- `tests/test_UAT_FC_REQ-246_a_usable_name.workers.test.ts` — AC6–AC11 through the real
  `promoteToSiteAsset`, over real D1 and R2, so the property is proved about an actual key.
- `tests/test_UAT_FC_REQ-246_safe_names.test.ts` — the rule at close range: every shape a
  filename can take, idempotence, and the floor in each node-side adapter.
- `test_UAT_FC_REQ-246_the_smoke_script_holds_no_table_of_its_own`, in
  `tests/test_UAT_FC_REQ-144_deploy_scripts.test.ts` — replaces the pair-pinning case that
  the drift walked straight past. The two suites that used to compare the smoke table with
  the Worker's no longer have two things to compare.
