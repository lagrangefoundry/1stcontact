---
uid: comment-761b2db1
id: COMMENT-2283
type: comment
title: Comment on chat CHAT-38
created_by: xgd
created_at: '2026-09-05T21:21:03.349099+00:00'
updated_at: '2026-09-05T21:24:56.542684+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-8529c537
  kind: chat_transcript
---

<!-- xgd-turn id="eb39b545-a64a-4ac1-ad36-7c86c51bc230-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T21:20:53.464054+00:00" -->
#### You
The product is called 1st contact our representation of contacts is CRITICAL. Right now our schema is very amateur. Lets take a moment to discuss.

I just proposed some changes to the representation of email see the last turn or two on the "Login" chat.

Lets talk about Name we will also need addresses and phone numbers - not short term but lets think ahead

Immediate converstion:

Representation of names I know this is a super complicated topic when you get into the full internationalization and all the variance. I have read some very interesting blog posts about the corner cases and representing names. However, I want to hit a happy medium I do not want to over design this. I think we should at least have first name and last name, we should probably have title and suffix (title is not used much in the US but it is common in the UK were some of our customers are, we need titles like Dr, Cpt, Rev etc). For the US we need suffixed (Jnr, Snr - do we need 2nd, 3rd, 4th?). Do we need middle initial too? 

People's names change, the data model needs to accommodate - we should store old and new - so name is a table like email

<!-- xgd-turn id="eb39b545-a64a-4ac1-ad36-7c86c51bc230-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T21:24:55.970417+00:00" -->
#### Claude
Read the Login-chat tail and REQ-190. Here's where I land.

## Name is not shaped like email, and the difference is the whole design

Your instinct — "name is a table like email" — is right, but for a different reason than email's, and conflating the two is how you get "which name is current?" bugs at call sites.

|  | many at once? | history matters? |
|---|---|---|
| **name** | **no — always exactly one** | yes |
| email | yes | yes (inbound from an old address must still resolve) |
| phone | yes | yes |
| address | yes | yes |

Email is multi-valued *now*. Name is multi-valued *over time only*. They both become tables, and — this is the useful bit — **the same partial unique index does both jobs**: `WHERE is_primary = 1` for email is `WHERE superseded_at IS NULL` for name. One pattern, four tables, name as the degenerate case where the set is always size one.

The "legal name vs what they go by" case is the one thing that looks like concurrent multiplicity. It isn't: you always know which of the two you want, so it's two columns, not two rows. A `kind` column that only ever holds one of two values and is always filtered to a specific one is a table pretending to be columns.

## The field that makes the rest safe

The single most important field is a free-text **authored** name — what the person typed, what you display. The structured parts are a parse of it, used for salutation and sorting, and are allowed to be empty.

**Display is stored, never computed.** Concatenating parts to render a name is where the internationalisation horror stories actually come from — mononyms (Prince, Sukarno), family-name-first cultures, Spanish double surnames, patronymics. Store what to show and you're correct for all of them without a single line of cultural logic. Nothing but `display_name` is `NOT NULL`.

## The parts, and your specific questions

```
user_names
  id                 opaque random     -- per §3 of REQ-190
  user_id            -> users(id)
  display_name       TEXT NOT NULL     -- authored. what you show.
  known_as           TEXT              -- "Hi ___,"
  title              TEXT              -- honorific prefix, free text
  given_name         TEXT
  middle_names       TEXT
  family_name        TEXT
  suffix             TEXT
  created_at         TEXT NOT NULL
  superseded_at      TEXT
  superseded_reason  TEXT              -- see below
```

- **Middle initial — store middle *names*, free text.** An initial costs the same bytes and is strictly less information; you can always derive `M.` from `Michael`, never the reverse.
- **2nd/3rd/4th — yes, and the question dissolves** because `suffix` is free text. `III` is genuinely common in the US. What you must not do is make it an enum of `{Jr, Sr}`. Same field carries post-nominals (`PhD`, `MBE`, `RN`) — arguably a different kind of thing, but one free-text field is the happy medium for a small-business CRM.
- **`known_as` earns its place more than anything else here.** For a product called 1st Contact, "what do I put in the greeting" is the highest-frequency read in the record, and it's derivable from parts *badly* (Robert → "Hi Robert," when everyone calls him Bob) and authorable *well*. Falls back to `given_name`, then `display_name`. It also absorbs the preferred-name case above, so one field solves two problems.
- **No `sort_name` column.** Sort by `COALESCE(family_name, display_name)` and accept it's imperfect for "van der Berg". A third representation of the same fact is a third thing nobody maintains.

