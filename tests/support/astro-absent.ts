import { createRequire } from 'node:module'
import { expect } from 'vitest'

/**
 * The successor to `vi.spyOn(experimental_AstroContainer, 'create')`.
 *
 * While the behavior modules were `.astro` components, "Astro was not engaged by
 * this render" was measured by spying on the container factory and asserting it
 * was never called. REQ-148 made the modules plain functions and REQ-150 removed
 * the `astro` dependency altogether, which takes the spy's own subject away —
 * there is nothing left to attach a spy to.
 *
 * What replaces it is a stronger form of the same claim. The spy could only ever
 * answer "no container was constructed during THIS render"; the resolution check
 * below answers "no container can be constructed by ANY render, because the
 * package is not on disk". A single render passing the old assertion left open
 * the possibility of some other input path reaching Astro; there is no such path
 * to leave open once the module cannot be resolved.
 *
 * Resolution goes through `createRequire` rather than `import()` on purpose: it
 * is a plain runtime lookup against node's own algorithm, so no bundler ever
 * sees a specifier it might try to pre-resolve, rewrite, or fail the transform
 * on. `astro/container` is named specifically — the subpath the spy imported —
 * rather than the bare package, so the check stays anchored to the thing whose
 * absence is being claimed.
 */
export function expectNoAstroContainerToConstruct(): void {
  const require = createRequire(import.meta.url)
  expect(() => require.resolve('astro/container')).toThrow(/Cannot find module|MODULE_NOT_FOUND/)
}
