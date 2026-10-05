import { test } from "node:test";
import * as assert from "node:assert/strict";
import {
  angularDistance,
  distanceInMeters,
  distanceInKilometers,
  toRadians,
  toDegrees,
} from "../src/core.js";

const EARTH_MEAN_RADIUS_METERS = 6371000;

/**
 * Compare two floats within a relative tolerance. Comparing with === is the
 * classic way to write a flaky test; we avoid it.
 */
function approxEqual(actual, expected, relTol = 1e-9) {
  const absTol = relTol * Math.max(Math.abs(actual), Math.abs(expected), 1);
  return Math.abs(actual - expected) <= absTol;
}

test("toRadians and toDegrees are inverses", () => {
  for (const deg of [0, 45, 90, -90, 180, -180, 359.999]) {
    assert.ok(approxEqual(toDegrees(toRadians(deg)), deg));
  }
});

test("distance from a point to itself is zero", () => {
  const p = { latitude: 51.5, longitude: -0.12 };
  assert.equal(angularDistance(p, p), 0);
  assert.equal(distanceInMeters(p, p), 0);
  assert.equal(distanceInKilometers(p, p), 0);
});

test("distance is symmetric", () => {
  const a = { latitude: 51.5074, longitude: -0.1278 };
  const b = { latitude: 48.8566, longitude: 2.3522 };
  assert.ok(approxEqual(distanceInMeters(a, b), distanceInMeters(b, a)));
});

test("London to Paris is approximately 344 km", () => {
  const london = { latitude: 51.5074, longitude: -0.1278 };
  const paris = { latitude: 48.8566, longitude: 2.3522 };
  const km = distanceInKilometers(london, paris);
  // Known reference value to within ~1% (varies with the Earth radius chosen).
  assert.ok(Math.abs(km - 344) < 5, `expected ~344 km, got ${km}`);
});

test("antipodal points give a half-circumference distance", () => {
  const a = { latitude: 0, longitude: 0 };
  const b = { latitude: 0, longitude: 180 };
  const expectedMeters = Math.PI * EARTH_MEAN_RADIUS_METERS;
  const got = distanceInMeters(a, b);
  assert.ok(
    approxEqual(got, expectedMeters, 1e-9),
    `expected ${expectedMeters}, got ${got}`
  );
});

test("north pole to south pole is half circumference", () => {
  const north = { latitude: 90, longitude: 0 };
  const south = { latitude: -90, longitude: 0 };
  const expectedMeters = Math.PI * EARTH_MEAN_RADIUS_METERS;
  assert.ok(approxEqual(distanceInMeters(north, south), expectedMeters));
});

test("longitude wraps: 190 deg equals -170 deg", () => {
  const a = { latitude: 0, longitude: 0 };
  const b1 = { latitude: 0, longitude: -170 };
  const b2 = { latitude: 0, longitude: 190 };
  assert.ok(approxEqual(distanceInMeters(a, b1), distanceInMeters(a, b2)));
});

test("distance is always non-negative", () => {
  const a = { latitude: -33.8688, longitude: 151.2093 };
  const b = { latitude: 40.7128, longitude: -74.006 };
  assert.ok(distanceInMeters(a, b) >= 0);
});

test("latitude out of range throws RangeError", () => {
  const a = { latitude: 0, longitude: 0 };
  const bad = { latitude: 100, longitude: 0 };
  assert.throws(() => angularDistance(a, bad), RangeError);
  assert.throws(() => angularDistance(bad, a), RangeError);
  assert.throws(
    () => angularDistance(a, { latitude: -91, longitude: 0 }),
    RangeError
  );
});

test("non-finite coordinates throw TypeError", () => {
  const a = { latitude: 0, longitude: 0 };
  for (const bad of [
    { latitude: NaN, longitude: 0 },
    { latitude: 0, longitude: NaN },
    { latitude: Infinity, longitude: 0 },
    { latitude: 0, longitude: -Infinity },
  ]) {
    assert.throws(() => angularDistance(a, bad), TypeError);
    assert.throws(() => angularDistance(bad, a), TypeError);
  }
});

test("missing coordinates throw TypeError", () => {
  const a = { latitude: 0, longitude: 0 };
  assert.throws(() => angularDistance(a, { latitude: 0 }), TypeError);
  assert.throws(() => angularDistance(a, { longitude: 0 }), TypeError);
  assert.throws(() => angularDistance(a, {}), TypeError);
  assert.throws(() => angularDistance(a, null), TypeError);
});

test("equatorial one-degree arc is about 111.19 km", () => {
  const a = { latitude: 0, longitude: 0 };
  const b = { latitude: 0, longitude: 1 };
  const km = distanceInKilometers(a, b);
  // πR/180 with R=6371 km ≈ 111.1949 km.
  assert.ok(Math.abs(km - 111.195) < 0.01, `expected ~111.195 km, got ${km}`);
});
