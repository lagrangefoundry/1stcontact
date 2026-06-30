import type { NavTarget } from '@1stcontact/site-schema'

/**
 * Resolve a nav-entry target to an href. Anchors become in-page fragments;
 * pages become root-relative paths keyed by page id (the generator rewrites
 * these to real slugs in REQ-6); urls pass through.
 */
export function navHref(target: NavTarget): string {
  switch (target.kind) {
    case 'url':
      return target.href
    case 'anchor':
      return `#${target.moduleId}`
    case 'page':
      return `/${target.pageId}`
  }
}
