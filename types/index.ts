export type Level = "Starter" | "A1" | "A2" | "B1" | "B2";

export type UnitType =
  | "word"
  | "phrase"
  | "chunk"
  | "collocation"
  | "connector"
  | "sentence-pattern";

export interface LearningUnit {
  id: string;
  level: Level;
  type: UnitType;
  spanish: string;
  lemma: string;
  chinese: string;
  partOfSpeech: string;
  article?: string;
  gender?: "m" | "f";
  plural?: string;
  topic: string;
  frequency: string;
  difficulty: number; // 1-5
  collocations: string[];
  example: { spanish: string; chinese: string };
  wordFamily: string[];
  synonyms: string[];
  antonyms: string[];
  grammarNote: string;
  commonMistakes: string;
}

export type Rating = "again" | "hard" | "good" | "easy";
export type UnitStatus = "new" | "learning" | "review" | "active" | "mastered";

export interface ReviewState {
  status: UnitStatus;
  interval: number; // days
  dueDate: string; // ISO datetime
  correctCount: number;
  wrongCount: number;
  productionCorrect: number;
  productionWrong: number;
  productionDays: string[]; // distinct days with correct C→S
  lastRatedAt?: string;
}

export interface DayActivity {
  newLearned: number;
  reviewed: number;
  listening: number;
  output: number;
  recallCorrect: number;
  recallTotal: number;
  listeningCorrect: number;
  listeningTotal: number;
  wrongIds: string[];
}

export interface MySentence {
  id: string;
  text: string;
  date: string;
  unitIds: string[];
}

export interface Settings {
  dailyNew: number;
  targetLevel: Level;
  voiceLocale: "es-MX" | "es-ES";
  rate: number; // 0.7 | 0.85 | 1.0
  tracks: string[]; // Travel / Social / Business
  goal: string;
}

export interface AppState {
  onboarded: boolean;
  startLevel: Level;
  settings: Settings;
  reviews: Record<string, ReviewState>;
  favorites: string[];
  mySentences: MySentence[];
  activity: Record<string, DayActivity>; // key: YYYY-MM-DD
}

export const DEFAULT_SETTINGS: Settings = {
  dailyNew: 20,
  targetLevel: "B2",
  voiceLocale: "es-MX",
  rate: 0.85,
  tracks: [],
  goal: "综合西班牙语",
};

export const DEFAULT_STATE: AppState = {
  onboarded: false,
  startLevel: "Starter",
  settings: DEFAULT_SETTINGS,
  reviews: {},
  favorites: [],
  mySentences: [],
  activity: {},
};
