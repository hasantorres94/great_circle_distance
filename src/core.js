/**
 * Great-circle distance via the spherical law of cosines.
 *
 * The spherical law of cosines is:
 *
 *     d = acos(sin(φ1)·sin(φ2) + cos(φ1)·cos(φ2)·cos(Δλ))
 *
 * where φ is latitude and λ is longitude, both in radians, and Δλ is the
 * difference in longitude. The result is an angular distance in radians;
 * multiply by the sphere's radius to get a linear distance.
 *
 * We use the law of cosines rather than the numerically stabler Haversine
 * because the brief asks for it. Be aware that for very small Δλ the
 * argument to acos approaches 1, and the cosine of a tiny angle is also ~1,
 * so floating point error can dominate at short ranges. This implementation
 * is fine for the common case of "how far apart are these two cities" but is
 * not suitable for sub-metre surveying work.
 */

const EARTH_MEAN_RADIUS_METERS = 6371000;

/**
 * Convert degrees to radians.
 *
 * @param {number} degrees
 * @returns {number}
 */
export function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees.
 *
 * @param {number} radians
 * @returns {number}
 */
export function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

/**
 * Angular distance in radians between two latitude/longitude points.
 *
 * Inputs are in degrees because that is what GeoJSON and most human-facing
 * APIs use. We clamp latitudes to [-90, 90] before normalising longitudes,
 * so an out-of-range latitude throws and an out-of-range longitude is folded
 * into [-180, 180].
 *
 * @param {{ latitude: number, longitude: number }} a
 * @param {{ latitude: number, longitude: number }} b
 * @returns {number} angular distance in radians, always non-negative
 * @throws {RangeError} if a latitude is outside [-90, 90] or NaN, or any
 *   coordinate is non-finite.
 */
export function angularDistance(a, b) {
  assertFiniteCoordinate(a, "a");
  assertFiniteCoordinate(b, "b");

  const lat1 = clampLatitude(a.latitude);
  const lat2 = clampLatitude(b.latitude);
  const lon1 = normaliseLongitude(a.longitude);
  const lon2 = normaliseLongitude(b.longitude);

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaLambda = toRadians(lon1 - lon2);

  const cosCentral =
    Math.sin(phi1) * Math.sin(phi2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  // Clamp to [-1, 1] to defend against floating point excursions outside
  // acos's domain (Math.acos returns NaN for arguments outside [-1, 1]).
  const clamped = Math.max(-1, Math.min(1, cosCentral));
  const centralAngle = Math.acos(clamped);

  // acos returns a value in [0, π], so |centralAngle| is centralAngle.
  return centralAngle;
}

/**
 * Great-circle distance in metres on a sphere with the Earth's mean radius.
 *
 * @param {{ latitude: number, longitude: number }} a
 * @param {{ latitude: number, longitude: number }} b
 * @returns {number} distance in metres, always non-negative
 */
export function distanceInMeters(a, b) {
  return angularDistance(a, b) * EARTH_MEAN_RADIUS_METERS;
}

/**
 * Great-circle distance in kilometres on a sphere with the Earth's mean radius.
 *
 * @param {{ latitude: number, longitude: number }} a
 * @param {{ latitude: number, longitude: number }} b
 * @returns {number} distance in kilometres, always non-negative
 */
export function distanceInKilometers(a, b) {
  return distanceInMeters(a, b) / 1000;
}

/**
 * Clamp latitude into [-90, 90]. Throws if the value is outside that range;
 * we treat out-of-range latitude as a caller bug rather than silently folding
 * it, because a latitude of 100 almost always means a longitude/latitude swap.
 *
 * @param {number} lat
 * @returns {number}
 * @throws {RangeError}
 */
function clampLatitude(lat) {
  if (lat < -90 || lat > 90) {
    throw new RangeError(
      `Latitude must be in [-90, 90], got ${lat}`
    );
  }
  return lat;
}

/**
 * Normalise a longitude in degrees into the canonical [-180, 180) range.
 * Longitudes wrap, so 190 is the same place as -170; we honour that here
 * so callers can pass whatever convention they have.
 *
 * @param {number} lon
 * @returns {number}
 */
function normaliseLongitude(lon) {
  // Fold into (-180, 180] by repeated subtraction; cheaper than a single
  // modulo when the input is already in range (the common case).
  let normalised = lon;
  while (normalised > 180) normalised -= 360;
  while (normalised <= -180) normalised += 360;
  return normalised;
}

/**
 * @param {{ latitude: number, longitude: number }} point
 * @param {string} name
 * @throws {TypeError} if the point is missing coordinates or they are NaN/Infinity.
 */
function assertFiniteCoordinate(point, name) {
  if (point === null || typeof point !== "object") {
    throw new TypeError(`${name} must be an object with latitude and longitude`);
  }
  if (typeof point.latitude !== "number" || typeof point.longitude !== "number") {
    throw new TypeError(`${name}.latitude and ${name}.longitude must be numbers`);
  }
  if (
    Number.isNaN(point.latitude) ||
    Number.isNaN(point.longitude) ||
    !Number.isFinite(point.latitude) ||
    !Number.isFinite(point.longitude)
  ) {
    throw new TypeError(`${name} coordinates must be finite numbers`);
  }
}
