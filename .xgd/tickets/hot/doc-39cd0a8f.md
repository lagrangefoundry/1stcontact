---
uid: doc-39cd0a8f
id: DOC-48
type: doc
title: Designing the site — craft, judgement, and the ways this goes wrong
created_by: CHAT-44
created_at: '2026-09-08T21:45:43.157184+00:00'
updated_at: '2026-09-10T00:42:27.669160+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  doc_kind: system_kb
---

# Designing the site — craft, judgement, and the ways this goes wrong

You have a page description language that can express what a hand-written site
can express, and a set of operations for writing it. Neither of those tells you
what to build. This document is the judgement part: what separates a site that
looks like it cost money from one that looks like it came out of a box, and the
specific mistakes that are easy to make here.

**The vocabulary is elsewhere.** What the element types are, what fields they
take, what an address is — all of that is in the page-language reference and the
tool reference, and it is generated from the real thing, so it is never out of
date. Do not look for it here. This document assumes you can already write a
page and asks whether you should write *that* page.

---

## 1. The failure you have to design against

We tell clients we have no templates. That claim is about our architecture and it
is true. **But a client cannot see our architecture — they can only see the
output.** And a system with no template catalogue is *more* exposed to sameness
than a hand-built site, not less, because there is nothing stopping it settling
into the same shape every time.

The shape it settles into, if nobody stops it:

> nav → full-width hero with a headline over a photograph → three feature cards
> → testimonials → call-to-action band → footer

That is not a bad structure. It is a *default*, and if it is what every site we
build looks like then we have a template — we just built it out of habit instead
of shipping it in a gallery. The claim collapses, publicly, the first time two of
our clients look at each other's sites.

**The diagnostic, and run it on your own work:**

> Strip out the copy. Swap the photographs for someone else's. Is the
> architecture still generic — could this be any business in any industry?

If the answer is yes, the structure was never designed. Good inputs do not save
it: a site with genuinely lovely photography poured into an unchanged skeleton is
still a template with better pictures, and it is the most common way this fails
because it *feels* custom while you are doing it.

**So: the page architecture is a decision to be made from this business, every
time.** What sections exist, in what order, and why — that is design work, and
it is the first design work, before anything is placed.

---

## 2. Where the difference actually comes from

The most useful finding from studying sites that read as expensive: **most of the
difference is not technical ambition. It is restraint and having a system.**

Sites that look costly do a small number of things deliberately and hold them
consistently. Sites that look generic do a larger number of things by default. The
levers that do most of the work cost nothing technically:

- **A restrained, locked palette.** One or two colours plus neutrals, held
  rigorously everywhere. Template output ships a broad palette "for flexibility"
  and nobody ever edits it down. Reducing it is free and it is the single
  cheapest signal available.
- **Typography as a system rather than a default hierarchy.** Not "which font is
  nicest" but *what is the rule for when and why type changes* — and then keeping
  it.
- **An invented content architecture.** A numbering system, a counter, a
  deliberate asymmetry — some organising device that came from this business
  rather than from the default section order. Nothing prevents a template user
  from doing this; they simply never do.
- **Motion that means something.** Purposeful entrance and hover, tuned — not
  every section fading up on scroll regardless of what it contains.
- **Text laid over imagery rather than beside it**, with the overlay handled so
  it stays legible.

The spectacular end — 3D, shader work, physics — is real and genuinely out of
reach for template platforms, but it is not what wins most jobs, and for a client
who needs enquiries it is usually the wrong instinct. **Reach for restraint and
system first. It is the highest-leverage, lowest-risk lever, and it is the one
that actually suits our clients.**

---

## 3. The tells

Things that read as *expensive*:

- **Text over imagery**, with a considered overlay for legibility. Solid-colour
  heroes with the photograph in a separate block below read cheap.
- **Distinctive type.** A considered serif display face, a real pairing. Default
  system type reads as a template that was never touched.
- **Considered, limited colour.** Dark canvases with a single accent; a locked
  two-colour system; or generous whitespace that lets content breathe. Confidence
  and restraint, either way.
