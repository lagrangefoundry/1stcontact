/**
 * [[REQ-363]] — a page is looked at one screen at a time.
 *
 * WHY. `screenshot` used to hand the model the whole page, reduced until its
 * longest edge was 1,024 px. On a tall page that is a sliver nothing on can be
 * read — 1280×9059 arrived as 169×1024 — so the consultant paid for a picture it
 * could not judge from. A visitor sees one screen and scrolls; so does the model
 * now. A page picture is a TILE: one screen-height slice, reduced by its width.
 *
 * WHAT IS HERE AND WHAT IS NOT. This module is the arithmetic and the words:
 * which tiles a call asked for, how wide each is sent, what it costs and what its
 * label says. It touches no pixels — `fidelity-core.ts` cuts and encodes the
 * tiles with the raster functions that already exist — and it carries no numbers
 * of its own: every default is `picture-tiles.json`'s, which is the point of the
 * ticket's last line. Changing how much the model sees by default is an edit to
 * that file, never to this one.
 */
import tilesDocument from './picture-tiles.json'
import { PictureSourceError } from '../picture'
import type { PageSection, PictureKind } from '../picture'

/** How much detail a tile is sent at. */
export type Detail = 'low' | 'normal' | 'high'

/** Every detail, in order — the surface's enum is this list. */
export const DETAILS: readonly Detail[] = ['low', 'normal', 'high']

/** The settings `screenshot` tiles by. See `picture-tiles.json` for each one. */
export interface TileSettings {
  defaultTiles: string
  defaultDetail: Detail
  maxTilesPerCall: number
  detailWidths: Record<Detail, number>
  providerMaxEdge: number
  pixelsPerToken: number
}

/** The shipped settings, read from configuration. */
export const TILE_SETTINGS: TileSettings = {
  defaultTiles: tilesDocument.default_tiles,
  defaultDetail: tilesDocument.default_detail as Detail,
  maxTilesPerCall: tilesDocument.max_tiles_per_call,
  detailWidths: tilesDocument.detail_widths,
  providerMaxEdge: tilesDocument.provider_max_edge,
  pixelsPerToken: tilesDocument.pixels_per_token,
}

/** The kinds of picture that are one of our own rendered pages, and so have addresses. */
const ADDRESSED: readonly PictureKind[] = ['draft', 'edit', 'revision']

/** What a `screenshot` call said about which part of the page and how much detail. */
export interface TileAsk {
  tiles?: unknown
  section?: unknown
  detail?: unknown
}

/**
 * The detail asked for, or the configured one — refused by name if it is not one.
 *
 * Checked before a browser is leased, with {@link checkAsk}, so a mistyped ask
 * costs nothing.
 */
export function detailOf(ask: TileAsk, settings: TileSettings): Detail {
  const detail = ask.detail ?? settings.defaultDetail
  if (!DETAILS.includes(detail as Detail)) {
    throw new PictureSourceError(
      `'${String(detail)}' is not a detail. Use one of: ${DETAILS.join(', ')}.`,
    )
  }
  return detail as Detail
}

/**
 * Refuse an ask that cannot be answered, before anything is photographed.
 *
 * `tiles` and `section` are two ways of saying which part, so both at once has no
 * single meaning. A `section` is an L1 address, which only our own pages have: a
 * stranger's page and a recording of one are not ours to address, and a stored
 * picture is shown whole.
 */
export function checkAsk(kind: PictureKind | undefined, ask: TileAsk): void {
  if (ask.tiles !== undefined && ask.section !== undefined) {
    throw new PictureSourceError(
      `say which part with 'tiles' or with 'section', not both — they are two ways of ` +
        `choosing the same thing.`,
    )
  }
  if (kind === 'image' && (ask.tiles !== undefined || ask.section !== undefined)) {
    throw new PictureSourceError(
      `a stored picture is shown whole, so it has no tiles or sections. Ask for it without ` +
        `'tiles' or 'section'.`,
    )
  }
  if (ask.section !== undefined && kind !== undefined && !ADDRESSED.includes(kind)) {
    throw new PictureSourceError(
      `only your own pages — a 'draft', 'edit' or 'revision' picture — have section ` +
        `addresses, and this one is '${kind}'. Ask for it by 'tiles' instead: every tile ` +
        `says where on the page it is.`,
    )
  }
}

/** One tile of a page: where it is, in the page's own pixels and in the picture's. */
export interface Tile {
  /** 1-based, as the model names it. */
  index: number
  /** Where it is on the page, in page (CSS) pixels. */
  top: number
  bottom: number
  /** Where it is in the full-page picture, in that picture's pixels. */
  rasterTop: number
  rasterHeight: number
  /** The addresses of the top-level sections it shows. */
  sections: string[]
}

/** What one call sends, and what it leaves for the next. */
export interface TilePlan {
  /** Every tile the page has. */
  count: number
  /** The page's height, in page pixels. */
  pageHeight: number
  /** The tiles this call sends, in order — at most the configured cap. */
  tiles: Tile[]
  /** A sentence about what was asked for and not sent, or what the section spans. */
  after: string | null
}

