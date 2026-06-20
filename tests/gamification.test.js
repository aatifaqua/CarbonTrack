// Eco-Actions: streak, cumulative saved, tiers (evaluation-and-metrics.md §2 invariants).
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('./_setup.js');

const f1 = (n) => Number(n.toFixed(1));
beforeEach(() => app.__reset());

test('daySaved sums the savings of completed actions on a day', () => {
  const today = app.todayStr();
  app.__store['ct_actions'] = JSON.stringify({ [today]: ['bike-short', 'led'] }); // 2.1 + 0.8
  assert.equal(f1(app.daySaved(today)), 2.9);
});

test('cumulativeSaved sums across every logged day', () => {
  const today = app.todayStr();
  const yest = app.shiftDate(today, -1);
  app.__store['ct_actions'] = JSON.stringify({ [today]: ['bike-short', 'led'], [yest]: ['meatless'] }); // 2.9 + 5.2
  assert.equal(f1(app.cumulativeSaved()), 8.1);
});

test('currentStreak counts consecutive days with ≥1 completion', () => {
  const today = app.todayStr();
  app.__store['ct_actions'] = JSON.stringify({
    [today]: ['led'], [app.shiftDate(today, -1)]: ['meatless'], [app.shiftDate(today, -2)]: ['bike-short']
  });
  assert.equal(app.currentStreak(), 3);
});

test('streak still counts when today is empty but yesterday is logged', () => {
  const today = app.todayStr();
  app.__store['ct_actions'] = JSON.stringify({ [app.shiftDate(today, -1)]: ['led'] });
  assert.equal(app.currentStreak(), 1);
});

test('a gap breaks the streak', () => {
  const today = app.todayStr();
  app.__store['ct_actions'] = JSON.stringify({ [today]: ['led'], [app.shiftDate(today, -2)]: ['led'] });
  assert.equal(app.currentStreak(), 1);
});

test('tierFor crosses the documented thresholds', () => {
  assert.equal(app.tierFor(0).label, 'Seedling');
  assert.equal(app.tierFor(24).label, 'Seedling');
  assert.equal(app.tierFor(25).label, 'Sprout');
  assert.equal(app.tierFor(100).label, 'Sapling');
  assert.equal(app.tierFor(300).label, 'Tree');
  assert.equal(app.tierFor(800).label, 'Forest Guardian');
});

test('nextTier points at the next rung (or null at the top)', () => {
  assert.equal(app.nextTier(0).label, 'Sprout');
  assert.equal(app.nextTier(800), null);
});
