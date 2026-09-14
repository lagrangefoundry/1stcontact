---
uid: request-062e8231
id: REQ-246
type: request
title: A file keeps a usable name, and is served as what it is
created_by: EPIC-10
created_at: '2026-09-14T20:28:41.237519+00:00'
updated_at: '2026-09-14T20:28:41.237519+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
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

## 2. The change: one table, covering the inert formats

The extension-to-type map becomes one table with one reader, and it grows to cover the
document, archive and media formats a site actually carries — `pdf` first among them.

**Breadth is safe here, and the usual objection does not apply.** The argument against a
broad MIME table is that serving an upload under its real type turns the site's own origin
into a place where a visitor's browser will execute what somebody uploaded. That surface is
already open and is not widened by this: `html`, `js` and `svg` are in the tables today and
are served with their real types from the same bucket. What this adds is inert — bytes a
browser renders or downloads but does not execute as script on our origin. No new active
type is added by this ticket, and the distinction between the two groups is written down so
the next addition has to decide which it is.

**`application/octet-stream` remains the fallback.** An unknown extension is still labelled
as bytes rather than guessed at, which is both the safe answer and a legible one.

**Inline-versus-download is a separate question and stays out of this.** A whitepaper served
as `application/pdf` opens in the browser; whether a gated delivery should instead force a
download is a `content-disposition` decision, and it is not made here.

## 3. Names are made safe once, where the bytes are written

Sanitisation belongs at the single write path, not at each surface that can name a file.
`editAssetAdd`'s own comment already claims that ground — *"one write path, one set of rules
about names"* — and the rule is what is missing rather than the place to put it.

A stored name is restricted to characters that survive being a URL path segment, an R2 key
and a filename without encoding: the extension is preserved, everything outside the safe set
is replaced, and runs collapse. A name that sanitises to nothing still yields a usable name
rather than an empty one.

**Sanitising is not deduplicating.** Two different files whose names sanitise to the same
string must not silently become one; `freeAssetName` already mints a free name for a taken
one, and it runs on the sanitised name so that the collision it is deciding about is the
real one.

**`isUnsafeName` stops being a silent skip.** A name that cannot be made safe is a refusal
the caller is told about. Today the bytes vanish and the write reports success, which is the
failure mode that costs the most to diagnose.

## 4. What this does not touch

The material ticket keeps the client's original filename — that is what the client called it
and what the Library shows them. What changes is the name the *site asset* is stored under.
`material.ts`'s own MIME map is deliberately separate ("not a general MIME database", for
what the ingestion steps can read) and stays separate.

Existing assets are not renamed by deploying this. The XGD file is corrected by hand,
outside this ticket.

## 5. Acceptance criteria

1. A PDF placed on a site is stored and served as `application/pdf`.
2. There is one extension-to-type table with one reader. Asserted by a test that fails if a
   second table is introduced, rather than by a test that compares two.
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
    never silently dropped by a write that reports success.
11. An asset already stored under an awkward name goes on resolving until it is renamed:
    deploying this breaks no live reference.
