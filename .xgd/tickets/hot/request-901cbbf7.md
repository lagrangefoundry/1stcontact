---
uid: request-901cbbf7
id: REQ-400
type: request
title: 'Launch readiness: a favicon and share card, and the consultant tells the truth
  about going live'
created_by: EPIC-19
created_at: '2026-10-17T13:58:32.149055+00:00'
updated_at: '2026-10-17T13:58:32.149055+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## What changes

Two launch gaps found at the end of Charlie's plumbing - 3 (2026-10-04), in the "finishing touches" turn:

1. **There is no favicon or share card.** The consultant offered both: a browser-tab icon made from the logo, and a link-preview card using the team photo. The builder then *"confirmed there's nowhere in the site settings to set a favicon or a share image."* A real launch would hit this. A site with no tab icon and a blank card when its link is texted looks unfinished. The plan seed already lists `favicon_share_card` as a decision, so the method expects it and the product can't deliver it.
2. **The consultant's account of going live was wrong.** She told the client *"Your own web address can't be connected yet … planned, but I won't promise a date."* Custom domains are served (REQ-258) and are managed by the settings assistant on the Settings tab. The consultant isn't told that, so she guessed, and the guess was wrong.

## Requirements

### Favicon and share card

1. **A site carries a favicon and a share card** in its site definition, as typed structured fields per the security policy: an image reference from the site's own assets, never raw markup.
   - The share card has an image, a title and a description. Title and description default to the site's name and description.
   - Per-page overrides are allowed but not required.
2. **The renderer emits them** in every published page's head:
   - the favicon link, including an apple-touch icon size;
   - Open Graph and Twitter card tags for the share card.
   - Nothing is emitted for a field that isn't set; no broken tags.
3. **The favicon can be made from an existing image.** It's derived from a Library or site image, for example the logo, at the needed sizes. Doing this needs no new upload.
4. **The consultant can set both** through her normal site tools, and the builder can as well. The client sees them on the Settings tab or wherever site-wide details live, and can change them there.

### What the consultant says about going live

5. **The consultant's priming says where launch tasks live and what state they're in:**
   - Connecting the client's own domain is done on the Settings tab, with the settings assistant.
   - Favicon and share card are set as above.
   - New contact-form messages: what the owner is told today. As of this ticket they're stored in the contact list with no notification, which is EPIC-14's work.

   She states what's true and doesn't guess at dates.
6. **She never says a capability is missing without checking.** If she isn't sure whether something exists, she says so and points to where the client can check. She doesn't assert that it's missing.

## Out of scope

- Notifying the owner of new form messages (EPIC-14).
- Building domain connection itself (REQ-258).

## Test plan

UATs `test_UAT_FC_<this ticket>_*`:

- A site with a favicon and share card set renders the favicon links and the OG/Twitter tags in each page head. A site without them renders none.
- Setting the favicon from an existing site image produces the icon sizes, with no upload.
- The schema rejects a share-card image that isn't a site asset reference, and rejects unknown keys.
- The consultant's priming contains the going-live facts: the domain is on the Settings tab, and how new messages are surfaced.
