# Google Fonts catalogue — the documented font list

**Generated artifact. Do not hand-edit.** Rebuild it with `1c fonts catalogue`.

- **Data**: `fonts/catalogue.json` — one record per family.
- **Retrieved**: 2026-09-23
- **Sources**: https://fonts.google.com/metadata/fonts + each family's own METADATA.pb in github.com/google/fonts

## Why this file exists

The earlier reading of [[EPIC-21]] was that the assistant needed no font list because "the
model already knows the corpus". **That claim was tested and is false.** A random sample of
40 non-Noto families produced roughly one third the model could describe and two thirds it
could not, and the estimate of corpus size was wrong by hundreds of families.

A corpus the model cannot enumerate is a corpus it will not use. Left to recall alone it
reaches for the same forty faces and every site looks the same. So the list is documented,
committed, queryable — and, since [[REQ-311]], regenerated rather than transcribed.

## What is here

| | |
|---|---|
| Live families catalogued | **1,940** |
| Redistributable (OFL-1.1 + Apache-2.0) | **1,935** |
| Variable (carry at least one axis) | 552 |
| Noto families | 212 |

### By licence

| Licence | Families | Redistributable in product |
|---|---|---|
| OFL-1.1 | 1,900 | yes — bundling and redistribution explicitly permitted |
| Apache-2.0 | 35 | yes — bundling and redistribution explicitly permitted |
| UFL-1.0 | 5 | **clear individually** — terms differ |

### By category

| Category | Families |
|---|---|
| Sans Serif | 720 |
| Display | 468 |
| Handwriting | 352 |
| Serif | 349 |
| Monospace | 51 |

**Category is an index, not taste.** It is carried so the corpus can be *queried* — you
cannot search a set you cannot describe. Pairing hints and house shortlists are taste and
are deliberately absent.

## Record shape

```json
{
 "family": "Roboto",
 "slug": "roboto",
 "licence": "OFL-1.1",
 "licence_source": "ofl/roboto/METADATA.pb",
 "category": "Sans Serif",
 "stroke": "Sans Serif",
 "classifications": [],
 "weights": [
  100,
  200,
  300,
  400,
  500,
  600,
  700,
  800,
  900
 ],
 "italic": true,
 "variable": true,
 "axes": [
  {
   "tag": "wdth",
   "min": 75,
   "max": 100
  },
  {
   "tag": "wght",
   "min": 100,
   "max": 900
  }
 ],
 "subsets": [
  "cyrillic",
  "cyrillic-ext",
  "greek",
  "greek-ext",
  "latin",
  "latin-ext",
  "math",
  "menu",
  "symbols",
  "vietnamese"
 ],
 "designers": [
  "Christian Robertson",
  "ParaType",
  "Font Bureau"
 ],
 "date_added": "2013-01-08",
 "popularity_rank": 2,
 "is_noto": false
}
```

## Top 25 by popularity

