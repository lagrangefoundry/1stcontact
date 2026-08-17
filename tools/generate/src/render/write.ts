import path from 'node:path'
import type { LoadedSite } from '../store/loadSite'
import { copyDir, emptyDir, pathExists, writeText } from '../store/fsutil'
import { getModule } from '@1stcontact/framework/registry'
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
 * IT IS ALSO WHERE THE MODULE RESOLVER NOW LIVES. `getModule` reaches the
 * registry and its two `.astro` imports, so naming it from `render.ts` would put
 * them in the Worker's bundle — a bundler resolves a static specifier at build
 * time, so even a dynamic `import()` behind an untaken branch would be pulled
 * in. This file is node-only by construction, which makes it the right place to
 * supply the default; the Worker supplies none and renders L1, which is exactly
 * the boundary REQ-148 moves.
 */

/**
 * The Astro container, created on demand (REQ-89, REQ-145).
 *
 * Exported because a caller that renders a behavior module through
 * {@link renderSiteFiles} directly — the conformance harness, a UAT — needs the
 * same one, and because this is the single place in the repository that names
 * `astro/container` outside Astro's own build. Anything importing this file is
 * node-only, which is the property that makes the import safe here and unsafe in
 * `render.ts`.
 */
export async function astroContainer() {
  const { experimental_AstroContainer } = await import('astro/container')
  return experimental_AstroContainer.create()
}

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
  const rendered = await renderSiteFiles(loaded, {
    resolveModule: getModule,
    createContainer: astroContainer,
    ...opts,
  })
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
