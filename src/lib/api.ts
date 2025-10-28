import { API_BASE_URL, USE_MOCK_API } from './config';
import type {
  SurveyRequest,
  PredictionResponse,
  FusedPredictRequest,
  FusedPredictResponse,
  ForecastRequest,
  ForecastResponse,
  HealthResponse,
  ModelStatusResponse,
  DevLoginRequest,
  DevLoginResponse,
  SurveyHistoryResponse,
  SurveySaveFullRequest,
  CalendarEventServer,
  CalendarEventCreateServer
} from './types';

const MOCK_LATENCY_MS = 600;

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const getAuthHeaders = (): Record<string, string> => {
  return authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Utility to generate a minimal unsigned JWT-like token for dev use
const createFakeJwt = (userId: string): string => {
  const header = { alg: 'none', typ: 'JWT' };
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };
  const toBase64Url = (obj: any) => {
    const json = JSON.stringify(obj);
    // btoa may not exist in SSR; provide a fallback
    const base64 =
      typeof btoa === 'function'
        ? btoa(json)
        : Buffer.from(json, 'utf-8').toString('base64');
    return base64.replace(/=+/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };
  return `${toBase64Url(header)}.${toBase64Url(payload)}.`; // empty signature
};

const mockApi = {
  health: async (): Promise<HealthResponse> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
    return { status: 'ok', version: '0.1.0 (mock)' };
  },
  
  status: async (): Promise<ModelStatusResponse> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
    return {
      using: 'Mock Model v1',
      model_loaded: true,
      scaler_loaded: true,
      features: ['sleep_hours', 'study_hours', 'assignments_due', 'exams_within_7d'],
      artifact_flags: { 'dass21_model': true, 'behavior_model': false },
    };
  },

  predict: async (data: SurveyRequest): Promise<PredictionResponse> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));

    const { sleep_hours, study_hours, assignments_due, exams_within_7d } = data;
    
    const score = clamp(
      study_hours * 3 + assignments_due * 5 + exams_within_7d * 7 - sleep_hours * 2,
      0,
      100
    );

    let risk_label: 'Low' | 'Moderate' | 'High';
    if (score < 40) risk_label = 'Low';
    else if (score < 70) risk_label = 'Moderate';
    else risk_label = 'High';

    const drivers = [];
    if (study_hours > 8) drivers.push('High Study Hours');
    if (sleep_hours < 6) drivers.push('Low Sleep Hours');
    if (assignments_due > 3) drivers.push('Many Assignments');
    if (exams_within_7d > 1) drivers.push('Upcoming Exams');

    return {
      burnout_score: score,
      risk_label,
      top_drivers: drivers.slice(0, 2),
    };
  },
  
  saveSurvey: async (data: SurveyRequest): Promise<{ status: string, message: string }> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
    console.log("Saving survey data (mock):", data);
    return { status: 'ok', message: 'Risk assessment saved successfully.' };
  },
  saveSurveyFull: async (payload: SurveySaveFullRequest): Promise<{ status: string, message: string }> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
    console.log("Saving survey full (mock):", payload);
    return { status: 'ok', message: 'Saved (mock)' };
  },
  
  predictFused: async (data: FusedPredictRequest): Promise<FusedPredictResponse> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));

    const { s_answers, behavior } = data;
    const stressScore = s_answers.reduce((sum, val) => sum + val, 0);
    const surveyRisk = clamp(stressScore * 3.5, 0, 100);

    const response: FusedPredictResponse = {
      survey: {
        predicted_stress_score: stressScore,
        survey_risk_0_100: surveyRisk,
        top_drivers: ['S1: Over-reacted easily', 'S6: Used a lot of nervous energy'],
      },
      behavior: null,
      final_score_0_100: surveyRisk,
    };

    if (behavior && Object.keys(behavior).length > 0) {
        const behaviorRisk = clamp(Object.values(behavior).reduce((sum, val) => sum + val * 5, 0), 0, 100);
        response.behavior = {
            predicted_raw: behaviorRisk / 5,
            behavior_risk_0_100: behaviorRisk,
            features_used: Object.keys(behavior).reduce((acc, key) => {
                acc[key] = 'provided';
                return acc;
            }, {} as { [key: string]: "provided"|"median" }),
        };
        response.final_score_0_100 = clamp(surveyRisk * 0.7 + behaviorRisk * 0.3, 0, 100);
    }
    
    return response;
  },

  forecast: async (data: ForecastRequest): Promise<ForecastResponse> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
    
    const { last14, deadlines_next7, alpha = 0.5, deadline_weight = 2 } = data;
    
    const pred: number[] = [];
    let last_smooth = last14[last14.length - 1];

    for (let i = 0; i < 7; i++) {
      last_smooth = alpha * last14[last14.length - 1] + (1 - alpha) * last_smooth;
      let forecast = last_smooth;
      if (deadlines_next7 && deadlines_next7[i] > 0) {
        forecast += deadline_weight * deadlines_next7[i];
      }
      pred.push(clamp(forecast, 0, 100));
    }
    
    const conf = pred.map(p => clamp(p + 10, 0, 100));
    
    const drivers = ["Stable baseline"];
    if (last14[last14.length-1] > last14[0]) {
        drivers.push("Recent trend up");
    } else {
        drivers.push("Recent trend down");
    }
    if(deadlines_next7 && deadlines_next7.some(d => d > 0)) {
        drivers.push("Deadlines impact");
    }

    return { pred, conf, drivers };
  },
  devLogin: async (data: DevLoginRequest): Promise<DevLoginResponse> => {
    await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
    return { access_token: createFakeJwt(data.user_id) };
  }
};

