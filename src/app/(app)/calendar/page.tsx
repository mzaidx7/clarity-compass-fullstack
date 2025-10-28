"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import EventCard from "@/components/calendar/EventCard";
import { toLocalDayKey } from "@/lib/utils";

type EventType = 'Exam' | 'Assignment' | 'Study Session' | 'Sleep' | 'Exercise/Break' | 'Meeting/Presentation' | 'Work Shift';

type LocalEvent = {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  start?: string; // HH:mm
  end?: string;   // HH:mm
  description?: string;
};

export default function CalendarPage() {
  const { user } = useAuth();
  const storageKey = user?.id ? `cc_calendar_${user.id}` : `cc_calendar_local`;
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [month, setMonth] = useState<Date>(new Date());
  const [eventCounts, setEventCounts] = useState<Map<string, number>>(new Map());

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("Study Session");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [description, setDescription] = useState("");

  const selectedISO = useMemo(() => {
    if (!selectedDay) return undefined;
    const d = new Date(selectedDay);
    d.setHours(0,0,0,0);
    return d.toISOString().slice(0,10);
  }, [selectedDay]);

  useEffect(() => {
    (async () => {
      try {
        const date = selectedISO;
        const items = await (await import('@/lib/api')).apiSafe.calendarList(date).then(r => r.data || []);
        setEvents(items as any);
      } catch {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) setEvents(JSON.parse(raw));
        } catch {}
      }
    })();
  }, [storageKey, selectedISO]);

  // Load markers for current month (counts per day)
  useEffect(() => {
    (async () => {
      try {
        const res = await (await import('@/lib/api')).apiSafe.calendarMonthDays(month.getFullYear(), month.getMonth()+1);
        const map = new Map<string, number>();
        for (const d of (res.data?.days || [])) map.set(d.date, d.count);
        setEventCounts(map);
      } catch {
        // ignore
      }
    })();
  }, [month]);

  const dayEvents = useMemo(() => {
    return events.filter(e => e.date === selectedISO);
  }, [events, selectedISO]);

  const isTimeRangeValid = () => {
    if (!start && !end) return true; // allow all-day
    if (!start || !end) return false;
    return end > start;
  };

  const addEvent = async () => {
    if (!selectedISO || !title.trim()) return;
    if (!isTimeRangeValid()) return;
    try {
      const created = await (await import('@/lib/api')).api.addCalendarEvent({
        title: title.trim(),
        type,
        date: selectedISO,
        start: start || undefined,
        end: end || undefined,
        description: description || undefined,
      } as any);
      const updated = [...events, created as any];
      setEvents(updated);
      setTitle(""); setStart(""); setEnd(""); setDescription("");
    } catch {
      const ev: LocalEvent = {
        id: `${Date.now()}`,
        title: title.trim(),
        type,
        date: selectedISO,
        start: start || undefined,
        end: end || undefined,
        description: description || undefined,
      };
      const updated = [...events, ev];
      setEvents(updated);
      try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
      setTitle(""); setStart(""); setEnd(""); setDescription("");
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await (await import('@/lib/api')).api.deleteCalendarEvent(id);
      const updated = events.filter(e => e.id !== id);
      setEvents(updated);
    } catch {
      const updated = events.filter(e => e.id !== id);
      setEvents(updated);
      try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
    }
  };

  const tips = useMemo(() => {
    if (!dayEvents.length) return ["No events — consider scheduling breaks and focused study blocks."];
    const hasExam = dayEvents.some(e => e.type === 'Exam');
    const manyItems = dayEvents.length >= 4;
    const suggestions: string[] = [];
    if (hasExam) suggestions.push("Exam day: plan 7–8h sleep and a short walk.");
    if (manyItems) suggestions.push("Full day: add buffers between tasks and a 15m break every 90m.");
    if (!hasExam && !manyItems) suggestions.push("Balanced schedule. Keep water and short breaks.");
    return suggestions;
  }, [dayEvents]);

  return (
    <div className="container mx-auto p-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">Plan your day and keep balance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Select a date</CardTitle>
            <CardDescription>Pick a day to add or review events.</CardDescription>
          </CardHeader>
          <CardContent>
            <DayPicker
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={selectedDay}
              onSelect={setSelectedDay}
              modifiers={{
                eventLight: (day: Date) => (eventCounts.get(toLocalDayKey(day)) || 0) === 1,
                eventMed: (day: Date) => (eventCounts.get(toLocalDayKey(day)) || 0) === 2,
                eventHeavy: (day: Date) => (eventCounts.get(toLocalDayKey(day)) || 0) >= 3,
              }}
              modifiersClassNames={{
                eventLight: 'relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary/40',
                eventMed: 'relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary/70',
                eventHeavy: 'relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-2 after:h-2 after:rounded-full after:bg-primary',
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Event</CardTitle>
            <CardDescription>Keep entries simple and actionable.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as EventType)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {['Exam','Assignment','Study Session','Sleep','Exercise/Break','Meeting/Presentation','Work Shift'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="start">Start</Label>
                <Input id="start" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="end">End</Label>
                <Input id="end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="desc">Description</Label>
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button onClick={addEvent} className="w-full" disabled={!title || !selectedISO || !isTimeRangeValid()}>Add to {selectedISO || 'date'}</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Events for {selectedISO || '—'}</CardTitle>
            <CardDescription>Manage the day’s plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dayEvents.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
            {dayEvents.map(ev => (
              <EventCard key={ev.id} ev={ev} onEdit={(id) => { const e = dayEvents.find(x=>x.id===id)!; setTitle(e.title); setType(e.type as any); setStart(e.start || ''); setEnd(e.end || ''); setDescription(e.description || ''); deleteEvent(id); }} onDelete={(id)=> { if (confirm('Delete this event?')) deleteEvent(id); }} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Day Tips</CardTitle>
            <CardDescription>Lightweight suggestions for balance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {tips.map((t, i) => (
              <div key={i} className="rounded-md border p-2 text-sm">{t}</div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
