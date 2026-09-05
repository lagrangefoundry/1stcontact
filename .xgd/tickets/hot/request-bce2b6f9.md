---
uid: request-bce2b6f9
id: REQ-193
type: request
title: A person's name is a table, and every part of it is optional
created_by: xgd
created_at: '2026-09-05T21:48:44.015345+00:00'
updated_at: '2026-09-05T21:48:44.015345+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
---

# A person's name is a table, and every part of it is optional

Part of the schema rebaseline. [[REQ-190]] owns the keys and the single baseline
migration; [[REQ-191]] does the same for addresses. This ticket owns names. They
land together — see *Sequencing*. [[CHAT-38]] is the conversation behind all three.

The product is called 1st Contact. If it cannot hold a person's name correctly it
is broken at the first thing it does.

## The defect

`users.display_name TEXT` — one nullable free-text column, writable by nobody
([[REQ-183]] §5), empty for every row, and rendered by [[REQ-189]] as a blank
cell. There is no given name to sort a list by, no honorific to open a letter
with, and no record that a name ever changed.

## Names are temporal; addresses are plural

Both become tables and the tables look alike, which is exactly why the difference
is worth stating: they are not multi-valued along the same axis.

| | many at once? | history matters? |
| --- | --- | --- |
| name | **no — exactly one** | yes |
| address ([[REQ-191]]) | yes | yes |
| phone | yes | yes |

So the name table has no `is_primary`, and the partial unique index that enforces
*one primary address* enforces *one current name* instead — `CREATE UNIQUE INDEX
… ON user_names (user_id) WHERE superseded_at IS NULL`. Same pattern, same
enforcement by constraint rather than by code, one axis removed.

**"Legal name" versus "what they go by" is not a second row.** It looks like
concurrent multiplicity and it is not: you always know which of the two you want,
so it is two columns. A `kind` column that only ever holds one of two values and
is always filtered to a specific one is a table pretending to be columns.

## The shape

```
user_names
  id                 TEXT PRIMARY KEY   -- opaque random ([[REQ-190]])
  user_id            -> users(id)
  display_name       TEXT NOT NULL      -- authored; what you show
  known_as           TEXT               -- "Hi ___,"
  title              TEXT               -- honorific prefix, free text
  given_name         TEXT
  middle_names       TEXT
  family_name        TEXT
  suffix             TEXT
  created_at         TEXT NOT NULL
  updated_at         TEXT NOT NULL
  superseded_at      TEXT               -- null while current
  superseded_reason  TEXT               -- 'corrected' | 'changed'
```

`users.display_name` is dropped.

### Display is stored, never computed

`display_name` is free text that the person or the operator authored, and it is
the only `NOT NULL` field here. Everything else is a parse of it, kept for
salutation and sorting, and allowed to be empty.

Rendering a name by concatenating parts is where the internationalisation horror
stories actually come from: mononyms (Prince, Sukarno), family-name-first
cultures, Spanish double surnames, patronymics. Storing what to show is correct
for all of them without one line of cultural logic — and it is the reason this
ticket can stop at seven parts instead of modelling the world.

**Nothing else is `NOT NULL`, and that is load-bearing.** A required
`family_name` makes a mononym unrepresentable.

### The parts, and why these

- **`middle_names`, not a middle initial.** An initial costs the same bytes and
  carries strictly less information: `M.` derives from `Michael`, never the
  reverse.
- **`suffix` is free text**, which dissolves the *do we need 2nd, 3rd, 4th?*
  question — `III` is common in the US and costs nothing. The same field carries
  post-nominals (`PhD`, `MBE`, `RN`). What it must never become is an enum of
  `{Jr, Sr}`.
- **`title` is free text and never required.** UK customers want `Dr`, `Rev`,
  `Cpt`, `Prof`, `Rt Hon`, and no enum survives them. It gets no `Mr/Mrs/Ms`
  picker, because that asks a customer for gender and marital status the product
  has no purpose for — unnecessary data under UK and EU minimisation, and the
  classic way to give offence at first contact. `known_as` means a greeting never
  needs a title.
