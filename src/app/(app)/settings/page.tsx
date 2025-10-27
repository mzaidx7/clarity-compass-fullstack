import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-0">
        <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your application settings.</p>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>The settings page is currently under development. Please check back later!</CardDescription>
            </CardHeader>
            <CardContent>
                <p>This page will allow you to configure notifications, connect to external services, and manage your account details.</p>
            </CardContent>
        </Card>
    </div>
  );
}
