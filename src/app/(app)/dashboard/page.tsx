
"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, HeartPulse, BrainCircuit, Activity, Info } from 'lucide-react';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis } from 'recharts';
import Gauge from '@/components/Gauge';
import { cn } from '@/lib/utils';
import { apiSafe } from '@/lib/api';
import { toLocalDayKey, scoreToLevel, levelToColor, clamp } from '@/lib/utils';

const featureCards = [
    { title: "Quick Risk", description: "Get a fast burnout risk score.", href:"/quick-risk", icon: HeartPulse },
    { title: "Fused Risk", description: "Combine survey and behavior data.", href:"/fused-risk", icon: BrainCircuit },
    { title: "7-Day Forecast", description: "Predict your risk for the next week.", href:"/forecast", icon: Activity },
    { title: "Check Status", description: "View system and model health.", href:"/status", icon: Info },
];

const chartConfig = {
  score: { label: 'Risk Score', color: 'hsl(var(--primary))' },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { user } = useAuth();
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [latestLevelText, setLatestLevelText] = useState<string>('');
  const [colorClass, setColorClass] = useState<string>('text-green-500');
  const [chartData, setChartData] = useState<{ day: string; score: number; drivers?: string[]; hasData: boolean }[]>([]);

  useEffect(() => {
    (async () => {
      const history = await apiSafe.history(40);
      const items = history.data?.items || [];
      // Latest: prefer the last fused entry; otherwise last quick
      const latestFused = [...items].reverse().find((it: any) => it.fused && typeof it.fused.final_score_0_100 === 'number');
      const latestQuick = items[items.length - 1];
      const chosen = latestFused || latestQuick;
      if (chosen?.fused?.final_score_0_100 != null) {
        const s = clamp(Number(chosen.fused.final_score_0_100));
        setLatestScore(Math.round(s));
        const lvl = scoreToLevel(s);
        setLatestLevelText(lvl);
        setColorClass(levelToColor(lvl).text);
      } else if (chosen?.result?.burnout_score != null) {
        const s = clamp(Number(chosen.result.burnout_score));
        setLatestScore(Math.round(s));
        const lvl = scoreToLevel(s);
        setLatestLevelText(lvl);
        setColorClass(levelToColor(lvl).text);
      } else {
        setLatestScore(null);
      }

      // Build last 7 days chart
      const byDay = new Map<string, { score: number; drivers?: string[] }>();
      for (const it of items) {
        const day = toLocalDayKey(it.timestamp);
        const val = it.fused?.final_score_0_100 != null ? clamp(Number(it.fused.final_score_0_100)) : clamp(Number(it.result?.burnout_score ?? 0));
        const drivers = it.fused?.survey?.top_drivers || it.result?.top_drivers || [];
        byDay.set(day, { score: val, drivers });
      }
      const today = new Date();
      const days: { day: string; score: number; drivers?: string[]; hasData: boolean }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = toLocalDayKey(d);
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (byDay.has(key)) {
          const v = byDay.get(key)!;
          days.push({ day: label, score: Math.round(v.score), drivers: v.drivers as string[], hasData: true });
        } else {
          days.push({ day: label, score: 0, hasData: false });
        }
      }
      setChartData(days);
    })();
  }, []);


  return (
    <div className="container mx-auto p-0">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.id || 'User'}!</h1>
        <p className="text-muted-foreground">Here's your burnout risk overview. Stay mindful and balanced.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card className="flex flex-col items-center justify-center gap-6 p-8 text-center">
              {latestScore === null ? (
                <>
                  <p className="text-muted-foreground">No recent assessment yet. Take your first assessment.</p>
                  <Button asChild className="w-full max-w-xs">
                    <Link href="/quick-risk">Take New Assessment <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </>
              ) : (
                <>
                  <Gauge value={latestScore} colorClass={colorClass} glow size={220} />
                  <div className='space-y-1'>
                    <p className="text-sm text-muted-foreground">Current Level</p>
                    <p className={cn('text-xl font-semibold', colorClass)}>{latestLevelText}</p>
                  </div>
                  <Button asChild className="w-full max-w-xs">
                    <Link href="/quick-risk">Take New Assessment <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </>
              )}
            </Card>
            
             <Card>
                <CardHeader>
                  <CardTitle>Recent Quick-Risk Scores</CardTitle>
                  <CardDescription>Your risk scores from the last 7 days.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                      <CartesianGrid vertical={false} stroke="hsl(var(--border) / 0.5)" />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        stroke='hsl(var(--muted-foreground))'
                      />
                      <Tooltip
                        cursor={false}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const p = payload[0]?.payload as any;
                          return (
                            <div className="rounded-md border bg-popover p-2 text-popover-foreground shadow-md">
                              <p className="text-xs text-muted-foreground">{p.day}</p>
                              <p className="text-sm font-medium">Score: {p.score}</p>
                              {Array.isArray(p.drivers) && p.drivers.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {p.drivers.slice(0, 3).map((d: any, i: number) => (
                                    <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{typeof d === 'string' ? d : d?.feature ?? JSON.stringify(d)}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="score" fill="var(--color-score)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
        </div>
        
        <div className="space-y-4">
            {featureCards.map(card => (
                <Card key={card.title} className="flex flex-col hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-medium">{card.title}</CardTitle>
                        <card.icon className="h-5 w-5 text-accent" />
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground">{card.description}</p>
                    </CardContent>
                    <CardFooter className="pt-0">
                        <Button asChild size="sm" variant="link" className="text-accent p-0 h-auto">
                            <Link href={card.href}>Go to page <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>

      </div>
    </div>
  );
}
