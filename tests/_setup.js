// Minimal browser stubs so the vanilla, build-free `app.js` can be `require()`d in Node.
// Only the globals app.js touches are stubbed; DOM-rendering functions aren't exercised
// by the unit tests (we test the pure, deterministic logic).

const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; }
};

const noop = () => {};
const fakeEl = {
  setAttribute: noop, getAttribute: () => 'light',
  classList: { add: noop, remove: noop, toggle: noop, replace: noop },
  style: {}, addEventListener: noop, querySelectorAll: () => [],
  focus: noop, innerHTML: '', textContent: '', value: ''
};
global.document = {
  addEventListener: noop,
  getElementById: () => null,
  querySelectorAll: () => [],
  documentElement: fakeEl,
  body: { classList: { add: noop, remove: noop } }
};
global.window = {};
global.getComputedStyle = () => ({ getPropertyValue: () => '' });

const app = require('../app.js');

// Reset helpers shared by tests that mutate persistent state.
app.__store = store;
app.__reset = () => {
  store && Object.keys(store).forEach((k) => delete store[k]);
  app.state.inputs = app.blankInputs();
  app.state.selectedDate = app.todayStr();
  app.state.settings.unit = 'km';
  app.runCalculations();
};

module.exports = app;
