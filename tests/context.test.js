// Goal & Context gauge — Paris target + region averages (evaluation-and-metrics.md §1.3).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('./_setup.js');

const f2 = (n) => Number(n.toFixed(2));

test('Paris-aligned daily target ≈ 6.3 kg (2300 / 365)', () => {
  assert.equal(f2(app.dailyTarget()), f2(2300 / 365));
});

test('direct region mappings (US / India / China)', () => {
  assert.equal(f2(app.regionDailyAvg('us')), f2(14700 / 365));
  assert.equal(f2(app.regionDailyAvg('india')), f2(1900 / 365));
  assert.equal(f2(app.regionDailyAvg('china')), f2(8000 / 365));
});

test('EU member states map to the EU average', () => {
  for (const r of ['france', 'germany', 'italy', 'spain', 'uk', 'eu']) {
    assert.equal(f2(app.regionDailyAvg(r)), f2(6800 / 365), r);
  }
});

test('unmapped regions fall back to the world average', () => {
  for (const r of ['brazil', 'japan', 'global', 'atlantis']) {
    assert.equal(f2(app.regionDailyAvg(r)), f2(4700 / 365), r);
  }
});

test('regionName gives a short human label', () => {
  assert.equal(app.regionName('india'), 'India');
  assert.equal(app.regionName('france'), 'EU');
  assert.equal(app.regionName('brazil'), 'global');
});
