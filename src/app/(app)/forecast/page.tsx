"use client";

import { useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { ForecastResponse, ForecastRequest } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const forecastSchema = z.object({
  last14: z.preprocess((val) => String(val).split(',').map(Number), z.array(z.number()).length(14, "Must have 14 values")), 
  deadlines_next7: z.preprocess((val) => String(val).split(',').map(Number), z.array(z.number()).length(7, "Must have 7 values"))
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

  const chartData = prediction ? prediction.pred.map((p, i) => ({
    day: `Day ${i + 1}`,
    prediction: p,
    confidence: prediction.conf[i],
  })) : [];
  
  return (
    <div className=\"container mx-auto max-w-4xl p-0\">
      <div className=\"mb-6\">
        <h1 className=\"text-3xl font-bold tracking-tight\">7-Day Burnout Forecast</h1>
        <p className=\"text-muted-foreground\">Enter your recent risk scores and upcoming deadlines to forecast your burnout risk.</p>
      </div>

      <div className=\"grid gap-8 md:grid-cols-2\">
        <Card>
          <CardHeader>
            <CardTitle>Your Inputs</CardTitle>
            <CardDescription>Provide data for the last 14 days and the next 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className=\"space-y-6\">
                 <div className=\"space-y-2\">
                    <Label htmlFor=\"last14\">Last 14 Days Risk Scores (comma-separated)</Label>
                    <Controller
                        name=\"last14\"
                        control={form.control}
                        render={({ field }) => <Input id=\"last14\" {...field} />}
                    />
                </div>
                <div className=\"space-y-2\">
                    <Label htmlFor=\"deadlines_next7\">Deadlines in Next 7 Days (comma-separated)</Label>
                    <Controller
                        name=\"deadlines_next7\"
                        control={form.control}
                        render={({ field }) => <Input id=\"deadlines_next7\" {...field} />}
                    />
                </div>
                 {form.formState.errors.last14 && <p className=\"text-sm text-destructive\">{form.formState.errors.last14.message}</p>}
                {form.formState.errors.deadlines_next7 && <p className=\"text-sm text-destructive\">{form.formState.errors.deadlines_next7.message}</p>}
                <Button type=\"submit\" className=\"w-full\" disabled={isLoading}>
                  {isLoading && <Loader2 className=\"mr-2 h-4 w-4 animate-spin\" />}
                  Forecast Risk
                </Button>
              </form>
            </FormProvider>
          </CardContent>
        </Card>

        <Card className=\"flex flex-col\">
          <CardHeader>
            <CardTitle>Forecast Results</CardTitle>
            <CardDescription>Your predicted burnout risk for the next 7 days.</CardDescription>
          </CardHeader>
          <CardContent className=\"flex-grow flex items-center justify-center\">
            {isLoading && <Loader2 className=\"h-8 w-8 animate-spin text-primary\" />}
            {error && <div className=\"text-center text-destructive\"<AlertCircle className=\"mx-auto mb-2 h-8 w-8\" /><p>{error}</p></div>}
            {!isLoading && !error && !prediction && <p className=\"text-muted-foreground\">Results will be shown here.</p>}
            {prediction && (
                <ChartContainer config={{}} className=\"min-h-[200px] w-full\">
                    <AreaChart data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey=\"day\" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <defs>
                            <linearGradient id=\"fillConfidence\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">
                                <stop offset=\"5%\" stopColor=\"var(--color-prediction)\" stopOpacity={0.1} />
                                <stop offset=\"95%\" stopColor=\"var(--color-prediction)\" stopOpacity={0} />
                            </linearGradient>
                             <linearGradient id=\"fillPrediction\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">
                                <stop offset=\"5%\" stopColor=\"var(--color-prediction)\" stopOpacity={0.8} />
                                <stop offset=\"95%\" stopColor=\"var(--color-prediction)\" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <Area type=\"monotone\" dataKey=\"confidence\" stackId=\"1\" stroke=\"\" fill=\"url(#fillConfidence)\" />
                        <Area type=\"monotone\" dataKey=\"prediction\" stackId=\"2\" stroke=\"var(--color-prediction)\" fill=\"url(#fillPrediction)\" />
                    </AreaChart>
                </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}