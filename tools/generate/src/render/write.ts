import path from 'node:path'
import type { LoadedSite } from '../store/loadSite'
import { copyDir, emptyDir, pathExists, writeText } from '../store/fsutil'
import { renderSiteFiles, type RenderSiteOptions } from './render'

/**
 * The filesystem writer over the render (REQ-145).
 *
 * WHY THIS IS ITS OWN FILE. `render.ts` is now imported by a Worker, and a
 * Worker has no filesystem. `node:fs` under `nodejs_compat` is a shim that
 * resolves and then answers nothing useful, so leaving these four lines in
 * `render.ts` would not have failed at import — it would have failed later, in a
 * request, as a render that silently wrote nowhere. Splitting the writer out
 * means the workerd path cannot reach a filesystem call at all, which is a
 * property of the module graph rather than of anyone's discipline.
 *
 * Nothing about the render moved. {@link renderSiteFiles} still decides every
 * byte; this is the same thin writer it always was, in a file whose imports
 * declare what it needs.
 *
 * IT NO LONGER INJECTS ANYTHING (REQ-148). It used to supply the two seams a
 * Worker could not reach — an Astro container, and the module resolver that
 * reached the `.astro`-bound registry. Behavior components are plain TypeScript
 * functions now, so there is no container at all and the registry is portable:
 * `render.ts` names `getModule` itself, and `renderSiteFilesNode` (which existed
 * only to hold those two defaults) is gone with them.
 */

/**
 * Render `loaded` to `outDir`. The directory is emptied first so stale pages
 * never linger. Writes `<slug>.html` per page, an `index.html` alias for the
 * home page, the per-site `theme.css`, and copies `assets/` through.
 *
 * A thin writer over {@link renderSiteFiles} — every byte it emits is decided
 * there, so `1c render` and the builder's request-time preview cannot drift.
 */
export async function renderSite(
  loaded: LoadedSite,
  outDir: string,
  opts: RenderSiteOptions = {},
): Promise<string[]> {
  const rendered = await renderSiteFiles(loaded, opts)
  emptyDir(outDir)
  for (const [rel, text] of rendered.files) {
    writeText(path.join(outDir, rel), text)
  }

  const assetsSrc = path.join(loaded.sourceDir, 'assets')
  if (pathExists(assetsSrc)) {
    copyDir(assetsSrc, path.join(outDir, 'assets'))
  }

  return rendered.pages
}
