/**
 * Real constellations for the night sky, from catalog positions of their
 * main stars (J2000). Right ascension is in hours, declination in degrees,
 * and magnitude is brightness (smaller = brighter). Lines join stars by
 * their index in the list, following the traditional stick figures.
 */

export interface CatalogStar {
  name: string;
  ra: number;
  dec: number;
  mag: number;
}

export interface Constellation {
  name: string;
  stars: CatalogStar[];
  lines: [number, number][];
}

export const CONSTELLATIONS: Constellation[] = [
  {
    name: 'Ursa Major',
    stars: [
      { name: 'Dubhe', ra: 11.062, dec: 61.75, mag: 1.8 },
      { name: 'Merak', ra: 11.031, dec: 56.38, mag: 2.4 },
      { name: 'Phecda', ra: 11.897, dec: 53.69, mag: 2.4 },
      { name: 'Megrez', ra: 12.257, dec: 57.03, mag: 3.3 },
      { name: 'Alioth', ra: 12.9, dec: 55.96, mag: 1.8 },
      { name: 'Mizar', ra: 13.399, dec: 54.93, mag: 2.2 },
      { name: 'Alkaid', ra: 13.792, dec: 49.31, mag: 1.9 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
  },
  {
    name: 'Cassiopeia',
    stars: [
      { name: 'Caph', ra: 0.153, dec: 59.15, mag: 2.3 },
      { name: 'Schedar', ra: 0.675, dec: 56.54, mag: 2.2 },
      { name: 'Navi', ra: 0.945, dec: 60.72, mag: 2.5 },
      { name: 'Ruchbah', ra: 1.43, dec: 60.24, mag: 2.7 },
      { name: 'Segin', ra: 1.907, dec: 63.67, mag: 3.4 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    name: 'Orion',
    stars: [
      { name: 'Betelgeuse', ra: 5.919, dec: 7.41, mag: 0.5 },
      { name: 'Bellatrix', ra: 5.419, dec: 6.35, mag: 1.6 },
      { name: 'Meissa', ra: 5.585, dec: 9.93, mag: 3.4 },
      { name: 'Mintaka', ra: 5.533, dec: -0.3, mag: 2.2 },
      { name: 'Alnilam', ra: 5.604, dec: -1.2, mag: 1.7 },
      { name: 'Alnitak', ra: 5.679, dec: -1.94, mag: 1.8 },
      { name: 'Saiph', ra: 5.796, dec: -9.67, mag: 2.1 },
      { name: 'Rigel', ra: 5.242, dec: -8.2, mag: 0.1 },
    ],
    lines: [[2, 0], [2, 1], [0, 1], [0, 5], [1, 3], [3, 4], [4, 5], [5, 6], [3, 7]],
  },
  {
    name: 'Cygnus',
    stars: [
      { name: 'Deneb', ra: 20.69, dec: 45.28, mag: 1.3 },
      { name: 'Sadr', ra: 20.37, dec: 40.26, mag: 2.2 },
      { name: 'Albireo', ra: 19.512, dec: 27.96, mag: 3.1 },
      { name: 'Aljanah', ra: 20.77, dec: 33.97, mag: 2.5 },
      { name: 'Fawaris', ra: 19.75, dec: 45.13, mag: 2.9 },
    ],
    lines: [[0, 1], [1, 2], [3, 1], [1, 4]],
  },
  {
    name: 'Lyra',
    stars: [
      { name: 'Vega', ra: 18.616, dec: 38.78, mag: 0 },
      { name: 'Zeta Lyrae', ra: 18.746, dec: 37.6, mag: 4.3 },
      { name: 'Delta Lyrae', ra: 18.908, dec: 36.9, mag: 4.2 },
      { name: 'Sulafat', ra: 18.982, dec: 32.69, mag: 3.3 },
      { name: 'Sheliak', ra: 18.835, dec: 33.36, mag: 3.5 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1]],
  },
  {
    name: 'Leo',
    stars: [
      { name: 'Regulus', ra: 10.139, dec: 11.97, mag: 1.4 },
      { name: 'Eta Leonis', ra: 10.122, dec: 16.76, mag: 3.5 },
      { name: 'Algieba', ra: 10.333, dec: 19.84, mag: 2.1 },
      { name: 'Adhafera', ra: 10.278, dec: 23.42, mag: 3.4 },
      { name: 'Rasalas', ra: 9.879, dec: 26.01, mag: 3.9 },
      { name: 'Epsilon Leonis', ra: 9.764, dec: 23.77, mag: 3 },
      { name: 'Zosma', ra: 11.235, dec: 20.52, mag: 2.6 },
      { name: 'Denebola', ra: 11.818, dec: 14.57, mag: 2.1 },
      { name: 'Chertan', ra: 11.237, dec: 15.43, mag: 3.3 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [6, 7], [7, 8], [8, 0]],
  },
];

/**
 * Flattens a constellation onto a plane around its own center, in degrees.
 * East is on the left, as it is when you look up at the sky. Multiplying
 * right ascension by cos(declination) undoes the stretching near the pole,
 * which is why the Big Dipper keeps its real proportions.
 */
export function projectConstellation(constellation: Constellation) {
  const { stars } = constellation;
  const ra0 = stars.reduce((sum, star) => sum + star.ra, 0) / stars.length;
  const dec0 = stars.reduce((sum, star) => sum + star.dec, 0) / stars.length;
  const squeeze = Math.cos((dec0 * Math.PI) / 180);
  return stars.map((star) => ({
    x: -(star.ra - ra0) * 15 * squeeze,
    y: -(star.dec - dec0),
    mag: star.mag,
  }));
}
