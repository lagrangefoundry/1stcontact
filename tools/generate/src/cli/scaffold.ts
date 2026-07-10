import { defaultTokens } from '@1stcontact/framework'

/**
 * Starter content for `1c new`: a minimal but valid draft exercising the
 * modules representable in a schema-valid definition today (header logo, hero,
 * footer). One `site.json` (everything but pages) and one page file.
 */

export function starterSiteJson(slug: string): Record<string, unknown> {
  return {
    id: slug,
    config: {
      businessName: slug,
      tagline: `${slug} — built with 1st Contact`,
    },
    theme: defaultTokens,
    nav: { pattern: 'top-tabs', entries: [] },
    assets: [],
  }
}

export function starterHomePage(slug: string): Record<string, unknown> {
  return {
    id: 'home',
    slug: 'home',
    title: 'Home',
    seoMeta: {
      title: `${slug} — Home`,
      description: `Welcome to ${slug}.`,
    },
    modules: [
      {
        id: 'header',
        type: 'header',
        version: 2,
        variant: 'top-nav',
        dials: {},
        content: { wordmark: { text: slug }, entries: [] },
      },
      {
        id: 'hero',
        type: 'hero',
        version: 2,
        variant: 'bg-color',
        dials: { align: 'center' },
        content: {
          eyebrow: { text: 'New site' },
          heading: { text: `Welcome to ${slug}` },
          subhead: { text: 'Edit `draft/` and run `1c render` to preview.' },
        },
      },
      {
        id: 'footer',
        type: 'footer',
        version: 1,
        variant: 'minimal',
        dials: {},
        content: { copyrightHolder: slug },
      },
    ],
  }
}
