export const likert = ['Needs work', 'Developing', 'Solid', 'Strong', 'Excellent'] as const;
export type Likert = (typeof likert)[number];

export const ratingAreas = [
  'Cadence',
  'Tonality',
  'Thought organization',
  'Clarity',
  'Confidence',
  'Conciseness',
  'Depth and substance',
] as const;

export type RatingArea = (typeof ratingAreas)[number];

export const levelPoints: Record<Likert, number> = {
  'Needs work': 20,
  Developing: 40,
  Solid: 60,
  Strong: 80,
  Excellent: 100,
};

export function likertToPoints(value: Likert) {
  return levelPoints[value];
}

export function ratingsToGrade(ratings: Record<string, Likert>) {
  const values = Object.values(ratings);
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + likertToPoints(value), 0) / values.length);
}
