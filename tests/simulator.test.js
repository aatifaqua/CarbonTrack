// What-if simulator — deterministic projections that never mutate real state.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('./_setup.js');

beforeEach(() => app.__reset());

function withBaseInputs() {
  const i = app.state.inputs;
  i.travel.gasolineKm = 100;
  i.travel.flightKm = 200;
  i.electricity.kwh = 50;
  i.digital.gbTransferred = 30;
  app.runCalculations();
}

test('every lever lowers (or holds) the footprint vs the base', () => {
  withBaseInputs();
  const base = app.state.results.totalLocation;
  for (const lever of app.SIM_LEVERS) {
    const copy = app.normalizeInputs(app.state.inputs);
    lever.apply(copy);
    const projected = app.computeTotals(copy).totalLocation;
    assert.ok(projected <= base + 1e-9, `${lever.id} should not increase the footprint`);
  }
});

test('levers operate on a copy — real state.inputs is never mutated', () => {
  withBaseInputs();
  const before = JSON.stringify(app.state.inputs);
  for (const lever of app.SIM_LEVERS) {
    const copy = app.normalizeInputs(app.state.inputs);
    lever.apply(copy);
    app.computeTotals(copy);
  }
  assert.equal(JSON.stringify(app.state.inputs), before);
});

test('car→EV lever moves gasoline distance onto the EV factor', () => {
  withBaseInputs();
  const ev = app.SIM_LEVERS.find((l) => l.id === 'ev');
  const copy = app.normalizeInputs(app.state.inputs);
  ev.apply(copy);
  assert.equal(copy.travel.gasolineKm, 0);
  assert.equal(copy.travel.evKm, 100);
  // EV is cleaner, so total must drop
  assert.ok(app.computeTotals(copy).totalLocation < app.state.results.totalLocation);
});

test('100% renewable lever zeroes the market-based electricity', () => {
  withBaseInputs();
  const green = app.SIM_LEVERS.find((l) => l.id === 'green');
  const copy = app.normalizeInputs(app.state.inputs);
  green.apply(copy);
  assert.equal(app.computeTotals(copy).electricityMarket, 0);
});
