export type SurveyRequest = {
  sleep_hours: number;
  study_hours: number;
  assignments_due: number;
  exams_within_7d: number;
};

export type PredictionResponse = {
  burnout_score: number;
  risk_label: 'Low' | 'Moderate' | 'High';
  top_drivers: string[];
};

export type FusedPredictRequest = {
  s_answers: number[];
  behavior?: { [key: string]: number };
};

export type FusedPredictResponse = {
  survey: {
    predicted_stress_score: number;
    survey_risk_0_100: number;
    top_drivers: any[];
  };
  behavior: null | {
    predicted_raw: number;
    behavior_risk_0_100: number;
    features_used: { [key: string]: 'provided' | 'median' };
  };
  final_score_0_100: number;
};

export type ForecastRequest = {
  last14: number[];
  deadlines_next7?: number[];
  alpha?: number;
  deadline_weight?: number;
};

export type ForecastResponse = {
  pred: number[];
  conf: number[];
  drivers: string[];
};

export type HealthResponse = {
  status: string;
  version: string;
};

export type ModelStatusResponse = {
  using: string;
  model_loaded: boolean;
  scaler_loaded: boolean;
  features: string[];
  artifact_flags: Record<string, boolean>;
};

export type DevLoginRequest = {
  user_id: string;
};

export type DevLoginResponse = {
  access_token: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  type: 'Exam' | 'Assignment' | 'Study Session' | 'Sleep' | 'Exercise/Break' | 'Meeting/Presentation' | 'Work Shift';
  startTime: Date;
  endTime: Date;
  description?: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedDate: string | null;
  image: string;
  imageHint: string;
};

// Server-side calendar models (strings for transport)
export type CalendarEventServer = {
  id: string;
  title: string;
  type: string;
  date: string; // YYYY-MM-DD
  start?: string; // HH:mm
  end?: string;
  description?: string;
};

export type CalendarEventCreateServer = Omit<CalendarEventServer, 'id'>;
export type CalendarMonthDaysResponse = { days: { date: string; count: number }[] };

export type SurveyHistoryItem = {
  timestamp: string;
  input: SurveyRequest;
  result: PredictionResponse | null;
  fused?: FusedPredictResponse | null;
};

export type SurveyHistoryResponse = {
  items: SurveyHistoryItem[];
};

export type SurveySaveFullRequest = {
  input: SurveyRequest;
  result?: PredictionResponse | null;
  timestamp?: string;
  fused?: FusedPredictResponse | null;
};
