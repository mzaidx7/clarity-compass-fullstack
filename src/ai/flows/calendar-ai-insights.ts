'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing personalized tips to students based on their calendar schedule to improve study/life balance and reduce burnout risk.
 *
 * - `getCalendarInsights` - An async function that takes a calendar schedule as input and returns personalized tips.
 * - `CalendarInsightsInput` - The input type for the `getCalendarInsights` function.
 * - `CalendarInsightsOutput` - The output type for the `getCalendarInsights` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalendarEventSchema = z.object({
  type: z.enum(['Exam', 'Assignment', 'Study Session', 'Sleep', 'Exercise/Break', 'Meeting/Presentation', 'Work Shift']),
  startTime: z.string().describe('The start time of the event in ISO format.'),
  endTime: z.string().describe('The end time of the event in ISO format.'),
  description: z.string().optional().describe('Optional description of the event.'),
});

const CalendarInsightsInputSchema = z.object({
  events: z.array(CalendarEventSchema).describe('An array of calendar events.'),
});
export type CalendarInsightsInput = z.infer<typeof CalendarInsightsInputSchema>;

const CalendarInsightsOutputSchema = z.object({
  tips: z.array(
    z.string().describe('A personalized tip for improving study/life balance.')
  ).describe('An array of personalized tips based on the calendar schedule.'),
});
export type CalendarInsightsOutput = z.infer<typeof CalendarInsightsOutputSchema>;

export async function getCalendarInsights(input: CalendarInsightsInput): Promise<CalendarInsightsOutput> {
  return calendarInsightsFlow(input);
}

const calendarInsightsPrompt = ai.definePrompt({
  name: 'calendarInsightsPrompt',
  input: {schema: CalendarInsightsInputSchema},
  output: {schema: CalendarInsightsOutputSchema},
  prompt: `You are an AI assistant designed to analyze a student's calendar schedule and provide personalized tips to improve their study/life balance and reduce their risk of burnout.

  Analyze the following calendar events and provide 2-3 specific, actionable tips. Consider factors like:
  *   Workload intensity (density of events, long study sessions).
  *   Deadline proximity (upcoming exams and assignments).
  *   Sleep patterns (consistent sleep schedule, sufficient sleep duration).
  *   Breaks and exercise (presence of breaks, exercise sessions).
  *   Event types and overlaps

  Calendar Events:
  {{#each events}}
  - Type: {{type}}, Start: {{startTime}}, End: {{endTime}}, Description: {{description}}
  {{/each}}

  Tips:
  `,
});

const calendarInsightsFlow = ai.defineFlow(
  {
    name: 'calendarInsightsFlow',
    inputSchema: CalendarInsightsInputSchema,
    outputSchema: CalendarInsightsOutputSchema,
  },
  async input => {
    const {output} = await calendarInsightsPrompt(input);
    return output!;
  }
);
