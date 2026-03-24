// Lens — shared picker state

const LN_STATE = {
  started: false,
  hoveredEl: null,
  lockedEl: null,
  format: 'css', // "css" | "xpath" | "playwright"
  history: [], // array of pick items
  historyIdx: -1,
};
