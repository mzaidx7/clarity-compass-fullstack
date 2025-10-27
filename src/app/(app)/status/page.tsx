
"use client"

import { useEffect, useState } from "react";
import Link from 'next/link';
import { api } from "@/lib/api";
import { HealthResponse, ModelStatusResponse } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle } from "lucide-react";

const StatusIndicator = ({ status }: { status: boolean }) => (
    status ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
);

export default function StatusPage() {
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [healthRes, statusRes] = await Promise.all([
                    api.health(),
                    api.status()
                ]);
                setHealth(healthRes);
                setModelStatus(statusRes);
            } catch (error) {
                console.error("Failed to fetch status:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="container mx-auto p-0">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
                <p className="text-muted-foreground">Check the health of the application services and models.</p>
            </div>
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${health?.status === 'ok' ? 'bg-green-400' : 'bg-red-400'} opacity-75`}></span>
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            </span>
                            <h2 className="text-lg font-semibold">API Status</h2>
                        </div>
                        <Badge variant={health?.status === 'ok' ? "default" : "destructive"} className={health?.status === 'ok' ? "bg-green-500/20 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/30" : ""}>
                            {loading ? "Checking..." : (health?.status === 'ok' ? "All systems operational" : "Service disruption")}
                        </Badge>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Service Health</CardTitle>
                            <CardDescription>Core service status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-8 w-3/4" /> : (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>Status:</span> <span className="font-medium">{health?.status}</span></div>
                                    <div className="flex justify-between"><span>Version:</span> <span className="font-medium">{health?.version}</span></div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Model Status</CardTitle>
                            <CardDescription>Prediction model details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-12 w-full" /> : (
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>Using:</span> <span className="font-medium">{modelStatus?.using}</span></div>
                                    <div className="flex justify-between items-center"><span>Model Loaded:</span> <StatusIndicator status={modelStatus?.model_loaded || false} /></div>
                                    <div className="flex justify-between items-center"><span>Scaler Loaded:</span> <StatusIndicator status={modelStatus?.scaler_loaded || false} /></div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                 <Card>
                    <CardHeader>
                        <CardTitle>Model Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-16 w-full" /> : (
                            <div className="flex flex-wrap gap-2">
                                {modelStatus?.features.map(f => <Badge key={f} variant="secondary">{f}</Badge>)}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