## Title: one warning

Keep it free text and never required, and be careful about ever offering a picker. `Mr/Mrs/Ms` asks for gender and marital status — under UK/EU minimisation that's data you have no purpose for, and it's the classic way to offend a customer on first contact. `known_as` means you don't need a title to write a greeting, which removes the only reason to make it prominent. Dr/Rev/Cpt/Prof/Rt Hon are the ones your UK customers actually want, and they're all free text anyway.

## History is data, not an audit log — but it is not uniformly safe to keep

Two reasons it's a real indexed table rather than an audit trail: you need to **find** people by their former name ("Sarah Jones — oh, she's Sarah Patel now"), and an audit log won't be indexed for that.

But blanket retention is wrong, and this is the part I'd push hardest on. Two supersessions look identical in the schema and are completely different facts:

- **`corrected`** — the old value was never right. Typo, autocorrect, `Marting`. Keep it for audit; never search it, never display it.
- **`changed`** — a genuine former name. Searchable, displayable as "formerly".

Get this wrong in the safe direction and you have a stale typo in search results. Get it wrong in the unsafe direction and you surface a deadname, or greet a customer by a name they changed deliberately. That's not a small failure, and it's also an erasure hook ([[DOC-37]]) — a name row must be redactable with the timeline left intact.

So: **`corrected` is the default**, and marking a supersession as a real name change is an explicit act. Corrections are common and accidental; name changes are rare and deliberate — the default should match the common case *and* be the safe one, and here those agree.

## Looking ahead — phone and address, so this doesn't need revisiting

**Phone is email.** Same table, same invariants. Store E.164 normalised alongside the authored form (same reasoning as your casefolding decision — the constraint should enforce what the convention intends). `kind` matters here in a way it doesn't for email, because SMS only reaches a mobile — that's a capability distinction, not decoration.

**Address is not a channel and should not be structured yet.** Authored multi-line block, plus exactly two structured fields: `country` (ISO-3166-1 alpha-2) and `postcode`. Country because [[DOC-34]] makes it the single input to locale, currency, timezone and legal obligation. Postcode because it's the one part that gets validated and queried. Street/city/region are display-only and structuring them buys nothing until you're doing tax or shipping by region — at which point you'll know what shape you actually need.

**Resist the one-table generalisation.** A single `contact_channels` with a `kind` covering email/phone/address is tempting and wrong: email and phone are a normalised routing string with a meaningful uniqueness constraint; an address is a compound with none. Keep the *pattern* uniform — opaque key, FK by key, `is_primary`, `superseded_at`, invariant enforced by partial unique index — and let the tables differ.

## Two consequences worth naming

**These hang off `users`, which is tenant-scoped.** So Bob-of-Alice's-Plumbing has a different name row from Bob-of-1st-Contact, and a marriage means updating the name once per business that knows him. Unavoidable given [[DOC-42]] §1, and correct, but it's a real operational cost that will surprise someone later.

**REQ-189 is already `ready_to_reconcile` and renders `users.display_name`.** If name moves to a table, that read path becomes a join — REQ-190 has to carry the update or the Users tab silently shows blanks.

## Also spotted

REQ-190 §4's `user_emails` snippet still says `id INTEGER PRIMARY KEY`, which contradicts §3's opaque-random decision. Editorial leftover from the earlier draft.

---

**My recommendation: fold names into REQ-190 rather than a second ticket.** It's the same rebaseline event. Doing names afterwards means either a second wipe or exactly the create-copy-drop-rename dance the rebaseline exists to avoid.

Three calls I need from you:

1. **Fold in, or separate ticket?** (I'd fold — and while we're there, fold phone in too, since §5 already leaves it dangling as "a decision rather than an oversight" and the answer is now obvious.)
2. **`known_as` — in or out?** It's the one field I'm recommending beyond your list.
3. **`corrected` vs `changed`** — do you want the disposition column, or is "keep everything, search everything" acceptable for now?

<!-- xgd-chat-end -->