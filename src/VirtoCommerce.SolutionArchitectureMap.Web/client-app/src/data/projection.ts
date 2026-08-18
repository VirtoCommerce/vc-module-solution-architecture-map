/** Equirectangular projection used by the embedded land path (1000×500 world space). */
export function projX(lon: number): number { return ((lon + 180) / 360) * 1000; }
export function projY(lat: number): number { return ((90 - lat) / 180) * 500; }
