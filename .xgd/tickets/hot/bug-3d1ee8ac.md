---
uid: bug-3d1ee8ac
id: BUG-118
type: bug
title: A generated picture's result never says where it went, so the assistant reports
  itself blind
created_by: EPIC-19
created_at: '2026-09-18T21:46:39.302408+00:00'
updated_at: '2026-09-18T22:59:51.933591+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-1dcb78db
  story_points: 3
  commits:
  - working_sha: da74d4962a02301f79e73d68c1a23adfccc8c579
    reconcile_sha: null
    main_sha: null
  - working_sha: 7bd2a279a2c61b56e4873f144c11cce26d543817
    reconcile_sha: null
    main_sha: null
  version: 0.2.266
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

---

# What was implemented

## One correction to the diagnosis above, and it is asserted not argued

**The Library's overview IS in the projection the assistant reads.** The section
"Why it did not read it" says the overview "is not in the default projection".
That is wrong. The framework's manual renderer keeps a surface's overview *whole*
at both levels and drops only the per-operation reference —
`@lagrangefoundry/ai/src/toolbox/manual.js`, `surfaceBlock`: *"The overview is
kept whole at both levels. Rendering only its first paragraph was measured and
rejected"* — and `roles.ts` renders priming's tool guide as
`box.manual({ level: 'summary' })`. So the paragraph that names this exact trap
was in front of the assistant for the whole session.

The gap was therefore never that the paragraph was withheld. It was that the
paragraph sits above a list of one-liners which did not carry the distinction
themselves, and that **nothing at all said where a newly made picture had gone**.
Both of those are what changed. The correction is pinned by a UAT
(`..._the_librarys_overview_is_in_the_projection_the_session_reads`) so that a
future reader cannot "fix" this bug again by promoting an overview into a
projection it is already in.

## 1. The result of making a picture says where the picture went

`apps/control-app/src/imagegen.ts`, `generatedDisplay`. The result now reads:

> This picture is in the client's Library now, catalogued as `material-…` —
> `screenshot` takes that name unchanged, so you can look at what you made, and
> it is on the site only once you place it there. Show this picture to the person
> you are talking to by including this line in your reply, exactly as written: …

Three decisions inside that:

- **Host-side, through the `display` seam, not upstream.** The ticket offers both.
  The plugin's `generated_image` is the framework's shape, shared by every
  adopter; *which of this deployment's two stores holds the bytes* is not a fact
  the plugin can know — `store` is the host's, `origin: 'generated'` is the
  host's vocabulary, and the Library is the host's surface. `host_display` is the
  seam lagrange-framework REQ-149 opened for exactly this class of sentence, so
  nothing upstream changes.
- **It names the *uid*, not the filename.** The catalogue's canonical name for a
  piece of material is its record's uid (`storedImageOf` in `material.ts`;
  `resolveStoredImage` is the one rule), so the uid is the spelling that always
  means exactly one picture — a filename is an alias and two uploads may share
  one. It is also already in the record as `ticket`, so the sentence teaches that
  the handle the model is already holding IS the name every way of looking at a
  picture takes. That is precisely the link the ticket says is missing.
- **It rides on the same condition the display line does, and that is a
  deliberate residual.** The plugin composes the `display` field into the
  declaration only where a host supplied a handle, so a deployment with nowhere
  to show a picture is told nothing about where the picture went either.
  `router.ts` is the only caller and always supplies `materialUrl`, so no shipped
  session reads the poorer result. Making the field unconditional was considered
  and rejected: it would make the manual describe a display line that never
  arrives, and it would supersede [[REQ-217]]'s standing AC that *nowhere to show
  it means no line*. Recorded here rather than silently absorbed.

## 2. The two listings disambiguate at the point of choice

The one-liner is the whole of what a session reads when it is *choosing* a tool,
so each of the two now carries the distinction rather than relying on a
paragraph further up:

- `list_library` (`library-surface.json`): "The client's whole catalogue — every
  file they have given you and every picture you have generated, whether it is on
  the site or not. Not the same list as `list_assets`, which is only what the site
  itself can reference."
- `list_assets` (`l1-surface.json`): "The images and fonts this site can
  reference today — all of them. Not everything the client has given you: a file
  they uploaded, or a picture you generated, is in this list only once it has
  been placed on the site."

**Only one of the two names the other by tool name, deliberately.** The ticket
asks for both. `list_library` names `list_assets`, which is safe: the Library
surface is only ever composed alongside L1. The reverse is not safe — L1 is the
base surface and is composed by hosts that have no Library at all (the `1c` CLI
has no ticket store, so `host-core.ts` composes the catalogue not at all, by
design). A one-liner in `l1-surface.json` naming `list_library` would put a tool
name no such session has been granted into its manual, which is the failure the
framework's own `manualLeaks` lint exists to catch within a declaration. So the
L1 side names the *distinction* — placed on the site versus given to us — and no
tool. The distinction is what the assistant needed; the tool name was the means.

## 3. The priming's rule is widened, and the belief itself is forbidden

`priming.json`, the `product-system` entry's "How to work". The fetch-a-fuller-
entry rule now fires on *where a thing lives*, and on two one-liners that sound
like the same list. A second paragraph closes the class rather than the instance:

> Never report yourself unable — to see something, to find something, to do
> something — on the strength of one tool answering nothing. Something you have
> just made is somewhere, and whatever made it told you where in its own result,
> so go back and read that result before you conclude anything. Telling your
> client you cannot see your own work when you can costs them their trust in
> everything else you tell them.

That paragraph is the only guard that still holds the day a third store appears
and nobody has written its one-liner yet.

## Test plan

`tests/test_UAT_FC_BUG-118_a_generated_picture_says_where_it_went.workers.test.ts`
— the real plugin wired the way `router.ts` wires it, over real D1 and R2, with
only the image provider's HTTP endpoint substituted. It generates a picture,
reads the sentence, **takes the name out of the sentence as written** rather than
off the record, and resolves it through `get_library_item` on the real catalogue
surface — so the evidence is that what the result says is *true*, not that a
string contains a word. It also asserts `placed_on` is empty, which is what makes
"it is on the site only once you place it there" a fact about the record.

`tests/test_UAT_FC_BUG-118_where_a_picture_lives.test.ts` — renders the tool guide
a consultant is actually primed with (`manual({ level: 'summary' })`, from a real
Toolbox with the Library surface composed as `host-core.ts` composes it) and
asserts the two one-liners each carry the distinction; asserts the Library
overview is present in that same projection (the correction above) while the
reference half is not; and asserts both halves of the widened priming rule,
including that the old narrow wording is gone.

Regression scope run green: the picture/priming/surface suites
(`REQ-217`, `REQ-208`, `REQ-228` ×2, `REQ-171`, `REQ-182`, `BUG-63`, `BUG-65`,
`REQ-126`, `REQ-174`, `REQ-237`, `REQ-264`, the three
`reconciliation-assistant-*`), plus `tsc --noEmit` over `apps/control-app` and
`tools/generate`.