- **`known_as` is the highest-frequency read in the record.** For a product whose
  job is contacting people, *what do I put in the greeting* is asked more often
  than anything else here, and it derives from the parts badly — Robert gets
  "Hi Robert," when everyone alive calls him Bob. Falls back to `given_name`,
  then to `display_name`. It also absorbs the preferred-name case above, which is
  why there is no separate legal-versus-preferred distinction to model.
- **No `sort_name`.** Sort on `COALESCE(family_name, display_name)` and accept
  that it is imperfect for *van der Berg*. A third representation of the same
  fact is a third thing nobody maintains.

## History is searchable, which is why it is a table

The operator needs to find a person by the name they used to have — *Sarah Jones;
oh, she is Sarah Patel now*. An audit log is not indexed for that, so name
history is data rather than a trail.

**But retained history is not uniformly safe to surface**, and two supersessions
that look identical in the schema are completely different facts:

- **`corrected`** — the old value was never right. A typo, an autocorrect,
  `Marting`. Kept for audit; never searched, never displayed.
- **`changed`** — a genuine former name. Searchable, and displayable as
  *formerly*.

Getting this wrong in the safe direction leaves a stale typo out of search
results. Getting it wrong in the other direction surfaces a deadname, or greets a
customer by a name they deliberately left behind. That is not a small failure,
and it is why the column exists before anything reads it.

**`corrected` is the default.** Corrections are common and accidental; name
changes are rare and deliberate. Marking a supersession as a real name change is
an explicit act, so the common case and the safe case are the same case.

A name row must also be redactable — the text removed, the row and its timeline
intact — because the erasure obligation ([[DOC-37]]) reaches names.

## Who fills these in

The **operator** — the small business owner — is the curator, and these fields
are designed for them. They are the one who corrects a misspelled contact, who
knows that Robert is Bob, who knows this customer is a Dr. They will do it
because they care about their own contacts, and the job of this schema is to give
that care somewhere to land.

The **contact's own self-declaration is simpler** and will not fill most of this
in. That is why every field but `display_name` is optional, and why capture and
curation are different surfaces with different field sets. Which fields a
self-service form asks for is a separate design; this ticket only guarantees that
answering *just my name* is a complete answer.

## What has to be rewired

- **`peopleOf` / `personDetail`** read the current name through the join rather
  than `users.display_name`.
- **[[REQ-189]]** is `ready_to_reconcile` and renders `users.display_name` in the
  Users list. That column is going away, so this ticket carries the read-path
  update or the list silently shows blanks.
- **One resolver, not a predicate at every call site.** `superseded_at IS NULL`
  is a filter somebody eventually forgets. Reads go through a single accessor —
  the same discipline [[REQ-191]] applies to `findUser`.

## The cost this leaves in place

Names hang off `users`, which is tenant-scoped, so Bob-of-Alice's-Plumbing and
Bob-of-1st-Contact hold different name rows. A marriage means the name is updated
once per business that knows him. That follows from [[DOC-42]] §1 and [[CHAT-36]]
and is not a defect, but it is a real operational cost and it should be written
down before someone meets it in the wild.

## Sequencing

`user_names` is created **in [[REQ-190]]'s baseline**, not by a migration after
it. Separable in review and in acceptance, not in deployment — same as
[[REQ-191]].

## Acceptance

- a person with one name — no given name, no family name, no title — is
  representable and renders correctly
- the displayed name is stored, never assembled from parts
- exactly one name row per person is current, enforced by a partial unique index
  rather than by application code
- changing a person's name changes no key and no foreign key
- a former name marked `changed` is found by search; one marked `corrected` is
  not, and neither is displayed as *formerly*
- a supersession recorded with no reason is treated as `corrected`
- `users.display_name` is gone and every reader goes through the name table
- the Users list and detail panel show a name where one exists, and read as *no
  name yet* where one does not
