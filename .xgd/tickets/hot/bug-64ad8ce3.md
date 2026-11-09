---
uid: bug-64ad8ce3
id: BUG-413
type: bug
title: 'Tab icon and share card: make_favicon is refused on a second run with the
  same scope, crops wide logos to a sliver, and the settings live in two places'
created_by: EPIC-19
created_at: '2026-11-09T20:23:17.598189+00:00'
updated_at: '2026-11-09T20:52:38.248064+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  severity: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-0a380ac2
  commits:
  - working_sha: a550cb0afc2d5b30f4c8191c742d4fa828228c44
    reconcile_sha: null
    main_sha: null
  - working_sha: 520bad5926dcc283ec72462a76a7e8fc04020eee
    reconcile_sha: null
    main_sha: null
  version: 0.2.856
  story_points: 5
---

## Source

PLATFORM_ISSUE-17 (production, 2026-11-09).

## Problems

1. **The same scope behaves differently on a second run.** A builder with scope `["site.json"]` ran `make_favicon` from a wide wordmark PNG. It created `assets/favicon.png` and `assets/apple-touch-icon.png` and set `config.favicon`. A later builder with the identical scope ran `make_favicon` from a different (square) picture to replace the icon and was refused: "assets/apple-touch-icon.png is not in this session's scope (site.json); nothing was written". The first run creates files, which is allowed; the second overwrites them, which isn't.
2. **A wide logo becomes a sliver.** `make_favicon` cuts the centred square from a 779×319 wordmark, so the icon shows a fragment of letters. Nothing warns.
3. **The settings live in two places.** The playbook and `set_config` disagree about where `favicon` and `shareCard` live. `get_config favicon` returns NOT_FOUND while `config.favicon` holds the value, and a builder ended up writing `shareCard` both at the top level and at `config.shareCard`.

## Expected behaviour

1. **A scope that may make the tab icon may also replace it.** `make_favicon` owns its output files: any session allowed to run it may overwrite the icon files it produces, whichever run created them. The refusal can't depend on whether the files already exist.
2. **A wide or tall picture becomes a recognisable icon:**
   - the whole mark is fitted into the square on the site's background (letterboxed), not centre-cropped;
   - or, where the logo has a separable symbol (a monogram), that part is used;
   - the tool reports which it did and returns the icon so the consultant can look at it;
   - an icon whose content would be unreadable at 32px is reported, not saved silently.
3. **One home for each setting.** `favicon` and `shareCard` live in exactly one place in the site's configuration. `get_config`, `set_config`, `make_favicon`, the Settings section and the playbook all read and write that one place. A stray copy elsewhere (such as a top-level `shareCard`) is migrated into it and removed.

This sits alongside the operator's open discussion (2026-11-09) about moving the tab icon and share card out of Settings into a "How your site appears" view with a thumbnail picker, and having the consultant fill them in. That redesign will be its own ticket once decided. This ticket fixes the tool and data faults, which any redesign needs anyway.

## What changed

1. **Replacing the icon.** The site file owns the icon files `make_favicon` writes (`assets/favicon.png`, `assets/favicon.svg`, `assets/apple-touch-icon.png`): a builder whose scope includes `site.json` may overwrite them, whichever run created them. A scope without `site.json` still may not (the write is refused as before). Implemented in the lease check (`scopeCovers` in `tools/generate/src/store/leases.ts`, used by `leased-store.ts`).
2. **A whole, fitted icon.** `make_favicon` reads the picture as it currently stands (edits included) once as a PNG, trims its transparent margins, and fits the visible mark whole into the 32px and 180px squares, centred on the site's background (`design.colour.background`, resolved through the palette; transparent when the design names none). Nothing is centre-cropped. The answer reports:
   - `method`: `fitted` (or `as-drawn` for an SVG the renderer cannot rasterise, which is used as the icon unchanged, as before);
   - `mark`: the mark's width × height inside the 32px icon;
   - `legible`: false when the mark's short side is under 16px at tab size. The icon is still saved, and the message says it will be hard to read and suggests cropping the picture to the logo's symbol or monogram and making the icon again;
   - `look`: the icon to look at, and the message names the `screenshot` call (`{ "kind": "image", "image": "apple-touch-icon.png" }`).
3. **One home per setting.** Every setting the config schema defines (including `favicon` and `shareCard`) lives only under `config`:
   - `get_config` / `set_config` with a bare key (`favicon`, `shareCard.image`) address `config.favicon` / `config.shareCard.image`, and the answer names the full key;
   - a top-level `set_config` write naming `shareCard` (or another config setting) lands in `config`;
   - a site holding a stray top-level copy (such as a top-level `shareCard`) reads as one copy in `config` (merged, with `config`'s own values winning where both hold one, so what the site renders does not change), and the next write persists that, leaving no top-level copy.
   `make_favicon`, the Settings section (`editShareGet` / `editShareCardSet`) and rendering already read and write `config`, so they now agree with `get_config` / `set_config`.
4. **Tool text.** The `make_favicon` declaration now describes the fit, the replacement, the size report and how to look at the result; the `set_config` declaration says these settings live only under `config` and that `favicon` means `config.favicon`.

## Design decisions

- **Supersedes REQ-400's centred square.** REQ-400 made the icon from the centred square of the picture; that UAT (`test_UAT_FC_REQ-400_make_favicon_cuts_both_sizes_from_an_existing_picture_without_upload`) is updated to assert two square PNGs read once, uncropped.
- **Fitting is done in-repo, not by the renderer.** The Cloudflare Images port has no padding operation, so the picture is read once as a PNG (longest side at most 512px) and fitted, area-averaged, with the repo's own PNG codec (`png.ts`, which runs in workerd).
- **No automatic monogram detection.** Expected behaviour 2 allows "or, where the logo has a separable symbol, that part is used". Guessing which part of a wordmark is a symbol is unreliable (separate letters look like separate symbols), so the tool fits the whole mark and, when it is too small to read, says to crop the picture to the symbol first; that crop is what `make_favicon` reads.
- **The icon is named, not inlined.** A Toolbox operation's answer reaches the model as text (content blocks are serialised), so `make_favicon` names the icon and the `screenshot` call that shows it rather than embedding the image.

## Test plan

UATs in `tests/test_UAT_FC_BUG-413_tab_icon_and_share_card.test.ts` (real L1 operations over a real leased store and the real claim hook; the image renderer is faked at its external boundary and answers real PNGs):
- `a_second_make_favicon_under_the_same_scope_replaces_both_icon_files`: with scope `site.json`, `make_favicon` from picture A, then (a second builder, same scope) from picture B replaces both icon files;
- `a_scope_without_the_site_file_still_may_not_overwrite_the_icon`: a `home.json`-scoped builder is still refused;
- `a_wide_wordmark_is_fitted_whole_and_letterboxed_and_the_answer_says_so`: a 779×319 wordmark gives square icons holding both ends of the mark, with the site's background above and below; the answer reports `fitted`, the mark's size, `legible: false` with the "hard to read" warning, and the icon to look at;
- `a_square_mark_fills_the_icon_and_reads_as_legible`: a square mark fills the 32px icon and carries no warning;
- `get_and_set_config_read_and_write_favicon_and_share_card_in_config`: `get_config favicon` returns `config.favicon`; `set_config` of `shareCard` by bare key and inside a top-level write both land in `config.shareCard`, with no top-level copy;
- `a_stray_top_level_share_card_is_moved_into_config_leaving_one_copy`: a top-level `shareCard` reads from `config` and the next write leaves exactly one copy, in `config`, with `config`'s values winning.