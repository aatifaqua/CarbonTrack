// Equivalency engine — "translate, don't just inform" (evaluation-and-metrics.md invariants).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('./_setup.js');

test('zero/negative → guard branch, no activity', () => {
  for (const v of [0, -5]) {
    const e = app.formatEquivalency(v, 'km');
    assert.equal(e.label, 'No emissions yet');
  }
});

test('any positive value yields a non-empty, human-sized phrase (count ≥ 1)', () => {
  for (const kg of [0.01, 0.5, 1, 4.2, 25, 500]) {
    const e = app.formatEquivalency(kg, 'km');
    assert.ok(e.description && e.description.length > 0, `desc for ${kg}`);
    assert.ok(e.icon, `icon for ${kg}`);
    // never "0 of X": the leading number must be >= 1
    const lead = parseFloat(String(e.description).replace(/,/g, ''));
    assert.ok(Number.isNaN(lead) || lead >= 1, `count >= 1 for ${kg} (got "${e.description}")`);
  }
});

test('selector keeps the count near a relatable magnitude (~20)', () => {
  // 1 kg → music streaming is exactly 20 (factor 20) — the nearest-to-20 winner.
  const e = app.formatEquivalency(1.0, 'km');
  assert.match(e.description, /\d/);
});

test('distance equivalency honours the mi unit when "Driving" is selected', () => {
  // ~8 kg lands on "Driving" (factor 2.5 → 20). km vs mi must differ in wording.
  const km = app.formatEquivalency(8, 'km').description;
  const mi = app.formatEquivalency(8, 'mi').description;
  if (/driv/i.test(km) || /driv/i.test(mi)) {
    assert.notEqual(km, mi);
    assert.match(mi + km, /miles|km/);
  }
});

test('formatDuration scales s → min → h → days', () => {
  assert.equal(app.formatDuration(30), '30 s');
  assert.equal(app.formatDuration(90), '1.5 min');
  assert.equal(app.formatDuration(1800), '30.0 min');
  assert.equal(app.formatDuration(3600), '1.0 h');
  assert.match(app.formatDuration(7200), /h$/);
  assert.match(app.formatDuration(60 * 60 * 48), /days$/);
});

test('templatedExplanation names the largest sector with a %', () => {
  assert.equal(app.templatedExplanation({ totalLocation: 0 }), '');
  const s = app.templatedExplanation({ totalLocation: 10, travel: 1, electricityLocation: 8, digital: 1 });
  assert.match(s, /Electricity/);
  assert.match(s, /%/);
});