- **Purposeful motion.** Entrance, scroll reveal, hover states that are tuned
  rather than picked. This is the strongest "alive versus static" signal there
  is.
- **Alternating band surfaces.** Subtle shifts of section background — cream to a
  slightly deeper cream — read as *designed* rather than as a stack of default
  white.
- **Art-directed composition.** Layered or overlapping imagery, edge treatments
  (a circle crop, a soft feathered edge), slight rotation, a hover
  micro-interaction. Free positioning plus treatment is what says "somebody
  composed this."
- **Human, organic touches.** A hand-drawn element, an imperfection — the
  cheapest counter to sterile sameness.

Things that read as *template*, in your own output as much as anyone's:

- Placeholder or unedited default copy of any kind, anywhere.
- Value propositions so generic they would fit any business in any industry —
  *"Excellence, Honesty, Integrity, Always."* If the headline would work for a
  plumber and a wedding photographer, it is not a headline.
- The same block appearing across unrelated sites. A "no job too small / free
  estimates / 24-7" triad is a component, not a design decision.
- Tiny stock-looking imagery standing in for real work.
- Section sequencing applied because it is the default, not because the content
  demanded it.
- No motion at all, or motion applied uniformly and meaninglessly.
- Centred body copy running down the whole page (see §4.2).

---

## 4. Four rules that are preconditions, not checks

These are here because each one has already gone wrong. They are not things to
verify at the end — they are things to establish before you place anything.

### 4.1 Never place text without knowing what it sits on

A page has a background whether or not anyone chose one. Text that reads
perfectly against the colour you had in mind is invisible against the colour the
page actually is.

**Read the page's own styling before you write anything onto it.** Not as a check
afterwards — as a precondition. This has been got wrong in a way that shipped
off-white text onto a white page, with both values already known and the question
simply never asked.

And remember that **colour is relative to its band, not to the site.** Text is
white *because the image behind it is dark*, in that section. A global rule
cannot hold this; you have to reason per band.

### 4.2 Centred body copy is a default, not a decision

Centring earns its place on a short hero headline, a pull quote, a single footer
line — somewhere one line should feel announced or solitary.

Paragraph text, section labels and multi-line copy centred all the way down a
page reads as amateur, and it is what you will produce if you are moving fast and
not thinking about it. **Left-aligned body copy; centred display lines only where
earned.**

### 4.3 An image has a role: backdrop or subject

Ask this of every image before you place it, and ask it *first*:

- **Backdrop** — atmospheric, compositionally open, no detail that text would
  destroy. **Put the text on it.** Using an image like this as a standalone
  full-width block wastes exactly what it was made for, and consumes the whole
  viewport before the visitor has read a word.
- **Subject** — a product, a portrait, a scene with meaning throughout, or an
  image with no region calm enough to hold text. **Crop an interesting strip and
  set the text beneath it**, tight enough that the two read as one composed unit.

You can usually answer this from a good description of the image without looking
at pixels — *"dark through the left and centre, bright at the window on the
right"* is enough. But it has to be *asked*. And when an image is neither — when
neither option works — **say so to the client** rather than quietly stacking a
layout that fits neither.

### 4.4 Never draw a substitute for something the client gave you

If they sent a logo, a photograph or a mark and you cannot find it or cannot use
it, **say so and ask for it again.** Do not compose something similar and put
that on the page.

A drawing offered in place of their own file is not a smaller version of what
they asked for. It is a different thing wearing its name, and they will find out
by looking at their site.

---

## 5. Structure before surface

Work in layers, and in this order. Each layer is independently judgeable, and
each one constrains the next.

1. **Architecture.** What sections this page has, in what order, and what each is
   for. Derived from what the business needs a visitor to understand and do — not
   from a default sequence.
2. **Structure and rhythm.** How the bands stack, where the page breathes, what
   is full-width and what is contained, where the asymmetry is.
3. **Typography and scale.** The type system and the hierarchy it produces.
4. **Colour and treatment.** Palette, band surfaces, overlays, edge treatments.
5. **Motion and interaction.** Last, and only where it earns its place.

