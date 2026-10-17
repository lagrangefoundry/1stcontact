---
uid: request-901cbbf7
id: REQ-400
type: request
title: 'Launch readiness: a favicon and share card, and the consultant tells the truth
  about going live'
created_by: EPIC-19
created_at: '2026-10-17T13:58:32.149055+00:00'
updated_at: '2026-10-17T14:32:42.469948+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-2a3678ce
  commits:
  - working_sha: 2e12e33b076a52ac523485e224edbba5f41778b3
    reconcile_sha: null
    main_sha: null
  - working_sha: cca1d94557ec892a04bfab3ad71eb2a659b63a84
    reconcile_sha: null
    main_sha: null
  version: 0.2.511
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

## Implementation (as built)

### Site definition
- `config.favicon` = `{ icon, appleTouchIcon? }` and `config.shareCard` = `{ image?, title?, description? }`, both `.strict()` (an unknown key is refused). Every image field is a `siteAssetNameSchema`: the bare file name of one of the site's own assets (`logo.png`). A URL, a `javascript:`/`data:` value, a path (`../x`, `/assets/x`) or a name with spaces is refused.
- Per-page override: `page.seoMeta.ogImage` is now the same asset-name type (it was a raw string with no stored users). It is the page's own share-card picture.
- A write that points the icon, the card picture or a page's `ogImage` at a file the site does not hold is refused (`SCHEMA_INVALID`), so no broken tag is ever published. Only references the write introduces are checked.

### Rendering (`packages/framework/src/share-card.ts`, used by `tools/generate/src/render/render.ts`)
- Every served page's head gets `<link rel="icon">`, `<link rel="apple-touch-icon" sizes="180x180">`, and the Open Graph and Twitter card tags (`og:type`, `og:title`, `og:description`, `og:image`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).
- Nothing is emitted for an unset field. A site with no favicon and no card gets no icon, `og:` or `twitter:` tags at all. A card exists when the site has a `shareCard` or the page names its own `ogImage`.
- `twitter:card` is `summary_large_image` when there is a picture and `summary` when there is not.
- Precedence (decided during the build): the title and description the client set on the site's card win on every page. Where the card leaves one unset, the page's own `seoMeta` answers, then the site's name (`businessName`) and tagline. The picture is the page's `ogImage` where set, else the card's. Reason: the scaffolded home page already carries an SEO title, so under "page beats site" a card title the client set would never show on the page people share most.
- The snapshot keeps asset URLs relative (REQ-109). The public-site Worker makes `og:image`/`twitter:image` absolute against the URL the page was requested at, because link-preview crawlers do not resolve relative images. This also stays correct when a domain is connected after publishing. A page with no card is served unchanged, and stamping twice changes nothing.

### Making the favicon (`tools/generate/src/cli/favicon.ts`, `editFaviconMake` in `edit.ts`)
- A new assistant tool, `make_favicon { image }`, in the `WriteConfig` group beside `set_config`. The consultant delegates it like any site write, and the builder can call it.
- `image` is resolved in the same naming vocabulary as the image surface: a site file or a Library item, by any name it answers to. Its current bytes (edits included) are cut to the centred square by the deployment's existing image renderer at 32px and 180px PNG. The results are written as `favicon.png` and `apple-touch-icon.png`, and `config.favicon` is set to them. No upload is needed. The icon files are written before the setting, so a refusal can never leave a link to a missing file.
- An SVG that the renderer cannot rasterise becomes the tab icon directly (`favicon.svg`), with no home-screen size.
- A deployment with no image renderer (the `1c` CLI, or a Worker without `[images]`) refuses with `ENVIRONMENT` and a sentence saying so. `set_config` can still name an icon file the site already holds.
- `set_config`'s description now names `favicon` and `shareCard`. `update_page`'s `seo.ogImage` description says it takes a site asset's file name.

### Settings tab
- A new section, "Tab icon and share card" (`apps/control-app/src/builder/launch.js`), sits on the Settings pane under the domain sections, for the open site. It shows the current icon and card. It offers a picture picker with a "Make tab icon" button, and the card's picture, title and description with a "Save share card" button. Empty boxes show, as placeholders, the default they will publish.
- It calls `GET/POST /api/launch`, a thin route over `editShareGet`, `editFaviconMake` and `editShareCardSet`. The route cuts the icon with the same renderer and the same merged site and Library pictures the assistant uses. Saving the card replaces it whole, and emptying every box removes the card.
- The section refreshes on a site switch, after a site-assistant write, and on the Settings pane's reload.

### Consultant priming
- A new `going-live` entry follows `conduct` in both consultant priming orders. It says:
  - the client's own domain can be connected now, on the Settings tab with the settings assistant;
  - the favicon and share card are site settings, the icon is made with `make_favicon` from an existing picture, and both are visible and changeable on the Settings tab;
  - a contact-form message is stored with its sender as a contact on the Contacts tab, and the owner is not notified;
  - she never gives a date;
  - she never says a capability is missing without checking, and when unsure she says so and points to where the client can check.

## UATs (as built)
- `tests/test_UAT_FC_REQ-400_launch_readiness.test.ts`
  - The icon and card render in every page head.
  - A site without them renders no icon, `og:` or `twitter:` tags.
  - Page `ogImage` override.
  - An unset card title falls back to the page's SEO title, then the site name.
  - A card title the client set wins on every page, and the small card is used without a picture.
  - `make_favicon` cuts both sizes from an existing picture with no upload. Checked: both sizes, PNG, centred crop, the asset files, the config, and the head links.
  - `make_favicon` refuses without a renderer.
  - The schema rejects non-asset images and unknown keys.
  - A write naming a missing asset is refused.
  - The Settings route reads the state, replaces the card and removes it.
  - The Settings route refuses an icon without a renderer.
  - The served page carries an absolute share image.
  - The consultant priming states the going-live facts.
- `tests/test_UAT_FC_REQ-400_settings_section.test.ts`
  - The section shows the card and its defaults.
  - Its buttons send the icon and card requests.
- Two pinned write-set lists (`reconciliation-assistant-control-surface`, `REQ-126_l1_surface`) gained `make_favicon`.