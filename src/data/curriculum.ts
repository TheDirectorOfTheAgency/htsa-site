export interface CurriculumModule {
  number: number;
  title: string;
  summary: string;
  lessons: string[];
}

/** Placeholders until live Skool module names and lesson lists replace this file. */
export const CURRICULUM: CurriculumModule[] = [1, 2, 3, 4, 5, 6].map((number) => ({
  number,
  title: `Module ${number}`,
  summary: "Line to come, mapped from live Skool.",
  lessons: [],
}));