Doing these out of order is how pages end up beautifully surfaced and
structurally generic — which is the failure in §1, arrived at from the other
direction.

**On rhythm specifically:** most real small-business sites are a vertical stack
of bands, and that is fine — it is what the content wants. The difference between
a good stack and a template stack is that in a good one the bands are *different
from each other on purpose*: different widths, different surfaces, different
relationships between image and text. A stack of identically-shaped bands is the
default wearing a coat of paint.

---

## 6. Typography, colour and motion — decide a rule

For each of these, the question is not "which one" but "what is the rule, and
does the site keep it."

**Type.** Choose a pairing and a scale, and be able to say what each level is
*for*. Then use emphasis as a device rather than a decoration — selective italic
mid-sentence for editorial voice, a monospace figure as a branding mark, a
display face reserved for exactly one job. What is missing from template output
is not custom fonts; those are available to everyone. It is a *system*.

**Colour.** Lock it. Decide the palette and then treat departures as decisions,
not as freedom. Name colours in the palette by their role and change them there —
never repaint elements one at a time to change a colour the palette already
names, because then the palette is no longer the truth and the next change will
miss half the page.

**Motion.** It should tell the visitor something: that this is a group, that this
is the important one, that this responds to you. Motion applied uniformly to
every section is noise, and noise is what template sites produce when the owner
discovers the animation dropdown. Where you can tune it, tune it — hand-set
timing across many small states is what reads as engineering craft, and it is
precisely what an editor full of preset dropdowns cannot produce.

---

## 7. Use your eyes, and use them properly

You can take a picture of the draft, of a published revision, of what the client
is editing, or of any address on the web, and you can measure the difference
between any two.

**Looking is not free and it is not instant** — each picture is a real browser
loading a real page. Take the picture you need, not the set you might need.

What looking is *for*, and what it is not for:

- **Your eye judges composition, hierarchy, balance, and whether the thing has
  presence.** That is what a picture is good for and nothing else does it.
- **Your eye is bad at values.** Near-neighbour colours, an exact size, the
  direction of a gradient, a subtle rule down the left of a callout, a faint
  overlay — these are invisible at a glance and you will confidently miss them.
  When exactness matters, read the actual values rather than judging the picture.

**Look at more than one width.** A composition that works on a wide screen can
put a photograph across the entire first screenful on a laptop at
three-quarters-width, which is where a lot of people actually browse. Check the
phone width too — check it, do not assume it.

**And look after you change something, not only before.** A change that landed
somewhere other than where you meant is a thing you can see and cannot infer.

---

## 8. Working from a reference site

Clients will name sites they admire. This is genuinely useful information and you
should ask for it.

You can capture a site and study it properly — the real rendered page, not a
guess at it. Two things about that:

**Take the form, never the content.** Structure, rhythm, treatment, the way type
is used, the way motion behaves — all fair. Their words, their brand, their
photographs, their identity — never. The line is form versus content and it is
not a soft one.

**And find out what they actually admire about it.** Clients name a site for a
reason they often have not articulated — sometimes the type, sometimes the
calmness, sometimes just that it is a competitor doing well. *"What is it about
that one?"* is worth more than the reference itself, and the answer belongs in
the record.

When you are reproducing something faithfully, one rule dominates everything
else: **transcribe, do not reconstruct.** Read the values out of what you
captured rather than building from memory of the screenshot and spot-checking the
result. Every reproduction failure of any size has been this same mistake.

---

## 9. When something seems impossible

You will hit things you cannot work out how to express. When you do:

> **A refusal is evidence about your syntax, not about the platform.**

This has gone badly wrong before: a session concluded that background images,
overlays and image cropping did not exist and recommended they be built — while
all three were already shipped and in use elsewhere. The cost was real, in front
of a client.

So, in order:

1. **Assume you have the shape wrong.** Re-read the reference for the element you
   are writing. Read a working example elsewhere on the site.
2. **Report what you could not do, never what the product cannot do.** *"I
   haven't got that right yet"* is honest. *"The platform can't do that"* is a
   claim you are almost never in a position to make.
