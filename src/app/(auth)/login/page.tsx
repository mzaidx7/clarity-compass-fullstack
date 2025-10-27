'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { DevLoginRequest } from '@/lib/types';
import { FirebaseError } from 'firebase/app';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const devLoginSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
});

type DevLoginFormValues = z.infer<typeof devLoginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [devLoginError, setDevLoginError] = useState<string | null>(null);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<DevLoginFormValues>({
    resolver: zodResolver(devLoginSchema),
  });

  const onDevLogin = async (data: DevLoginFormValues) => {
    try {
      await login(data);
    } catch (error) {
      setDevLoginError('Failed to log in as dev.');
    }
  };

  const onGoogleSignIn = async () => {
    setFirebaseError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // The auth state change will be handled by the useAuth hook
    } catch (error) {
      if (error instanceof FirebaseError) {
        setFirebaseError(error.message);
      } else {
        setFirebaseError('An unknown error occurred during sign-in.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">ClarityCompass</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={onGoogleSignIn} className="w-full">Sign in with Google</Button>
            {firebaseError && <p className="text-sm text-destructive">{firebaseError}</p>}
          </div>
          <Separator className="my-6" />
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">For Development</p>
            <form onSubmit={handleSubmit(onDevLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">Dev User ID</Label>
                <Input id="user_id" {...register('user_id')} />
                {errors.user_id && <p className="text-sm text-destructive">{errors.user_id.message}</p>}
              </div>
              <Button type="submit" variant="secondary" className="w-full">Dev Login</Button>
              {devLoginError && <p className="text-sm text-destructive">{devLoginError}</p>}
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}