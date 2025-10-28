"use client";

import { useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle, HelpCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { FusedPredictResponse, FusedPredictRequest } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

const dass21StressQuestions = [
    "I found it hard to wind down",
    "I was aware of dryness of my mouth",
    "I couldn’t seem to experience any positive feeling at all",
    "I experienced breathing difficulty",
    "I found it difficult to work up the initiative to do things",
    "I tended to over-react to situations",
    "I experienced trembling (e.g. in the hands)"
];

const fusedRiskSchema = z.object({
  s_answers: z.array(z.coerce.number().min(0).max(3)).length(7, "You must answer all 7 questions."),
  behavior: z.object({
    coding_hours: z.coerce.number().optional(),
    gaming_hours: z.coerce.number().optional(),
    social_media_hours: z.coerce.number().optional(),
  }).optional(),
});

type FusedRiskFormValues = z.infer<typeof fusedRiskSchema>;

export default function FusedRiskPage() {
  const [prediction, setPrediction] = useState<FusedPredictResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FusedRiskFormValues>({
    resolver: zodResolver(fusedRiskSchema),
    defaultValues: {
        s_answers: Array(7).fill(0),
        behavior: {
            coding_hours: 8,
            gaming_hours: 2,
            social_media_hours: 3,
        }
    },
  });

  const onSubmit = async (data: FusedRiskFormValues) => {
    setIsLoading(true);
    setError(null);
    setPrediction(null);
    try {
      const result = await api.predictFused(data);
      setPrediction(result);
    } catch (e) {
      setError("An error occurred while fetching the prediction.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-4xl p-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Fused Risk Assessment</h1>
        <p className="text-muted-foreground">Combine survey data and behavioral metrics for a comprehensive risk score.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Inputs</CardTitle>
            <CardDescription>Answer the DASS-21 stress questions and optionally provide behavioral data.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Accordion type="single" collapsible defaultValue='item-1'>
                  <AccordionItem value='item-1'>
                    <AccordionTrigger>DASS-21 Stress Questions</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      {dass21StressQuestions.map((q, i) => (
                        <div key={i} className="space-y-2">
                          <Label>{i+1}. {q}</Label>
                          <Controller
                            name={`s_answers.${i}`}
                            control={form.control}
                            render={({ field }) => (
                                <Input type="number" {...field} min={0} max={3} />
                            )}
                          />
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value='item-2'>
                    <AccordionTrigger>
                        <div className="flex items-center gap-2">
                            Optional Behavioral Data
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Providing behavioral data can improve the accuracy of the prediction.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <div className="space-y-2">
                          <Label htmlFor="behavior.coding_hours">Coding Hours</Label>
                          <Controller
                              name="behavior.coding_hours"
                              control={form.control}
                              render={({ field }) => <Input id="behavior.coding_hours" type="number" {...field} />}
                          />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="behavior.gaming_hours">Gaming Hours</Label>
                          <Controller
                              name="behavior.gaming_hours"
                              control={form.control}
                              render={({ field }) => <Input id="behavior.gaming_hours" type="number" {...field} />}
                          />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="behavior.social_media_hours">Social Media Hours</Label>
                          <Controller
                              name="behavior.social_media_hours"
                              control={form.control}
                              render={({ field }) => <Input id="behavior.social_media_hours" type="number" {...field} />}
                          />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                {form.formState.errors.s_answers && <p className="text-sm text-destructive">{form.formState.errors.s_answers.message}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Predict Fused Risk
                </Button>
              </form>
            </FormProvider>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Prediction Results</CardTitle>
            <CardDescription>Your calculated fused burnout risk.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            {isLoading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {error && <div className="text-center text-destructive"><AlertCircle className="mx-auto mb-2 h-8 w-8" /><p>{error}</p></div>}
            {!isLoading && !error && !prediction && <p className="text-muted-foreground">Results will be shown here.</p>}
            {prediction && (
              <div className="w-full space-y-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Final Fused Score</p>
                  <p className="text-6xl font-bold text-primary">{Math.round(prediction.final_score_0_100)}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                    <p className="font-medium">Breakdown</p>
                    <div className="flex justify-around items-center p-2 rounded-lg bg-muted">
                        <div>
                            <p className="text-sm text-muted-foreground">Survey Risk</p>
                            <p className="text-2xl font-semibold">{Math.round(prediction.survey.survey_risk_0_100)}</p>
                        </div>
                        {prediction.behavior && (
                            <>
                                <p className="text-xl font-thin">+</p>
                                <div>
                                    <p className="text-sm text-muted-foreground">Behavior Risk</p>
                                    <p className="text-2xl font-semibold">{Math.round(prediction.behavior.behavior_risk_0_100)}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                 {prediction.survey.top_drivers.length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Top Survey Drivers</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {prediction.survey.top_drivers.map((driver, i) => (
                                <Badge key={i} variant="secondary">{driver}</Badge>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
