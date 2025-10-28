"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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

  return (
    <div className="container mx-auto p-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Progress</h1>
        <p className="text-muted-foreground">Recent quick-risk scores saved on this device.</p>
      </div>
      <Card>
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
    </div>
  );
}
