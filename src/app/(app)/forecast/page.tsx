"use client";

import { useEffect, useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from 'lucide-react';
import { api, apiSafe } from '@/lib/api';
import type { ForecastResponse, ForecastRequest } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const forecastSchema = z.object({
  last14: z.array(z.number().min(0).max(100)).length(14, "Must have 14 values"),
  deadlines_next7: z.array(z.number().min(0).max(10)).length(7, "Must have 7 values"),
});

type ForecastFormValues = z.infer<typeof forecastSchema>;

export default function ForecastPage() {
  const [prediction, setPrediction] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForecastFormValues>({
    resolver: zodResolver(forecastSchema),
    defaultValues: {
        last14: [50,52,55,53,56,58,60,62,65,63,66,68,70,72],
        deadlines_next7: [0,1,0,2,0,1,0],
    },
  });

  const onSubmit = async (data: ForecastFormValues) => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const result = await api.forecast(data);
      setPrediction(result);
    } catch (e) {
      setError("An error occurred while fetching the forecast.");
    } finally {
      setIsLoading(false);
    }
  };

  // Use My Data: fill from history + calendar
  const useMyData = async () => {
    setIsLoading(true);
    try {
      const hist = await apiSafe.history(28);
      const items = hist.data?.items || [];
      const scores = items.map(it => Number(it.result?.burnout_score ?? 0)).filter(n => !Number.isNaN(n));
      const last14 = Array(14).fill(0);
      for (let i = 0; i < 14; i++) {
        last14[13 - i] = scores[scores.length - 1 - i] ?? 0;
      }
      const deadlines = Array(7).fill(0);
      // Aggregate calendar exams/assignments for next 7 days
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i + 1);
        const key = d.toISOString().slice(0,10);
        const res = await apiSafe.calendarList(key);
        const events = res.data || [];
        const count = events.filter(e => ['Exam','Assignment'].includes(e.type)).length;
        deadlines[i] = count;
      }
      form.setValue('last14', last14);
      form.setValue('deadlines_next7', deadlines);
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  const chartData = prediction ? prediction.pred.map((p, i) => ({
    day: `Day ${i + 1}`,
    prediction: p,
    confidence: prediction.conf[i],
  })) : [];
  
  return (
    <div className="container mx-auto max-w-4xl p-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">7-Day Burnout Forecast</h1>
        <p className="text-muted-foreground">Enter your recent risk scores and upcoming deadlines to forecast your burnout risk.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Inputs</CardTitle>
            <CardDescription>Provide data for the last 14 days and the next 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs defaultValue="manual">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">Manual</TabsTrigger>
                    <TabsTrigger value="mine" onClick={(e) => { e.preventDefault(); useMyData(); }}>Use My Data</TabsTrigger>
                  </TabsList>
                  <TabsContent value="manual" className="space-y-4">
                    <div>
                      <Label>Last 14 Days Scores (0–100)</Label>
                      <div className="mt-2 grid grid-cols-7 gap-2">
                        {Array.from({ length: 14 }).map((_, i) => (
                          <Controller key={i} name={`last14.${i}`} control={form.control} render={({ field }) => (
                            <Input type="number" min={0} max={100} value={field.value ?? 0} onChange={(e) => field.onChange(Number(e.target.value))} />
                          )} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Deadlines Next 7 Days (0–10)</Label>
                      <div className="mt-2 grid grid-cols-7 gap-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <Controller key={i} name={`deadlines_next7.${i}`} control={form.control} render={({ field }) => (
                            <Input type="number" min={0} max={10} value={field.value ?? 0} onChange={(e) => field.onChange(Number(e.target.value))} />
                          )} />
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="mine">
                    <p className="text-sm text-muted-foreground">Prefilled from your recent data. You can adjust values before submitting.</p>
                  </TabsContent>
                </Tabs>
                {form.formState.errors.last14 && <p className="text-sm text-destructive">{form.formState.errors.last14.message}</p>}
                {form.formState.errors.deadlines_next7 && <p className="text-sm text-destructive">{form.formState.errors.deadlines_next7.message}</p>}
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={useMyData} disabled={isLoading}>Use My Data</Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Forecast Risk
                  </Button>
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Forecast Results</CardTitle>
            <CardDescription>Your predicted burnout risk for the next 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {error && <div className="text-center text-destructive"><AlertCircle className="mx-auto mb-2 h-8 w-8" /><p>{error}</p></div>}
            {!isLoading && !error && !prediction && <p className="text-muted-foreground">Results will be shown here.</p>}
            {prediction && (
                <ChartContainer config={{}} className="min-h-[200px] w-full">
                    <AreaChart data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <defs>
                            <linearGradient id="fillConfidence" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#e5e7eb" stopOpacity={0.18} />
                                <stop offset="95%" stopColor="#e5e7eb" stopOpacity={0} />
                            </linearGradient>
                             <linearGradient id="fillPrediction" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#e5e7eb" stopOpacity={0.85} />
                                <stop offset="95%" stopColor="#e5e7eb" stopOpacity={0.18} />
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="confidence" stackId="1" stroke="" fill="url(#fillConfidence)" />
                        <Area type="monotone" dataKey="prediction" stackId="2" stroke="#e5e7eb" fill="url(#fillPrediction)" />
                    </AreaChart>
                </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
