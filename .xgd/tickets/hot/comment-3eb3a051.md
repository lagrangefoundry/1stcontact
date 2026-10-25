---
uid: comment-3eb3a051
id: COMMENT-2886
type: comment
title: Comment on chat CHAT-52
created_by: xgd
created_at: '2026-09-13T20:26:15.976216+00:00'
updated_at: '2026-09-13T20:28:29.010312+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-401ccb4d
  kind: chat_transcript
---

<!-- xgd-turn id="d308f08d-08ec-4fe7-a3f2-72f7f4ac5a48-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T20:26:03.983616+00:00" -->
#### You
We have some public-facing names that like 1stc.site that cannot contain vulgarity - is there a well-known list of exclusions to prevent such things

Note: other aspects of site naming we should consider for the same treatment - tricky line we cannot prevent users from having curse words on their own websites...anyway lets start with the simple

<!-- xgd-turn id="d308f08d-08ec-4fe7-a3f2-72f7f4ac5a48-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T20:28:28.674747+00:00" -->
#### Claude
I'll check what's already decided about site naming before answering — there's a doc on exactly this.

Yes — there are standard lists, and one of them is the right answer. But the naming surface here has a specific trap that makes the list choice the *second* decision, not the first.

## The lists

| List | What it is | Fit |
|---|---|---|
| **LDNOOBW** — *List of Dirty, Naughty, Obscene and Otherwise Bad Words* ([github.com/LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words)) | Shutterstock's list, ~28 languages, one word per line. The de-facto standard corpus. npm as `naughty-words`. | The corpus, if we go multi-language |
| **`obscenity`** (jo3-l, MIT, TS, zero-dep) | Not a list — a *matcher*. Leetspeak/substitution-resistant, and ships a **false-positive whitelist**. | The matcher. Works in Workers. |
| **Google banned words** (RobertJGabriel) | ~450 words, basis of the naive `bad-words` package | Superseded |
| **`bad-words`, `leo-profanity`** | Naive substring matching | **Avoid** — see below |
| **The Big Username Blocklist** (marteinn, MIT) | ~4000 reserved *technical* names: `admin`, `api`, `billing`, `abuse`, `_dmarc`, `security`… | This is DOC-45 §7's "and the rest of that family", already written |

## The trap, which is specific to us

DOC-45 §7 says the platform label is **assigned at provision from a slugified business name**. So the filter fires on a name we generated from the customer's own business, at the moment they first meet the product.

Substring matching against real UK businesses: **Scunthorpe**, **Penistone**, **Cockburn**, **Dickinson**, **Lightwater**, **Wang**, **Shitake**, **therapist**, **assign**, **analysis**. These aren't hypothetical edge cases; they're customers.

And the two error costs are wildly asymmetric:

- **False positive** — we refuse to provision Penistone Plumbing, and the first thing the product ever says to them is an insult. Unrecoverable.
- **False negative** — a rude label is live under our apex for a few hours. And DOC-45 §5 already made this *free to fix*: `host` is an attribute with a unique index precisely so it can change without rewriting anything.

So the asymmetry points at a two-tier design, not a better list:

**Hard block** — exact match only, no substring, on a small hand-curated set (slurs and the genuinely unambiguous). Minimal normalization: casefold, collapse repeats. Refuse, ask for another.

**Soft flag** — substring + leetspeak + confusable folding, using `obscenity`. Provision anyway, queue for review. Aggressive normalization is safe here because the consequence is a look, not a refusal.

Normalization notes: NFKC + confusable folding (Cyrillic `а`, Greek `ο`) matters for deliberate evasion; leet folding (`4→a`, `1→i`, `$→s`) for the obvious; and **hyphen-stripping belongs only in the flag tier**, because it manufactures false positives (`mass-age`, `express-analytics`).

## Where else this applies

The line you're worried about resolves on *whose namespace it is* — not on whose speech it is. We're not policing their language; we're declining to put a label in our own apex, our TLS certificate-transparency records, and our support inbox.

| Surface | Namespace | Treatment |
|---|---|---|
| Platform label (`alice.1stc.site`) | **ours** | hard block + flag |
| Custom domain (`alicesplumbing.com`) | theirs, DNS-enforced | **none** — AUP + takedown, never a validator |
| Page slugs (`/about`) | theirs, but under our apex until form D | flag only |
| `sites.name` (builder list label) | private to the operator | none |
| Page copy, business name | theirs | none — AUP |
| **Share-link token (DOC-45 §2 form B)** | minted by us | **generated to be incapable of it** |

That last row is the easily-missed one. Any random token over a full alphanumeric alphabet will eventually spell something, and it'll be on a link the operator sends to their client. Standard fix: a vowel-free alphabet (Crockford base32 minus vowels) — no vowels, no words, and it drops `I`/`L`/`O`/`U` confusables for free.

## Recommendation

`obscenity` for the flag tier, The Big Username Blocklist for the reserved-technical family (which DOC-45 §7 already committed to and hasn't specified), a short hand-written hard list, and a vowel-free token alphabet. LDNOOBW only if we go beyond English.

And the thing to say out loud in whatever we write down: **the list is not the boundary.** No list is complete, and the durable control is the cheap rename that §5 already bought us, plus a report route. A filter that pretends to be a boundary is worse than one that's honestly a speed bump.

Want me to fold this into DOC-45 as a new section (it's naturally §7's continuation), or file it as its own doc/request?

<!-- xgd-chat-end -->