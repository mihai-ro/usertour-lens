<p align="center">
  <img src="icons/icon128.png" width="128" height="128" alt="Lens icon">
  <h1 align="center">Usertour Lens</h1>
  
  Built on top of <a href="https://github.com/mihai-ro/domlens">DOMLens</a> — a Chrome extension for picking DOM elements and generating CSS selectors, XPath, and Playwright locators. Built specifically for the Usertour builder.
</p>

## Why?

Writing CSS selectors requires technical knowledge. Most Usertour creators don't know how to write selectors — they either guess, guess wrong, or reach out to a developer for help. This extension lets you visually pick any element on the page without leaving the Usertour builder interface.

## Features

- **Smart selectors** — Prioritizes test attributes (data-testid, data-cy), clean IDs, semantic attributes, and ARIA labels
- **Confidence scoring** — Shows whether the selector is high, medium, or low confidence
- **Three formats** — CSS selectors, XPath, and Playwright locators
- **Match counting** — Warns if a selector matches multiple elements
- **History navigation** — Browse through previously picked elements
- **Usertour integration** — Picks elements inside the Usertour builder iframe

## Install

1. Clone the repository
2. Open `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `lens-usertour` directory

## Usage

1. Press `Alt+Shift+L` or click the extension icon to start
2. Hover over any element to see its selector
3. Click to lock the selection and copy to clipboard
4. Use the format toggle (CSS / XPath / Playwright) to switch output formats
5. Press `Escape` to dismiss

## Development

```bash
npm install
npm run lint      # ESLint
npm run format    # Prettier
npm test          # Run tests
npm run package   # Build zip
```

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

For commercial use, see the [COMMERCIAL_LICENSE](COMMERCIAL_LICENSE) file.
