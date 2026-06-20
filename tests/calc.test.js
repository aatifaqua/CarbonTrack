// Deterministic calculator baselines — mirrors evaluation-and-metrics.md §2 (TC-1…8).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('./_setup.js');

const f2 = (n) => Number(n.toFixed(2));
function inputs(mut) {
  const i = app.blankInputs();
  mut(i);
  return i;
}

test('TC-1 · gasolineKm=100 → 17.00', () => {
  const r = app.computeTotals(inputs((i) => { i.travel.gasolineKm = 100; }));
  assert.equal(f2(r.travel), 17.0);
  assert.equal(f2(r.totalLocation), 17.0);
});

test('TC-2 · trainKm=100 → 4.00', () => {
  assert.equal(f2(app.computeTotals(inputs((i) => { i.travel.trainKm = 100; })).totalLocation), 4.0);
});

test('TC-3 · kwh=100, grid=india → 82.00', () => {
  const r = app.computeTotals(inputs((i) => { i.electricity.kwh = 100; i.electricity.gridRegion = 'india'; }));
  assert.equal(f2(r.totalLocation), 82.0);
});

test('TC-4 · kwh=100, grid=us, offset=50% → loc 37.00 / mkt 18.50', () => {
  const r = app.computeTotals(inputs((i) => {
    i.electricity.kwh = 100; i.electricity.gridRegion = 'us'; i.electricity.offsetPercentage = 50;
  }));
  assert.equal(f2(r.totalLocation), 37.0);
  assert.equal(f2(r.totalMarket), 18.5);
});

test('TC-5 · gbTransferred=50 → 3.00', () => {
  assert.equal(f2(app.computeTotals(inputs((i) => { i.digital.gbTransferred = 50; })).totalLocation), 3.0);
});

test('TC-6 · gasolineKm=40, kwh=10(global), gb=20 → 12.78', () => {
  const r = app.computeTotals(inputs((i) => {
    i.travel.gasolineKm = 40; i.electricity.kwh = 10; i.digital.gbTransferred = 20;
  }));
  assert.equal(f2(r.totalLocation), 12.78); // 6.8 + 4.78 + 1.20
});

test('TC-7 · motorbikeKm=50, busKm=20 → 6.60', () => {
  const r = app.computeTotals(inputs((i) => { i.travel.motorbikeKm = 50; i.travel.busKm = 20; }));
  assert.equal(f2(r.totalLocation), 6.6);
});

test('TC-8 · laptopHr=10, desktopHr=5, grid=global → 0.72', () => {
  const r = app.computeTotals(inputs((i) => { i.electricity.laptopHr = 10; i.electricity.desktopHr = 5; }));
  assert.equal(f2(r.totalLocation), 0.72);
});

test('unknown grid region falls back to global (0.478)', () => {
  const r = app.computeTotals(inputs((i) => { i.electricity.kwh = 100; i.electricity.gridRegion = 'atlantis'; }));
  assert.equal(f2(r.totalLocation), 47.8);
});

test('missing/undefined fields are treated as 0 (no NaN)', () => {
  const r = app.computeTotals({ travel: {}, electricity: {}, digital: {} });
  assert.equal(r.totalLocation, 0);
  assert.ok(Number.isFinite(r.totalMarket));
});
