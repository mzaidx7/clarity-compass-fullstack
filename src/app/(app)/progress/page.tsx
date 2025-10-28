"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { levelToColor, scoreToLevel } from '@/lib/utils';

type HistoryEntry = {
  timestamp: string;
  input: { sleep_hours: number; study_hours: number; assignments_due: number; exams_within_7d: number };
  result: { burnout_score: number; risk_label: string; top_drivers: string[] } | null;
};

export default function ProgressPage() {
  const { user } = useAuth();
  const storageKey = user?.id ? `cc_history_${user.id}` : `cc_history_local`;
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await (await import('@/lib/api')).api.getSurveyHistory(20);
        if (!cancelled) setHistory(res.items as any);
      } catch {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw && !cancelled) setHistory(JSON.parse(raw));
        } catch {}
      }
    })();
    return () => { cancelled = true };
  }, [storageKey]);

  const chartData = useMemo(() => {
    return (history || []).slice(-20).map(h => ({
      time: new Date(h.timestamp).toLocaleDateString(),
      score: h.result?.burnout_score ?? null,
    })).filter(d => d.score !== null);
  }, [history]);

  const chartConfig = {
    score: { label: 'Score', color: 'hsl(var(--primary))' },
  } satisfies ChartConfig;

  const achievements = useMemo(() => {
    const items: { id: string; title: string; unlocked: boolean; hint: string }[] = [];
    // 3-day streak
    const byDay = new Set((history || []).map(h => new Date(h.timestamp).toDateString()));
    let streak = 0; const today = new Date();
    for (let i=0;i<3;i++){ const d=new Date(today); d.setDate(today.getDate()-i); if (byDay.has(d.toDateString())) streak++; }
    items.push({ id: 'streak3', title: '🎖️ 3-day streak', unlocked: streak===3, hint: 'Save on 3 consecutive days' });
    // Sleep consistency (>=7h for 4 of last 5)
    const last5 = (history || []).slice(-5);
    const ok = last5.filter(h => (h.input?.sleep_hours ?? 0) >= 7).length;
    items.push({ id: 'sleep', title: '😴 Sleep Consistency', unlocked: ok >= 4, hint: '≥7h sleep on 4 of last 5' });
    // Balanced week (avg score last 7 <= 40)
    const last7 = (history || []).slice(-7);
    const avg = last7.length ? last7.reduce((s,h)=> s + (h.result?.burnout_score ?? 0),0)/last7.length : 0;
    items.push({ id: 'balanced', title: '📚 Balanced Week', unlocked: avg <= 40 && last7.length>0, hint: 'Avg score last 7 ≤ 40' });
    return items;
  }, [history]);

  return (
    <div className="container mx-auto p-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Progress</h1>
        <p className="text-muted-foreground">Recent quick-risk scores and achievements.</p>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Keep up healthy habits to unlock more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {achievements.map(a => (
              <div key={a.id} className={`rounded-md border px-3 py-2 text-sm ${a.unlocked ? '' : 'opacity-60'}`} title={a.hint}>
                {a.title}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recent Scores</CardTitle>
          <CardDescription>Up to the last 20 saved results.</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved results yet. Run a Quick Risk and click "Save".</p>
          ) : (
            <ChartContainer config={chartConfig} className="min-h-[220px] w-full">
              <LineChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="score" stroke="var(--color-score)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>History Details</CardTitle>
          <CardDescription>Date, Score, Level, and drivers</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history.</p>
          ) : (
            <div className="text-sm">
              <div className="grid grid-cols-4 gap-2 font-medium text-muted-foreground">
                <div>Date</div>
                <div>Score</div>
                <div>Level</div>
                <div>Drivers</div>
              </div>
              <div className="mt-2 space-y-1">
                {history.slice(-20).reverse().map((h, idx) => {
                  const score = h.result?.burnout_score ?? 0;
                  const level = scoreToLevel(score);
                  return (
                    <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                      <div>{new Date(h.timestamp).toLocaleString()}</div>
                      <div>{Math.round(score)}</div>
                      <div className={levelToColor(level).text}>{level}</div>
                      <div className="truncate">{(h.result?.top_drivers || []).join(', ')}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
