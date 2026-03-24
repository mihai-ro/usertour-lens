// Lens — configuration

const LN_CONFIG = {
  USERTOUR_HOST: 'app.usertour.io',

  SELECTOR_INPUT_ID: 'css-selector',
  BUILDER_ROUTE_RE:
    /\/env\/[^/]+(?:flows|launchers)\/[^/]+\/builder\/|\/(?:flows|launchers)\/[^/]+\/builder\//,
  CSS_SELECTOR_LABEL: 'CSS selector',

  // Automation / testing attributes — developer intent, no uniqueness check needed.
  // Ordered by ecosystem prevalence.
  TEST_ATTRS: [
    'data-testid', // Playwright, Testing Library
    'data-test-id', // alternative spelling
    'data-test', // generic
    'data-cy', // Cypress
    'data-e2e', // end-to-end generic
    'data-e2e-id',
    'data-qa', // QA teams
    'data-qa-id',
    'data-automation',
    'data-automation-id',
    'data-hook', // Wix / custom frameworks
    'data-id', // lightweight custom attr
  ],

  // Semantic keywords in data-* attribute NAMES that signal intentional identity.
  // Used by the dynamic data-attr scorer in selector.js.
  SEMANTIC_DATA_KEYS: [
    'component',
    'section',
    'view',
    'entity',
    'widget',
    'module',
    'block',
    'feature',
    'page',
    'screen',
    'panel',
    'region',
    'area',
    'scope',
    'zone',
    'action',
    'variant',
    'slot',
    'name',
    'key',
  ],

  // Semantic HTML elements that are likely unique on a page.
  SEMANTIC_TAGS: [
    'main',
    'nav',
    'header',
    'footer',
    'aside',
    'article',
    'section',
    'form',
    'dialog',
    'details',
    'summary',
    'figure',
    'table',
    'h1',
    'h2',
  ],

  SELECTOR_MAX_DEPTH: 5,
};

const LN_SVG_START =
  '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
const LN_SVG_PAUSE =
  '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="6" x2="6" y1="4" y2="20"/><line x1="18" x2="18" y1="4" y2="20"/></svg>';
