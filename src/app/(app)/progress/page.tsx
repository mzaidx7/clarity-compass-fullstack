import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ProgressPage() {
  return (
    <div className="container mx-auto p-0">
        <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Your Progress</h1>
            <p className="text-muted-foreground">Track your burnout risk over time and see your achievements.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>The progress tracking feature is currently under development. Please check back later!</CardDescription>
            </CardHeader>
            <CardContent>
                <p>This page will show your historical risk scores, trends, and any achievements you've unlocked for maintaining a healthy study-life balance.</p>
            </CardContent>
        </Card>
    </div>
  );
}
