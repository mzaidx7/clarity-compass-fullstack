import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function CalendarPage() {
  return (
    <div className="container mx-auto p-0">
        <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground">Manage your schedule and get AI-powered insights.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>The calendar feature is currently under development. Please check back later!</CardDescription>
            </CardHeader>
            <CardContent>
                <p>This page will display your calendar, allowing you to add and manage events. It will also integrate with our AI to provide insights on your schedule to help you maintain a healthy balance.</p>
            </CardContent>
        </Card>
    </div>
  );
}
