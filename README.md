# Great Circle Distance

Computes the shortest distance between two latitude-longitude points on a sphere using the spherical law of cosines.

## Usage

```js
import { distanceInKilometers } from "great-circle-distance";

const london = { latitude: 51.5074, longitude: -0.1278 };
const paris = { latitude: 48.8566, longitude: 2.3522 };

const km = distanceInKilometers(london, paris);
// ~344
```

The library also exports `distanceInMeters`, `angularDistance`, `toRadians`, and `toDegrees`. Points are plain objects with numeric `latitude` (in `[-90, 90]`) and `longitude` properties. Longitudes outside `[-180, 180]` are wrapped into range; latitudes outside `[-90, 90]` throw a `RangeError`, because an out-of-range latitude almost always means the caller swapped latitude and longitude.

## Why this exists

Geographic distance shows up in radius searches, sorting results by proximity, and bounding UIs. For those uses the difference between the spherical law of cosines and a more numerically stable formulation like Haversine is negligible, and the law of cosines is one line of trigonometry that is easy to read and reason about.

The trade-off: the law of cosines loses precision for very short distances (sub-kilometre), because the argument to `acos` approaches 1 and floating-point error dominates. If you need sub-metre accuracy, use a geodesic library built on an ellipsoidal model rather than a sphere.

## Edge cases worth knowing

- Distance from a point to itself is exactly zero.
- Longitudes are wrapped, so `{ longitude: 190 }` is treated as `-170`.
- Latitudes outside `[-90, 90]` throw; longitudes outside `[-180, 180]` do not.
- Non-finite coordinates (NaN, Infinity) throw a `TypeError`.