const liveApi = {
    health: async (): Promise<HealthResponse> => {
        const response = await fetch(`${API_BASE_URL}/auth/health`);
        if (!response.ok) throw new Error('Failed to fetch health');
        return response.json();
    },
    status: async (): Promise<ModelStatusResponse> => {
        const response = await fetch(`${API_BASE_URL}/predict/status`);
        if (!response.ok) throw new Error('Failed to fetch status');
        return response.json();
    },
    predict: async (data: SurveyRequest): Promise<PredictionResponse> => {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Prediction failed');
        return response.json();
    },
    saveSurvey: async (data: SurveyRequest): Promise<{ status: string, message: string }> => {
        const response = await fetch(`${API_BASE_URL}/survey/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Save survey failed');
        return response.json();
    },
    saveSurveyFull: async (payload: SurveySaveFullRequest): Promise<{ status: string, message: string }> => {
        const response = await fetch(`${API_BASE_URL}/survey/save_full`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Save survey failed');
        return response.json();
    },
    predictFused: async (data: FusedPredictRequest): Promise<FusedPredictResponse> => {
        const response = await fetch(`${API_BASE_URL}/predict/fused`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Fused prediction failed');
        return response.json();
    },
    forecast: async (data: ForecastRequest): Promise<ForecastResponse> => {
        const response = await fetch(`${API_BASE_URL}/forecast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Forecast failed');
        return response.json();
    },
    devLogin: async (data: DevLoginRequest): Promise<DevLoginResponse> => {
        const response = await fetch(`${API_BASE_URL}/auth/dev-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Dev login failed');
        }
        const json = await response.json();
        // Backend may return { token } whereas frontend expects { access_token }
        if (json && typeof json === 'object' && 'token' in json && !('access_token' in json)) {
            return { access_token: json.token } as DevLoginResponse;
        }
        return json as DevLoginResponse;
    },
    getSurveyHistory: async (limit: number = 20): Promise<SurveyHistoryResponse> => {
        const response = await fetch(`${API_BASE_URL}/survey/history?limit=${limit}`, {
            headers: { ...getAuthHeaders() },
        });
        if (!response.ok) throw new Error('Fetch history failed');
        return response.json();
    },
    getCalendarEvents: async (date?: string): Promise<CalendarEventServer[]> => {
        const url = new URL(`${API_BASE_URL}/calendar/events`);
        if (date) url.searchParams.set('date', date);
        const response = await fetch(url.toString(), { headers: { ...getAuthHeaders() } });
        if (!response.ok) throw new Error('Fetch events failed');
        return response.json();
    },
    addCalendarEvent: async (event: CalendarEventCreateServer): Promise<CalendarEventServer> => {
        const response = await fetch(`${API_BASE_URL}/calendar/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(event),
        });
        if (!response.ok) throw new Error('Add event failed');
        return response.json();
    },
    deleteCalendarEvent: async (id: string): Promise<{ status: string }> => {
        const response = await fetch(`${API_BASE_URL}/calendar/events/${id}`, {
            method: 'DELETE',
            headers: { ...getAuthHeaders() },
        });
        if (!response.ok) throw new Error('Delete event failed');
        return response.json();
    },
};

export const api = USE_MOCK_API ? mockApi : liveApi;
