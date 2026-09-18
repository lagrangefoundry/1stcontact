---
uid: bug-3d1ee8ac
id: BUG-118
type: bug
title: A generated picture's result never says where it went, so the assistant reports
  itself blind
created_by: EPIC-19
created_at: '2026-09-18T21:46:39.302408+00:00'
updated_at: '2026-09-18T22:46:22.595021+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-1dcb78db
---

Parent: [[EPIC-19]]. Reported by the builder assistant in conversation on
2026-09-18; it had no way to file it itself ([[REQ-273]]).

## What happened

> Earlier I told you flatly that I couldn't see the image I'd generated. That was
> wrong — it was in the Library the whole time, and `screenshot` reads Library
> names directly. I'd checked the site's files, found nothing, and concluded I
> was blind.

The assistant generated a picture, looked for it in the site's assets, did not
find it, and told the client it could not see its own work. It could. The cost
was the operator's time and a false statement to the person being advised.

## This is not a missing grant

The consultant does have the Library. `librarySurfaceFor` is composed in
`host-core.ts:982` with `libraryInstanceConfig()` travelling beside it, so
`list_library`, `get_library_item` and `place_on_site` are all present.

Nor is the design undocumented. `library-surface.json`'s overview explains this
exact trap, in these words:

> **Being on the site is a field on a catalogue item, not a different place to
> look.** […] Do not think of these as two stores; think of one catalogue with a
> mark on some of its entries.
>
> **This is not the same list as `list_assets`, and the difference is real.**
> `list_assets` answers *what can this site reference today* […] This answers
> *what has the client given us*.
>
> **Look before you ask.** You can see every picture in here — `screenshot` takes
> the name this catalogue gives you, unchanged.

Every sentence needed to avoid this is already written. The assistant did not
read it.

## Why it did not read it — the actual defect

The priming tells the assistant what it will be given, and it is accurate:

> You are given a short guide to your tools: what they are grouped under and one
> line each. That is enough to choose with and not always enough to call with, so
> when the one line leaves you guessing at what a tool takes or what comes back,
> ask for its full entry before you call it rather than after it fails.

So the **overview above is not in the default projection.** At the moment of
choosing, the assistant sees one line per tool. And the one lines do not
disambiguate — `list_library` reads "See what the client has given you — their
files and your generated pictures", which is only distinguishable from
`list_assets` if you already know the distinction the overview draws.

Worse, the rule the priming gives for when to fetch the full entry does not fire
here. It says to ask when the one line leaves you guessing **what a tool takes or
what comes back**. This assistant was not guessing about arguments or returns —
it was confident, and wrong, about *where a thing it had just made had gone*. No
stated condition told it to look further.

**And the generation result never says.** `create_image` returns the
`generated_image` shape (`imagegen_surface.json`): `ticket`, `attachment`,
`filename`, `content_type`, `size`, `aspect_ratio`, `tier`, `width`, `height`,
`remaining`. It names a ticket id and a filename. **Nothing in it says the
picture is in the client's Library, and nothing says that `filename` is the name
`screenshot` will accept.** The one moment where the assistant is guaranteed to
be paying attention — the instant its own picture comes back — is the moment the
system says nothing about where the picture went.

## What this ticket wants

The assistant should never be able to reach the belief "I cannot see the picture
I just made". Three places could each prevent it, and the cheapest is the last:

1. **Say it in the result.** A generated picture's result should name where it
   landed and how to look at it. This is the highest-value change and the
   smallest: it arrives unprompted, at the exact moment it is needed, and needs
   no rule to fire.
2. **Disambiguate at the point of choice.** `list_assets` and `list_library`'s
   one-line summaries should each name the other, so the distinction survives
   into the projection the assistant actually reads.
3. **Widen the priming's rule for fetching a full entry.** "What it takes or what
   comes back" is too narrow. A tool whose one line leaves you unsure *where a
   thing lives* deserves the same treatment.

## Do not fix it by removing the distinction

The two stores are a real and correct distinction — what the client gave us
versus what this site can reference today — and `place_on_site` is the honest
bridge between them. This ticket is about making the distinction legible at the
moments it matters, not about collapsing it.

## Note on scope

(1) is upstream, in `@lagrangefoundry/ai-imagegen`'s declared `generated_image`
shape — though this project could add the sentence in the host's own result
framing if that is faster. (2) is `library-surface.json` and the L1 surface's
`list_assets` entry, both ours. (3) is `priming.json`, ours.