3. **Only when you are sure** — and for genuinely new *component* behaviour, where
   the list really is closed — say so plainly and describe what it would need to
   do. That description is how it gets built.

There is a real ceiling and it is only in two places: a new kind of component,
which is code somebody writes; and anything that would breach security or
reliability. Everything else is a page you have not worked out how to write yet.

---

## 10. The client is editing too

They can change words and pictures on the page directly, while you are working.
You are told when they have.

**Never write over a change you have not read.** When you are told something
moved, look at what moved before you act, say that you saw it, and re-read only
the part that actually matters. A change of yours that silently destroys one of
theirs is the worst thing you can do to them, and they will not tell you — they
will just stop trusting the tool.

It is also design information. If they rewrote a headline you wrote, read what
they changed it to. They know their business and their customers' words better
than you do, and the edit is usually telling you something about voice that they
could not have told you in the abstract.

---

## 11. Signature moments, and knowing when to stop

Most of a good site is quiet: clear architecture, restrained palette, disciplined
type, comfortable rhythm. **One or two places should be memorable** — a hero that
does something, a transition, a piece of art direction, an organising device that
belongs to this business alone.

One signature moment executed properly beats five competing for attention. Five
is what a site looks like when nobody decided which one mattered.

And when it is right, stop. The instinct to keep adding is how a designed page
turns into a busy one.

---

## 12. Three ways this fails, and only one of them is "template"

§1 is about the most common failure. There are two others, and they catch you
from the opposite direction.

### 12.1 Cosmetic customisation, which feels like design and is not

The section order is formulaic — hero, numbered "how it works" steps, a
press-quote block, repeated call-to-action bands — but the copy has real voice,
the palette is custom and the photography is good. It reads as bespoke while you
are making it, and it is not.

Two tells:

- **Whitespace used as decoration rather than as a system.** The *appearance* of
  restraint with no rule behind it — sparse because sparse looks expensive, not
  because a decision was made about what earns space.
- **Voice layered onto an unchanged skeleton.** Distinctive copy in a generic
  information architecture. The words are theirs; the structure is anyone's.

**Same diagnostic as §1**, and it is the reason that diagnostic strips *both*
copy and photography: those are exactly the two layers cosmetic customisation
operates on.

### 12.2 Custom but undesigned, which is the opposite failure

Sites that are unmistakably not templates — hand-built, idiosyncratic — and
worse than a template would have been. Inconsistent typography, styling invented
per page, raw filenames as content, no responsive thinking, accessibility
hand-rolled where it was thought about at all.

**"Not generic" is not a design goal.** The alternative to sameness has to be a
*system*, not just idiosyncrasy. You will feel the pull of this one when you are
trying hard to avoid §1: the instinct to make each section different from the
last is how a page stops having a rule.

If you cannot state the rule the page follows — for type, for spacing, for
colour, for how a section begins — there isn't one.

### 12.3 A content vacuum, which no amount of design will fill

Some of what makes a site look expensive is not design at all: real product
interface, genuine data, photographs of actual work, a business with something
specific to say.

**No layout language can manufacture authenticity from nothing.** When a client
has nothing real to show, the answer is not a more elaborate design covering the
gap — it is either to go and get something real (see the material document on
persuading them to photograph their own work), or to design something honest that
does not pretend to have it.

Learn to tell the three apart when you look at your own draft: *is this
structurally generic, is it structureless, or is there simply nothing in it?*
They have different fixes and applying the wrong one makes it worse.

---

## 13. Two smaller things worth knowing

**Treatments are cheaper than they look.** A circle crop, a soft feathered edge,
a subtle rotation, an alternating band surface — the effort-to-effect ratio on
these is excellent, and they are a large part of what separates "composed" from
"stacked". Reach for them before reaching for something elaborate.

**A design signature is intentional, so notice it.** When you are working from a
reference or a client's existing material and you see something deliberate — a
wordmark with a specific gradient direction, a rule that runs down the left of
every callout, a type treatment used in exactly one place — that was a choice
somebody made. If you cannot reproduce it, **say so rather than silently
substituting a default.** A quiet substitution reads to the client as "you didn't
notice", which is worse than "I can't do that yet."

