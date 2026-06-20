// Regression: the coach-plan cache key must capture the sector breakdown + offset,
// not just the total — otherwise a changed breakdown returns a stale (wrong) plan.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('./_setup.js');

beforeEach(() => app.__reset());

function setBreakdown({ gasolineKm = 0, kwh = 0, gridRegion = 'global', offset = 0, gb = 0 }) {
  const i = app.state.inputs;
  i.travel.gasolineKm = gasolineKm;
  i.electricity.kwh = kwh;
  i.electricity.gridRegion = gridRegion;
  i.electricity.offsetPercentage = offset;
  i.digital.gbTransferred = gb;
  app.runCalculations();
}

test('same total but different sector mix → different cache keys', () => {
  // ~17 kg from travel only
  setBreakdown({ gasolineKm: 100 });
  const travelHeavy = app.coachCacheKey();
  // ~17 kg from electricity only (100 kWh × 0.17? no — pick values giving same total)
  setBreakdown({ kwh: 100, gridRegion: 'india' }); // 100 × 0.82 = 82 ... use a matching total instead
  // make electricity total ≈ travel total (17) → 17 / 0.478 ≈ 35.56 kWh global
  setBreakdown({ kwh: 17 / 0.478 });
  const elecHeavy = app.coachCacheKey();
  assert.notEqual(travelHeavy, elecHeavy, 'breakdown must affect the key');
});

test('changing only the offset changes the key (was previously ignored)', () => {
  setBreakdown({ kwh: 50, offset: 0 });
  const a = app.coachCacheKey();
  setBreakdown({ kwh: 50, offset: 100 });
  const b = app.coachCacheKey();
  assert.notEqual(a, b);
});

test('identical inputs → identical key (cache still hits)', () => {
  setBreakdown({ gasolineKm: 40, kwh: 10, gb: 20 });
  const a = app.coachCacheKey();
  setBreakdown({ gasolineKm: 40, kwh: 10, gb: 20 });
  assert.equal(app.coachCacheKey(), a);
});
