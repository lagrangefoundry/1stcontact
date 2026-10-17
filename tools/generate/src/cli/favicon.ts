/**
 * A tab icon made from a picture the client already has ([[REQ-400]]).
 *
 * NO UPLOAD AND NO SECOND RENDERER. The source is named in [[REQ-218]]'s
 * vocabulary — a site file or a Library item, by any spelling
 * `resolveStoredImage` accepts — and the two sizes are cut by the same
 * {@link ImageRenderer} that applies a crop in the editor, so the icon is the
 * picture as the client currently sees it, edits included.
 *
 * A SQUARE, CUT FROM THE MIDDLE. A tab and a home screen both draw icons square,
 * and a wide logo scaled to 32px wide is a smudge 10px tall. Centring is the
 * honest default; a client who wants a different part crops the picture first,
 * and that crop is what this reads.
 *
 * A DRAWING THE RENDERER CANNOT RASTERISE IS STILL AN ICON. A browser takes an
 * SVG as a tab icon directly, so a vector logo the renderer refuses becomes the
 * icon as it is — with no home-screen size, which only a bitmap can be.
 *
 * A PORT, LIKE THE RENDERER IT WRAPS. The site write lives in `edit.ts`
 * (`editFaviconMake`); this only turns a name into bytes, so it can be handed to
 * the assistant's toolbox and to the Settings route alike.
 */
import { resolveStoredImage, type ImageLibrary } from './image-library'
import type { EditOp, ImageRenderer } from './image-recipe'

/** The asset the tab icon is written as. */
export const FAVICON_ASSET = 'favicon.png'
/** The asset a vector tab icon is written as. */
export const FAVICON_SVG_ASSET = 'favicon.svg'
/** The asset the home-screen icon is written as. */
export const APPLE_TOUCH_ICON_ASSET = 'apple-touch-icon.png'

/** The two sizes asked for, in pixels. */
export const FAVICON_PX = 32
export const APPLE_TOUCH_ICON_PX = 180

/** The files one icon is made of, ready to be written to the site. */
export interface MadeIcons {
  /** The picture it was made from, by its canonical name. */
  source: string
  icon: { name: string; bytes: Uint8Array }
  appleTouchIcon?: { name: string; bytes: Uint8Array }
}

/** Make the icon files from the picture `name` names. */
export type IconMaker = (name: string) => Promise<MadeIcons>

/** Raised when the name does not mean exactly one picture, or it cannot be made into an icon. */
export class IconSourceError extends Error {
  constructor(
    readonly code: 'NOT_FOUND' | 'SCHEMA_INVALID',
    message: string,
  ) {
    super(message)
    this.name = 'IconSourceError'
  }
}

/** The crop that takes the centred square out of a `width` × `height` picture. */
export function centredSquare(width: number, height: number): EditOp[] {
  if (width === height || width <= 0 || height <= 0) return []
  const trim = (1 - Math.min(width, height) / Math.max(width, height)) / 2
  return width > height ? [{ op: 'crop', left: trim, right: trim }] : [{ op: 'crop', top: trim, bottom: trim }]
}

/** An {@link IconMaker} over these pictures, cut by this renderer. */
export function iconMaker(images: ImageLibrary, renderer: ImageRenderer): IconMaker {
  return async (name) => {
    const { match, candidates } = resolveStoredImage(name, await images.list())
    if (!match) {
      throw new IconSourceError(
        'NOT_FOUND',
        candidates.length > 1
          ? `'${name}' is the name of ${candidates.length} pictures: ` +
              `${candidates.map((c) => `'${c.name}'`).join(', ')}. Ask again with one of those.`
          : `there is no picture called '${name}' on the site or in the Library.`,
      )
    }
    // AS IT CURRENTLY STANDS, so a crop the client made is the icon they get.
    const bytes = await images.read(match, { original: false })
    try {
      const size = await renderer.measure(bytes, match.mediaType)
      const crop = centredSquare(size.width, size.height)
      const square = async (px: number): Promise<Uint8Array> =>
        (await renderer.render(bytes, match.mediaType, crop, { width: px, type: 'image/png' })).bytes
      const [icon, touch] = await Promise.all([square(FAVICON_PX), square(APPLE_TOUCH_ICON_PX)])
      return {
        source: match.name,
        icon: { name: FAVICON_ASSET, bytes: icon },
        appleTouchIcon: { name: APPLE_TOUCH_ICON_ASSET, bytes: touch },
      }
    } catch (error) {
      if (match.mediaType === 'image/svg+xml') {
        return { source: match.name, icon: { name: FAVICON_SVG_ASSET, bytes } }
      }
      throw new IconSourceError(
        'SCHEMA_INVALID',
        `'${match.name}' could not be made into an icon: ` +
          `${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
}
