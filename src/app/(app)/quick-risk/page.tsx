"use client";

import { useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { clamp, roundDisplay, levelToColor } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import type { PredictionResponse, SurveyRequest } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

const quickRiskSchema = z.object({
  sleep_hours: z.coerce.number().min(0).max(24),
  study_hours: z.coerce.number().min(0).max(24),
  assignments_due: z.coerce.number().int().min(0),
  exams_within_7d: z.coerce.number().int().min(0),
});

type QuickRiskFormValues = z.infer<typeof quickRiskSchema>;

export default function QuickRiskPage() {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<QuickRiskFormValues>({
    resolver: zodResolver(quickRiskSchema),
    defaultValues: {
      sleep_hours: 8,
      study_hours: 4,
      assignments_due: 2,
      exams_within_7d: 1,
    },
  });

  const onSubmit = async (data: QuickRiskFormValues) => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const result = await api.predict(data);
      const clamped = clamp(result.burnout_score);
      setPrediction({ ...result, burnout_score: Number(clamped.toFixed(2)) });
    } catch (e) {
      setError("An error occurred while fetching the prediction.");
    } finally {
      setIsLoading(false);
    }
  };

  const onSave = async () => {
    setIsSaving(true);
    const data = form.getValues();
    try {
      const response = await api.saveSurveyFull({ input: data, result: prediction ? { ...prediction, burnout_score: Number(prediction.burnout_score.toFixed(2)) } as any : null, timestamp: new Date().toISOString() });
      // Also persist to local history for Progress page
      try {
        const key = user?.id ? `cc_history_${user.id}` : `cc_history_local`;
        const now = new Date().toISOString();
        const entry = { timestamp: now, input: data, result: prediction };
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(entry);
        localStorage.setItem(key, JSON.stringify(existing));
      } catch {}
      toast({ title: "Saved ✅", description: response.message });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save the assessment. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const getRiskColor = (risk: 'Low' | 'Moderate' | 'High') => levelToColor(risk as any).text;

  return (
    <div className="container mx-auto max-w-4xl p-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Quick Risk Assessment</h1>
        <p className="text-muted-foreground">Enter your recent activity to get a quick estimate of your burnout risk.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Inputs</CardTitle>
            <CardDescription>All values are for the last 24 hours, unless specified.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    {Object.keys(form.getValues()).map((key) => {
                        const fieldName = key as keyof QuickRiskFormValues;
                        return (
                            <div key={fieldName} className="space-y-2">
                                <Label htmlFor={fieldName} className="capitalize">{fieldName.replace(/_/g, ' ')}</Label>
                                <Controller
                                    name={fieldName}
                                    control={form.control}
                                    render={({ field }) => (
                                        <Input id={fieldName} type="number" {...field} />
                                    )}
                                />
                                {form.formState.errors[fieldName] && <p className="text-sm text-destructive">{form.formState.errors[fieldName]?.message}</p>}
                            </div>
                        )
                    })}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Predict Risk
                </Button>
              </form>
            </FormProvider>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Prediction Results</CardTitle>
            <CardDescription>Your calculated burnout risk based on your inputs.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {error && <div className="text-center text-destructive"><AlertCircle className="mx-auto mb-2 h-8 w-8" /><p>{error}</p></div>}
            {!isLoading && !error && !prediction && <p className="text-muted-foreground">Results will be shown here.</p>}
            {prediction && (
              <div className="w-full space-y-6 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Burnout Score</p>
                  <p className={`text-6xl font-bold ${getRiskColor(prediction.risk_label)}`}>
                    {roundDisplay(prediction.burnout_score)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Level</p>
                  <p className={`text-2xl font-semibold ${getRiskColor(prediction.risk_label)}`}>
                    {prediction.risk_label}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Top Drivers</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {prediction.top_drivers.length > 0 ? prediction.top_drivers.map(driver => (
                      <Badge key={driver} variant="secondary">{driver}</Badge>
                    )) : <p className="text-sm text-muted-foreground">No specific drivers identified.</p>}
                  </div>
                </div>
                <Button onClick={onSave} className="w-full" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Result
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