/** Parse `3`, `2-5` or `all` into a 1-based, inclusive range. */
function rangeOf(spec: unknown, count: number): { first: number; last: number } {
  const text = String(spec).trim().toLowerCase()
  if (text === 'all') return { first: 1, last: count }
  const one = /^(\d+)$/.exec(text)
  const two = /^(\d+)\s*-\s*(\d+)$/.exec(text)
  const first = Number(one?.[1] ?? two?.[1])
  const last = Number(one?.[1] ?? two?.[2])
  if ((!one && !two) || first < 1 || last < first) {
    throw new PictureSourceError(
      `'${String(spec)}' is not a choice of tiles. Name one tile (\`3\`), a range ` +
        `(\`2-5\`) or \`all\`; tiles are numbered from 1.`,
    )
  }
  if (first > count) {
    throw new PictureSourceError(
      `this page is ${count} ${count === 1 ? 'tile' : 'tiles'} long, so there is no tile ${first}.`,
    )
  }
  return { first, last: Math.min(last, count) }
}

/**
 * Which tiles this call sends, and what it says about the rest.
 *
 * `pictureHeight` and `pictureWidth` are the full-page picture's; `viewport` is
 * the screen it was taken at. A screen is the viewport's height, and the picture
 * is in page pixels scaled by its width over the viewport's — which is 1 for
 * every page this product photographs and is honoured anyway, so a reference
 * recorded at another width is still cut into screens rather than into slices of
 * an arbitrary height.
 */
export function planTiles(
  pictureWidth: number,
  pictureHeight: number,
  viewport: { width: number; height: number },
  sections: readonly PageSection[] | undefined,
  ask: TileAsk,
  settings: TileSettings,
): TilePlan {
  const ratio = pictureWidth / viewport.width
  const screen = Math.max(1, Math.round(viewport.height * ratio))
  const count = Math.max(1, Math.ceil(pictureHeight / screen))
  const pageHeight = Math.round(pictureHeight / ratio)

  let first: number
  let last: number
  let spans: string | null = null
  if (ask.section !== undefined) {
    const address = String(ask.section).trim()
    const found = (sections ?? []).find((s) => s.address === address)
    if (!found) {
      throw new PictureSourceError(
        (sections ?? []).length === 0
          ? `no top-level sections could be read on that page, so there is no '${address}' ` +
              `to find. Ask by 'tiles' instead.`
          : `'${address}' is not a top-level section of that page. Its sections are ` +
              `${(sections ?? []).map((s) => s.address).join(', ')}.`,
      )
    }
    const tileAt = (y: number) => Math.min(count, Math.floor((y * ratio) / screen) + 1)
    first = last = tileAt(found.top)
    const end = tileAt(Math.max(found.top, found.bottom - 1))
    if (end > first) {
      spans = `Section ${address} starts in tile ${first} and runs to tile ${end}; ask for tiles \`${first + 1}-${end}\` to see the rest of it.`
    }
  } else {
    ;({ first, last } = rangeOf(ask.tiles ?? settings.defaultTiles, count))
  }

  const sent = Math.min(last, first + Math.max(1, settings.maxTilesPerCall) - 1)
  const tiles: Tile[] = []
  for (let index = first; index <= sent; index++) {
    const rasterTop = (index - 1) * screen
    const rasterHeight = Math.min(screen, pictureHeight - rasterTop)
    const top = Math.round(rasterTop / ratio)
    const bottom = Math.round((rasterTop + rasterHeight) / ratio)
    tiles.push({
      index,
      top,
      bottom,
      rasterTop,
      rasterHeight,
      sections: (sections ?? [])
        .filter((s) => s.top < bottom && s.bottom > top)
        .map((s) => s.address),
    })
  }

  // ASKED FOR MORE THAN ONE CALL SENDS: the first batch, and exactly how to ask
  // for the rest — neither a refusal nor a silent truncation.
  let after = spans
  if (sent < last) {
    const remaining = last - sent
    const nextLast = Math.min(last, sent + settings.maxTilesPerCall)
    const next = nextLast === sent + 1 ? `${sent + 1}` : `${sent + 1}-${nextLast}`
    after =
      `${remaining} more ${remaining === 1 ? 'tile' : 'tiles'} of what you asked for ` +
      `${remaining === 1 ? 'was' : 'were'} not sent — one call sends at most ` +
      `${settings.maxTilesPerCall}. Ask for tiles \`${next}\` next` +
      (nextLast < last ? `, and so on up to tile ${last}.` : '.')
  }
  return { count, pageHeight, tiles, after }
}

/**
 * How much a tile is reduced by: to the detail's width, and within the
 * provider's edge limit, never enlarged. Mobile's 375 is under every width, so a
 * mobile tile is always sent as it is.
 */
export function tileScale(
  width: number,
  height: number,
  detail: Detail,
  settings: TileSettings,
): number {
  return Math.min(
    1,
    settings.detailWidths[detail] / width,
    settings.providerMaxEdge / Math.max(width, height),
  )
}

/** The approximate token price of an image this size, as the provider charges it. */
export function tileTokens(width: number, height: number, settings: TileSettings): number {
  return Math.ceil((width * height) / settings.pixelsPerToken)
}

/** The sentence beside a tile: where it is, what it shows, what it costs. */
export function tileLabel(
  label: string,
  plan: TilePlan,
  tile: Tile,
  sent: { width: number; height: number },
  cut: { width: number; height: number },
  settings: TileSettings,
): string {
  const reduced =
    sent.width === cut.width && sent.height === cut.height
      ? ''
      : ` (reduced from ${cut.width}×${cut.height})`
  const sections = tile.sections.length ? `; sections ${tile.sections.join(', ')}` : ''
  return (
    `${label} — tile ${tile.index} of ${plan.count}, page y ${tile.top}–${tile.bottom} of ` +
    `${plan.pageHeight} px${sections}; ${sent.width}×${sent.height}${reduced}, about ` +
    `${tileTokens(sent.width, sent.height, settings)} tokens`
  )
}
