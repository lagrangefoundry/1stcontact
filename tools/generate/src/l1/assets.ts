/**
 * BUG-23 — bind an L1 document's asset-bearing axes to the bundle's **mirrored**
 * assets instead of the captured origin.
 *
 * The fold transcribes what the capture read, so every media handle it emits is
 * the absolute URL the original page served (`image.src`,
 * `box.axes.backgroundImageUrl`). `1c repro` mirrors the bundle's `assets/` into
 * the site's draft — but nothing rewrote the handles, so the reproduction
 * *hotlinked* the target: it rendered only while that host was up, and the
 * perceptual gate was comparing the target against a page serving the target's
 * own bytes. Hero fidelity was guaranteed by the network, not earned by the
 * pipeline, so an image-handling regression could not be detected at all.
 *
 * This module closes that hole in one place: every handle resolves to the site's
 * own `/assets/…` path, and anything that cannot resolve is a **reported gap**,
 * never a silent fallback to the origin.
 */
// REQ-157 — the deep path, not the `capture` barrel. Even as an `import type`
// this matters: the barrel re-exports `playwright-driver`, and REQ-154's bundle
// check follows every local import regardless of whether TypeScript erases it,
// because a bundler's resolution and a type checker's are not the same thing.
import type { CaptureAsset } from '../cli/capture/types'
import type { L1Document, L1Node } from '@1stcontact/site-schema'

/** Asset kinds an L1 document can reference; the rest are page subresources. */
const REFERENCEABLE = new Set<CaptureAsset['kind']>(['image', 'font'])

export interface LocalizedAssets {
  /** The document with every resolvable handle rewritten to its site-local path. */
  doc: L1Document
  /** Handles rewritten from the captured origin to the mirror, in document order. */
  rewritten: Array<{ from: string; to: string }>
  /**
   * Absolute handles with **no** mirrored counterpart in the bundle. A
   * reproduction carrying one of these is not self-contained — the caller must
   * fail rather than ship a hotlink (that is the whole point of this module).
   */
  unmirrored: string[]
  /**
   * Mirrored `image`/`font` assets no node references — the bundle carries the
   * bytes but the fold never emitted a leaf (or a `@font-face`) for them. A fold
   * gap to report, not a silent no-op.
   */
  unreferenced: string[]
}

/** True when `url` carries an explicit scheme (i.e. it is not already site-local). */
function isAbsolute(url: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url.trim())
}

/** `assets/x.png`, `./assets/x.png`, `/assets/x.png` → `assets/x.png`. */
function normalizeLocal(url: string): string {
  return url.trim().replace(/^\.?\//, '')
}

/**
 * Rewrite every asset handle in `doc` to the site-local mirror of the bundle
 * `assets`, and account for what did not resolve on either side. Pure: the input
 * document is not mutated.
 */
export function localizeAssets(doc: L1Document, assets: readonly CaptureAsset[]): LocalizedAssets {
  const byOrigin = new Map(assets.map((a) => [a.src, a.localPath]))
  const mirrored = new Set(assets.map((a) => a.localPath))
  const referenced = new Set<string>()
  const rewritten: Array<{ from: string; to: string }> = []
  const unmirrored: string[] = []

  const resolve = (url: string): string => {
    if (isAbsolute(url)) {
      const local = byOrigin.get(url.trim())
      if (local === undefined) {
        unmirrored.push(url)
        return url
      }
      referenced.add(local)
      rewritten.push({ from: url, to: `/${local}` })
      return `/${local}`
    }
    // Already site-local (mirrored font faces come through this way). Normalize
    // to root-relative so the handle resolves the same from any page depth.
    const local = normalizeLocal(url)
    if (mirrored.has(local)) referenced.add(local)
    return `/${local}`
  }

  const walk = (node: L1Node): L1Node => {
    let next: L1Node = node.kind === 'image' ? { ...node, src: resolve(node.src) } : { ...node }
    // REQ-98 — `backgroundImageUrl` is part of the shared surface group, so ANY
    // kind can carry one. Resolving it only on a `box` would silently hotlink the
    // target from a painted container/slot — the exact hole this module closes.
    const axes = next.axes
    if (axes?.backgroundImageUrl !== undefined) {
      next = {
        ...next,
        axes: { ...axes, backgroundImageUrl: resolve(axes.backgroundImageUrl) },
      } as L1Node
    }
    if (next.kind === 'box' && next.children) next.children = next.children.map(walk)
    else if (next.kind === 'container') next.children = next.children.map(walk)
    return next
  }

  const next: L1Document = { ...doc, root: walk(doc.root) as L1Document['root'] }
  if (doc.resources?.fonts?.length) {
    next.resources = {
      ...doc.resources,
      fonts: doc.resources.fonts.map((f) => ({ ...f, src: resolve(f.src) })),
    }
  }

  const unreferenced = assets
    .filter((a) => REFERENCEABLE.has(a.kind) && !referenced.has(a.localPath))
    .map((a) => a.localPath)

  return { doc: next, rewritten, unmirrored, unreferenced }
}
