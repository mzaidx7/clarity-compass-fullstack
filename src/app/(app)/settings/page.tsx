"use client";

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { logout, user } = useAuth();
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000', []);
  return (
    <div className="container mx-auto p-0">
        <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your application settings.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Session and authentication.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Signed in as: <span className="font-medium">{user?.id ?? 'anonymous'}</span></p>
              <Button variant="secondary" onClick={logout}>Log out</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>API</CardTitle>
              <CardDescription>Backend configuration overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Base URL: <span className="font-medium">{apiBase}</span></p>
              <p className="text-sm">Mode: <span className="font-medium">Live</span></p>
              <Button variant="outline" onClick={() => {
                try {
                  if (user?.id) localStorage.removeItem(`cc_history_${user.id}`);
                  localStorage.removeItem('cc_history_local');
                } catch {}
              }}>Clear Local History</Button>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
