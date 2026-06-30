/**
 * Ambient declaration so plain `tsc` understands `.astro` imports in the
 * registry. The actual `.astro` transform is done by the consuming app's Astro
 * build (and by Vitest's Astro plugin in tests) — `tsc` only needs the type.
 *
 * The default export is typed as Astro's `AstroComponentFactory`, which is what
 * the container API's `renderToString` accepts.
 */
declare module '*.astro' {
  const Component: import('astro/runtime/server/index.js').AstroComponentFactory
  export default Component
}
