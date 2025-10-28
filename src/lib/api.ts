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
  CalendarEventCreateServer,
  CalendarMonthDaysResponse
} from './types';

const MOCK_LATENCY_MS = 600;

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const getAuthHeaders = (): Record<string, string> => {
  return authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
};

type ApiResult<T> = { data?: T; error?: string };

async function http<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        ...getAuthHeaders(),
      } as HeadersInit,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { error: text || `HTTP ${res.status}` };
    }
    const json = (await res.json()) as T;
    return { data: json };
  } catch (e: any) {
    return { error: e?.message || 'Network error' };
  }
}

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
  getSurveyHistory: async (limit: number = 20): Promise<SurveyHistoryResponse> => {
    await new Promise(r => setTimeout(r, MOCK_LATENCY_MS));
    return { items: [] };
  },
  getCalendarEvents: async (date?: string): Promise<CalendarEventServer[]> => {
    await new Promise(r => setTimeout(r, MOCK_LATENCY_MS));
    return [];
  },
  addCalendarEvent: async (event: CalendarEventCreateServer): Promise<CalendarEventServer> => {
    await new Promise(r => setTimeout(r, MOCK_LATENCY_MS));
    return { id: String(Date.now()), ...event } as CalendarEventServer;
  },
  deleteCalendarEvent: async (id: string): Promise<{ status: string }> => {
    await new Promise(r => setTimeout(r, MOCK_LATENCY_MS));
    return { status: 'ok' };
  },
  getCalendarMonthDays: async (year: number, month: number): Promise<CalendarMonthDaysResponse> => {
    await new Promise(r => setTimeout(r, MOCK_LATENCY_MS));
    return { days: [] };
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
        const r = await http<HealthResponse>(`${API_BASE_URL}/auth/health`);
        if (r.error || !r.data) throw new Error(r.error || 'Failed to fetch health');
        return r.data;
    },
    status: async (): Promise<ModelStatusResponse> => {
        const r = await http<ModelStatusResponse>(`${API_BASE_URL}/predict/status`);
        if (r.error || !r.data) throw new Error(r.error || 'Failed to fetch status');
        return r.data;
    },
    predict: async (data: SurveyRequest): Promise<PredictionResponse> => {
        const r = await http<PredictionResponse>(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (r.error || !r.data) throw new Error(r.error || 'Prediction failed');
        return r.data;
    },
    saveSurvey: async (data: SurveyRequest): Promise<{ status: string, message: string }> => {
        const r = await http<{ status: string, message: string }>(`${API_BASE_URL}/survey/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (r.error || !r.data) throw new Error(r.error || 'Save survey failed');
        return r.data;
    },
    saveSurveyFull: async (payload: SurveySaveFullRequest): Promise<{ status: string, message: string }> => {
        const r = await http<{ status: string, message: string }>(`${API_BASE_URL}/survey/save_full`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (r.error || !r.data) throw new Error(r.error || 'Save survey failed');
        return r.data;
    },
    predictFused: async (data: FusedPredictRequest): Promise<FusedPredictResponse> => {
        const r = await http<FusedPredictResponse>(`${API_BASE_URL}/predict/fused`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (r.error || !r.data) throw new Error(r.error || 'Fused prediction failed');
        return r.data;
    },
    forecast: async (data: ForecastRequest): Promise<ForecastResponse> => {
        const r = await http<ForecastResponse>(`${API_BASE_URL}/forecast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (r.error || !r.data) throw new Error(r.error || 'Forecast failed');
        return r.data;
    },
    devLogin: async (data: DevLoginRequest): Promise<DevLoginResponse> => {
        const res = await fetch(`${API_BASE_URL}/auth/dev-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Dev login failed');
        const json = await res.json();
        if (json && typeof json === 'object' && 'token' in json && !('access_token' in json)) {
            return { access_token: json.token } as DevLoginResponse;
        }
        return json as DevLoginResponse;
    },
    getSurveyHistory: async (limit: number = 20): Promise<SurveyHistoryResponse> => {
        const r = await http<SurveyHistoryResponse>(`${API_BASE_URL}/survey/history?limit=${limit}`);
        if (r.error || !r.data) throw new Error(r.error || 'Fetch history failed');
        return r.data;
    },
    getCalendarEvents: async (date?: string): Promise<CalendarEventServer[]> => {
        const url = new URL(`${API_BASE_URL}/calendar/events`);
        if (date) url.searchParams.set('date', date);
        const r = await http<CalendarEventServer[]>(url.toString());
        if (r.error || !r.data) throw new Error(r.error || 'Fetch events failed');
        return r.data;
    },
    addCalendarEvent: async (event: CalendarEventCreateServer): Promise<CalendarEventServer> => {
        const r = await http<CalendarEventServer>(`${API_BASE_URL}/calendar/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        });
        if (r.error || !r.data) throw new Error(r.error || 'Add event failed');
        return r.data;
    },
    deleteCalendarEvent: async (id: string): Promise<{ status: string }> => {
        const r = await http<{ status: string }>(`${API_BASE_URL}/calendar/events/${id}`, {
            method: 'DELETE',
        });
        if (r.error || !r.data) throw new Error(r.error || 'Delete event failed');
        return r.data;
    },
    getCalendarMonthDays: async (year: number, month: number): Promise<CalendarMonthDaysResponse> => {
        const url = new URL(`${API_BASE_URL}/calendar/events/month`);
        url.searchParams.set('year', String(year));
        url.searchParams.set('month', String(month));
        const r = await http<CalendarMonthDaysResponse>(url.toString());
        if (r.error || !r.data) throw new Error(r.error || 'Fetch month days failed');
        return r.data;
    },
};

// Safe API that always returns {data?, error?}
export const apiSafe = {
  health: () => http<HealthResponse>(`${API_BASE_URL}/auth/health`),
  status: () => http<ModelStatusResponse>(`${API_BASE_URL}/predict/status`),
  predict: (body: SurveyRequest) => http<PredictionResponse>(`${API_BASE_URL}/predict`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  saveSurveyFull: (payload: SurveySaveFullRequest) => http<{ status: string }>(`${API_BASE_URL}/survey/save_full`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
  history: (limit = 20) => http<SurveyHistoryResponse>(`${API_BASE_URL}/survey/history?limit=${limit}`),
  predictFused: (body: FusedPredictRequest) => http<FusedPredictResponse>(`${API_BASE_URL}/predict/fused`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  forecast: (body: ForecastRequest) => http<ForecastResponse>(`${API_BASE_URL}/forecast`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  calendarList: (date?: string) => {
    const url = new URL(`${API_BASE_URL}/calendar/events`);
    if (date) url.searchParams.set('date', date);
    return http<CalendarEventServer[]>(url.toString());
  },
  calendarAdd: (e: CalendarEventCreateServer) => http<CalendarEventServer>(`${API_BASE_URL}/calendar/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) }),
  calendarDelete: (id: string) => http<{ status: string }>(`${API_BASE_URL}/calendar/events/${id}`, { method: 'DELETE' }),
  calendarMonthDays: (year: number, month: number) => {
    const url = new URL(`${API_BASE_URL}/calendar/events/month`);
    url.searchParams.set('year', String(year));
    url.searchParams.set('month', String(month));
    return http<CalendarMonthDaysResponse>(url.toString());
  },
};

export const api = USE_MOCK_API ? mockApi : liveApi;
