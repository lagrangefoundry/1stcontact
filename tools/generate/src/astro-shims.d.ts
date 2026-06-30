/**
 * Ambient `.astro` declaration for `tsc`. The framework's module registry
 * imports `.astro` components; when this package type-checks across the package
 * boundary it needs the same ambient the framework declares for itself. The
 * real transform is done by Vite/Astro at runtime (the `1c` bin) and by
 * Vitest's Astro plugin in the UATs — `tsc` only needs the type.
 */
declare module '*.astro' {
  const Component: import('astro/runtime/server/index.js').AstroComponentFactory
  export default Component
}