| # | Family | Category | Licence | Weights | Axes |
|---|---|---|---|---|---|
| 1 | Roboto | Sans Serif | OFL-1.1 | 100,200,300,400,500,600,700,800,900 | wdth,wght |
| 2 | Inter | Sans Serif | OFL-1.1 | 100,200,300,400,500,600,700,800,900 | opsz,wght |
| 3 | Open Sans | Sans Serif | OFL-1.1 | 300,400,500,600,700,800 | wdth,wght |
| 4 | Google Sans | Sans Serif | OFL-1.1 | 400,500,600,700 | GRAD,opsz,wght |
| 5 | Montserrat | Sans Serif | OFL-1.1 | 100,200,300,400,500,600,700,800,900 | wght |
| 6 | Poppins | Sans Serif | OFL-1.1 | 100,200,300,400,500,600,700,800,900 | — |
| 7 | Lato | Sans Serif | OFL-1.1 | 100,300,400,700,900 | — |
| 8 | Noto Sans JP | Sans Serif | OFL-1.1 | 100,200,300,400,500,600,700,800,900 | wght |
| 9 | Arimo | Sans Serif | OFL-1.1 | 400,500,600,700 | wght |
| 10 | Roboto Condensed | Sans Serif | OFL-1.1 | 100,200,300,400,500,600,700,800,900 | wght |
| 11 | Roboto Mono | Monospace | OFL-1.1 | 100,200,300,400,500,600,700 | wght |
| 12 | Oswald | Sans Serif | OFL-1.1 | 200,300,400,500,600,700 | wght |
| 13 | Noto Sans | Sans Serif | OFL-1.1 | 100,200,300,400,500,600,700,800,900 | wdth,wght |
| 14 | DM Sans | Sans Serif | OFL-1.1 | 100,200,300,400,500,600,700,800,900,1000 | opsz,wght |
| 15 | Raleway | Sans Serif | OFL-1.1 | 100,200,300,400,500,600,700,800,900 | wght |
| 16 | Nunito | Sans Serif | OFL-1.1 | 200,300,400,500,600,700,800,900,1000 | wght |
| 17 | Playfair Display | Serif | OFL-1.1 | 400,500,600,700,800,900 | wght |
| 18 | Nunito Sans | Sans Serif | OFL-1.1 | 200,300,400,500,600,700,800,900,1000 | YTLC,opsz,wdth,wght |
| 19 | Roboto Slab | Serif | Apache-2.0 | 100,200,300,400,500,600,700,800,900 | wght |
| 20 | Rubik | Sans Serif | OFL-1.1 | 300,400,500,600,700,800,900 | wght |
| 21 | Ubuntu | Sans Serif | UFL-1.0 | 300,400,500,700 | — |
| 22 | Outfit | Sans Serif | OFL-1.1 | 100,200,300,400,500,600,700,800,900 | wght |
| 23 | Archivo Black | Sans Serif | OFL-1.1 | 400 | — |
| 24 | Kanit | Sans Serif | OFL-1.1 | 100,200,300,400,500,600,700,800,900 | — |
| 25 | Work Sans | Sans Serif | OFL-1.1 | 100,200,300,400,500,600,700,800,900 | wght |

## Most recently added (20)

The newest families are the ones a model is least likely to be able to name from recall,
and they are the clearest argument for a list it can read instead.

| Family | Category | Added |
|---|---|---|
| Valley Sans | Sans Serif | 2026-08-25 |
| Caacupe One | Display | 2026-08-25 |
| Scoutie Sans | Sans Serif | 2026-08-25 |
| Asap Sharp | Sans Serif | 2026-08-25 |
| Hibur Mono | Monospace | 2026-07-08 |
| Geomini | Sans Serif | 2026-07-08 |
| Yuyu Short | Handwriting | 2026-06-29 |
| Geist Pixel | Display | 2026-06-29 |
| Montenegrin Gothic One | Serif | 2026-06-29 |
| Yuyu | Handwriting | 2026-06-29 |
| Pliant | Sans Serif | 2026-06-05 |
| Alien Block | Display | 2026-06-05 |
| Arimo | Sans Serif | 2026-05-12 |
| Tinos | Serif | 2026-05-12 |
| Akt | Sans Serif | 2026-05-12 |
| Estedad | Sans Serif | 2026-05-12 |
| Finlandica Text | Sans Serif | 2026-05-12 |
| Finlandica Headline | Sans Serif | 2026-05-12 |
| M PLUS U | Sans Serif | 2026-05-12 |
| Strichpunkt Sans | Sans Serif | 2026-05-12 |

## Caveats

1. Licence is read from each family's own METADATA.pb in github.com/google/fonts, joined on the family name that file declares for itself. No licence is inferred from a directory name.
2. The live list carries 1946 families; the repository declares 2031. The live list is the authority for what exists, so delisted and sandboxed families in the repository are not mirrored.
3. 6 live families were excluded because no METADATA.pb declares them: Edu NSW ACT Cursive, Edu NSW ACT Hand Pre, Edu QLD Hand, Edu SA Hand, Edu VIC WA NT Hand, Edu VIC WA NT Hand Pre. A licence is never defaulted.
4. Upstream carries no style descriptors — nothing says "geometric", "humanist" or "grotesque". A style query therefore retrieves a category slate rather than a precise match.

## Relationship to `fonts/registry.yaml`

Different artifacts, different jobs. The **registry** is the provenance and licence record
over bytes this repository actually holds, and it gates (`1c fonts check`). This
**catalogue** is the index of what is available to mirror. A family appears in the registry
only once its bytes are here.
