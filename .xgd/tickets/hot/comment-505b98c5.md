---
uid: comment-505b98c5
id: COMMENT-828
type: comment
title: Comment on request REQ-121
created_by: xgd
created_at: '2026-08-07T23:27:57.846264+00:00'
updated_at: '2026-08-07T23:38:49.217109+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-9707484c
  kind: chat_transcript
---

<!-- xgd-turn id="16f31adb-2e6c-4712-ac71-904500a42f86-user" -->

<!-- xgd-chat role="user" ts="2026-08-07T23:27:50.831528+00:00" -->
#### You
I want to build on REQ-117 I want it to be more elegant. First lets modify the popup window.

(1) What fonts are the labels using - UGLY! I think we need to establish some styles for this application - not sure it this should be part of the theme (probably font color but not family). We need something simple - a sans serif but it would be nice if it was (very slightly) distinctive. 
(2) Edit text <-- I think this is redundant if the text box looks like a text box - get rid of it
(3) There's a lot of space given to a pointless label "Text" - please get rid of this too
(4) CTAs need to use font from 1 and follow theme guidelines
(5) The text entry itself (a) Can we put a clear text box around the text entry area take a look at the theme and the Chat text entry - probably not as deeply rounded on the corners, but slighly rounded and board in the theme color (b) Can we present the text in the color and font that it appears on the page? (c) Can we put the background of the textbox to match the background it is sitting on on the page - same color for plan text for text that is on a background...it would be extremely cool to screenshot the actual background behind the text and present it to the user on that - alternatively (if that is too hard) we can choose a plane color that provides high contrast with the chosen text color

Thoughts?

<!-- xgd-turn id="16f31adb-2e6c-4712-ac71-904500a42f86-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-07T23:31:22.154180+00:00" -->
#### Claude
I'll look at what's there now before answering.

Diagnosis first, because one root cause explains items 1 and 4 together.

## The root cause

`defaultModal` ends with `document.body.append(host)` (`apps/control-app/src/builder/editor.js:251`, and again at 204). The shell mounts into `#app`, and **every** design token plus the font-family live on `.shell`:

```css
.shell { --shell-bg: …; --shell-accent: …; font-family: system-ui, -apple-system, sans-serif; }
```

So the modal is a *sibling* of the themed subtree. It inherits no font (→ browser default serif — that's your ugly labels) and resolves **none** of the `var(--shell-*)` references, falling through to the hardcoded hex fallbacks in `builder.css`. The modal isn't styled by the theme at all right now; it just looks approximately like it. Moving the mount inside the shell root fixes 1 and 4 in one line and makes the modal follow theme switches, which today it silently doesn't.

## Per item

**(1) Font.** Agreed with your instinct: colour is theme, family is not. Family should be one app-level constant, theme-independent — themes swap palettes, not typography.

The complication: `webui-shell` hardcodes `font-family: system-ui…` in its stylesheet and its token vocabulary (`bg fg muted accent surface border overlay radius gap`) has **no font token**. That's a genuine upstream gap worth raising, but I'd set it locally in `builder.css` now rather than block on it.

For "simple sans, very slightly distinctive", self-hosted from the Worker (2 weights, ~40KB):
- **IBM Plex Sans** — OFL, humanist, the flat-sided `a` and the `g` give it character without shouting. My recommendation.
- **General Sans** (Fontshare) — a bit more geometric/neutral-modern.
- **Geist** — OFL, very clean, closest to "invisible".

Nice side-effect: a distinct chrome font makes item 5b legible as *the page's* font, because it visibly isn't the chrome's.

**(2) "Edit text" heading.** Agreed, drop it for the fields modal — keep the `aria-label` (invisible, needed for the dialog role) and keep the visible heading only for the error/message modals, where it's the whole point.

**(3) The "Text" label.** It's `label: 'Text'` in `copyFieldsOf` (`packages/site-schema/src/l1/edit.ts:229`), rendered into `webui-fields`' two-column grid — a fixed `minmax(4.5rem, 7.5rem)` label column. `mountFields` has no option to suppress labels, so this is scoped CSS in our modal (collapse to one column, hide the label) plus an upstream request for a stacked/label-less layout. The label stays in the descriptor — the AI and the CLI read it, and it's the accessible name for the control.

**(5) The text entry.** This is the good part, and it's cheaper than you'd think.

The bridge already hands us the live element (`hit.element`, `edit-client.ts`), and the preview iframe is same-origin by construction. So we can just read the truth rather than infer it:

- **(b) colour + font** — `getComputedStyle(hit.element)` gives family, size, weight, style, letter-spacing, colour exactly as rendered. The one snag is that the site's `@font-face` rules live in the *iframe's* stylesheet; the parent document can't see them. Same-origin means we can enumerate `doc.styleSheets` and copy just the `@font-face` rules into a parent `<style>` — precise, small, no leakage of the site's layout rules into the chrome.
- **(c) background** — walk ancestors for the first non-transparent `background-color`. And your "extremely cool" version is genuinely reachable: if that ancestor also has a `background-image`, copy it plus `background-size`, and offset `background-position` by the element's position relative to that ancestor, so the real background lines up behind the text. Computed `url()` comes back absolute and same-origin. If it doesn't resolve cleanly, fall back to the colour.

  I'd skip a contrast-fallback: if the text is readable on the page, it's readable in the box — that's the whole argument for mirroring rather than choosing.
- **(a) the box** — the control already has `border: 1px solid var(--fields-accent, --shell-accent)`; once inside the shell that becomes the *theme* accent instead of the fallback blue. Radius to ~6px (your "less deep than the chat's 24px"), more padding, a proper focus ring.

One thing I want to decide deliberately: **size**. A 72px display headline reproduced faithfully looks absurd in a 520px modal. I'd preserve family/weight/style/colour/background exactly but clamp the rendered size into an editing range (~13–32px). The box previews *style*, not layout — the page is right there behind it for layout.

## Two decisions from you

1. **Font** — IBM Plex Sans, or one of the others?
2. **Size clamp** — clamp as above, or reproduce exact size and let the box scroll?

Answer those and I'll populate REQ-121 with the scope and implement. Everything here is one ticket: it's one intent (make the copy modal elegant), and items 1–5 share the mount-inside-the-shell fix.

<!-- xgd-turn id="fb5f4263-e290-4b57-981d-44fbbe6450ac-user" -->

<!-- xgd-chat role="user" ts="2026-08-07T23:38:49.090966+00:00" -->
#### You
he complication: `webui-shell` hardcodes `font-family: system-ui…` in its stylesheet and its token vocabulary (`bg fg muted accent surface border overlay radius gap`) has **no font token**. That's a genuine upstream gap worth raising, but I'd set it locally in `builder.css` now rather than block on it. <-- very easy to fix, please create a ticket in lagrange-framework asking for what you need and I will have it before we proceed with this implementation

Agree on size - lets see how it translates -  we can also make the model bigger / felxibly sized - I think it will need to be larger than what we have

1. Sure show me and we can iterate
2. See my note - try the reduced size, but I think the current box is too small for any decent sized text chunk

<!-- xgd-chat-end -->