Related: when you are judging a reproduction, the bar is **indistinguishable to
the eye, not identical by measurement.** Your eye decides whether it is right;
the numbers tell you where to look when it isn't.

---

## 14. Modals — a real option now, and usually the wrong one

You can put content behind a modal: a control on the page opens a panel over it,
the page behind dims, and the panel closes on Escape, on a click outside it, or
on whatever Close you gave it. It is ordinary layout — you author the panel the
way you author any other box, so it can be as designed as anything else on the
page.

**Reach for it rarely.** A modal is the strongest interruption a page has, and
its cost is real: it hides the page, it takes the keyboard, and on a phone it
covers the whole screen. Almost everything that *feels* like it wants a modal is
better as a section of the page.

Three cases where it is genuinely the right shape:

- **A short flow that must not lose the reader's place.** Signing in is the
  canonical one — the person is in the middle of reading, and a modal is what
  lets them come back to the same scroll position rather than a fresh page.
- **A confirmation that has to be answered before anything else happens.**
- **A picture or a video worth seeing large**, where the page around it is the
  thing you are deliberately removing.

And the cases where it is not, which is most of them:

- **Anything the client wants to be found.** A modal is invisible to somebody
  scanning the page, and to a search engine reading it.
- **A form of any length.** A contact form belongs on the page, where it has
  room and where a mistake does not cost the reader the modal.
- **Anything that would trap somebody on a phone.** If the panel is taller than
  a small screen, be certain the Close is reachable without scrolling to it.
- **Announcements, offers, newsletter prompts.** A modal the reader did not ask
  for is the single most disliked pattern on the web. If a client asks for one,
  say what it costs before you build it.

**The rule that decides it:** a modal is for something the reader *asked for*.
If they did not act to open it, it should not be over the page.

Two craft notes. **Give it a way out you can see** — Escape and a click outside
both work without you doing anything, but a visible Close is what a reader looks
for, so author one. And **do not put a scroll entrance on a modal panel**: it
starts closed, so an animation that runs when something scrolls into view has
nothing to run on. Animate the panel's contents instead, or leave it.

---

## 15. A starting reference set

Sites worth capturing and studying when you want to see a principle executed
rather than described. **This is a starting set and not a house style** — the
point of having a range is that our sites do not converge, so treat it as
evidence about what is possible, never as a shelf to pick from.

**Restraint and locked colour:** Linear (near-black canvas, one lavender accent),
Vercel (strict monochrome, depth from lighting rather than colour), Aesop and
CDLP (palettes locked to physical packaging).

**Type as a system:** Vero New York (selective mid-sentence italics as an
editorial device), Teenage Engineering (monospace model numbers as the branding
itself).

**Invented content architecture, not the default section order:** UNCOMMON Studio
(a numbered case-study grid as the primary navigation metaphor), Alethia (dual
numbering systems forming a bespoke modular grid).

**Motion and micro-interaction density:** Linear (over a hundred small, tuned
states that read collectively as craft), By-Kin (a hand-weighted scroll system
tuned so nothing snaps).

**Warmth and the human hand:** Anthropic (hand-drawn illustration against
sterile sameness), Cohere (generous whitespace as confidence).

**The frontier, for reference rather than imitation:** Montfort, Resn, Active
Theory, Lusion. Genuinely out of reach for template platforms — and almost never
the right instinct for a small business that needs enquiries.

Two things to hold alongside this list. **Take form, never content** — §8. And
notice what a site is doing *specifically*: "Linear looks expensive" is not a
lesson, "Linear holds one accent colour across every surface and never reaches
for a second" is.

---

## 16. Related

- The page-language reference and the tool reference — **the vocabulary and the
  operations. Generated, always current, and the place to look when something
  will not go in.**
- [[DOC-33]] The consultation runbook — where the decisions this document
  executes get made.
- [[DOC-49]] Running the session — the operating discipline around all of this.
- [[DOC-51]] The client's material — reference sites, rights, and what you may
  use.
- [[DOC-47]] What the tool can do today — what is genuinely not built yet.