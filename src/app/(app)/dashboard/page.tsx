
"use client";
import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, HeartPulse, BrainCircuit, Activity, Info } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { useTheme } from '@/components/theme-provider';

const chartData = [
  { day: "Mon", score: 35 },
  { day: "Tue", score: 45 },
  { day: "Wed", score: 42 },
  { day: "Thu", score: 55 },
  { day: "Fri", score: 50 },
  { day: "Sat", score: 65 },
  { day: "Sun", score: 60 },
];

const chartConfig = {
  score: {
    label: "Risk Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const featureCards = [
    { title: "Quick Risk", description: "Get a fast burnout risk score.", href:"/quick-risk", icon: HeartPulse },
    { title: "Fused Risk", description: "Combine survey and behavior data.", href:"/fused-risk", icon: BrainCircuit },
    { title: "7-Day Forecast", description: "Predict your risk for the next week.", href:"/forecast", icon: Activity },
    { title: "Check Status", description: "View system and model health.", href:"/status", icon: Info },
];

const ScoreDial = ({ score, color }: { score: number, color: string }) => {
    const { theme } = useTheme();
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (score / 100) * circumference;
    const showGlow = theme === 'dark';

    return (
        <div className="relative w-64 h-64">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120">
                {showGlow && (
                    <defs>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                )}
                
                <circle cx="60" cy="60" r="58" fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
                
                <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="hsl(var(--primary) / 0.15)"
                    strokeWidth="8"
                />

                <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={color}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dashoffset 0.5s ease-out, stroke 0.5s ease-out" }}
                    filter={showGlow ? "url(#glow)" : "none"}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-bold" style={{ color: color, textShadow: showGlow ? `0 0 10px ${color}` : 'none' }}>{score}</span>
                <span className="text-sm text-muted-foreground">Burnout Score</span>
            </div>
        </div>
    );
};

export default function DashboardPage() {
  const { user } = useAuth();
  
  const latestScore = chartData[chartData.length - 1].score;

  const { riskLabel, riskColor, riskDescription, dialColor } = useMemo(() => {
    if (latestScore < 40) {
      return {
        riskLabel: "Low Risk",
        riskColor: "text-green-500",
        dialColor: "hsl(140 80% 60%)",
        riskDescription: "Keep up the great work maintaining a healthy balance!",
      };
    } else if (latestScore < 70) {
      return {
        riskLabel: "Moderate Risk",
        riskColor: "text-amber-500",
        dialColor: "hsl(45, 90%, 55%)",
        riskDescription: "Consider taking a break or reviewing your schedule.",
      };
    } else {
      return {
        riskLabel: "High Risk",
        riskColor: "text-red-500",
        dialColor: "hsl(0 90% 60%)",
        riskDescription: "It's important to take immediate steps to reduce stress.",
      };
    }
  }, [latestScore]);


  return (
    <div className="container mx-auto p-0">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.id || 'User'}!</h1>
        <p className="text-muted-foreground">Here's your burnout risk overview. Stay mindful and balanced.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card className="flex flex-col items-center justify-center gap-8 p-8 text-center">
                <ScoreDial score={latestScore} color={dialColor} />
                <div className='space-y-2'>
                    <p className={`text-2xl font-bold ${riskColor}`}>{riskLabel}</p>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">{riskDescription}</p>
                </div>
                 <Button asChild className="w-full max-w-xs">
                    <Link href="/quick-risk">Take New Assessment <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
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
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
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
