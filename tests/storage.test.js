// Per-day storage, legacy migration, future-date blocking, and unit conversion.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('./_setup.js');

beforeEach(() => app.__reset());

test('legacy single-snapshot ct_state migrates into today\'s log + settings', () => {
  app.__store['ct_state'] = JSON.stringify({
    inputs: { travel: { gasolineKm: 100 } },
    settings: { unit: 'mi' }
  });
  app.loadFromStorage();
  assert.equal(app.state.settings.unit, 'mi');
  assert.equal(app.state.selectedDate, app.todayStr());
  assert.equal(app.state.inputs.travel.gasolineKm, 100);
  assert.equal(JSON.parse(app.__store['ct_logs'])[app.todayStr()].travel.gasolineKm, 100);
});

test('each day is an isolated log', () => {
  app.loadFromStorage();
  const today = app.state.selectedDate;
  const yest = app.shiftDate(today, -1);
  app.updateState('inputs.travel.gasolineKm', 100);
  app.loadDay(yest);
  app.updateState('inputs.travel.trainKm', 50);
  const logs = JSON.parse(app.__store['ct_logs']);
  assert.equal(logs[today].travel.gasolineKm, 100);
  assert.equal(logs[yest].travel.trainKm, 50);
  assert.equal(app.state.inputs.travel.gasolineKm, 0); // yesterday didn't inherit today's drive
});

test('future dates are blocked', () => {
  app.loadFromStorage();
  const before = app.state.selectedDate;
  app.loadDay(app.shiftDate(app.todayStr(), 1));
  assert.equal(app.state.selectedDate, before);
});

test('switching to an empty day carries the grid region forward', () => {
  app.loadFromStorage();
  app.updateState('inputs.electricity.gridRegion', 'india');
  app.loadDay(app.shiftDate(app.todayStr(), -1));
  assert.equal(app.state.inputs.electricity.gridRegion, 'india');
});

test('unit conversion round-trips (km is canonical)', () => {
  app.state.settings.unit = 'mi';
  const km = 24;
  const shownMi = app.toDisplay(km);
  assert.ok(Math.abs(shownMi - km / app.KM_PER_MILE) < 1e-9);
  assert.ok(Math.abs(app.fromDisplay(shownMi) - km) < 1e-9); // back to canonical km
  app.state.settings.unit = 'km';
  assert.equal(app.toDisplay(km), km); // metric is identity
});

test('fmtNum trims noise but keeps integers clean', () => {
  assert.equal(app.fmtNum(24), '24');
  assert.equal(app.fmtNum(14.913), '14.91');
});
