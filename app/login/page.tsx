"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, UserCheck01Icon, SecurityCheckIcon } from "@hugeicons/core-free-icons";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Login failed");
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail("admin@digitalheroes.com");
    setPassword("Admin123!");
  };

  const fillDemoMember = () => {
    setEmail("member@digitalheroes.com");
    setPassword("Member123!");
  };

  return (
    <div className="w-full min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-900">
        <CardHeader className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-xl mx-auto mb-2">
            TL
          </div>
          <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Sign In to TrackLead
          </CardTitle>
          <CardDescription className="text-zinc-500 text-sm">
            Access the sales team lead management dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md font-medium">
              {error}
            </div>
          )}

          {/* Quick Demo Credentials Buttons */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <HugeiconsIcon icon={SecurityCheckIcon} className="size-4" /> Quick Demo One-Click Fill:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillDemoAdmin}
                className="text-xs font-medium border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 justify-start"
              >
                <HugeiconsIcon icon={UserCheck01Icon} className="size-3.5 mr-1" /> Admin Demo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillDemoMember}
                className="text-xs font-medium border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 justify-start"
              >
                <HugeiconsIcon icon={UserCheck01Icon} className="size-3.5 mr-1" /> Member Demo
              </Button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@digitalheroes.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 font-semibold h-10 mt-2"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <HugeiconsIcon icon={Loading03Icon} className="animate-spin size-4" /> Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-xs text-zinc-500 justify-center border-t border-zinc-100 dark:border-zinc-800 pt-4">
          Default password for seeded accounts is <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono ml-1">Admin123!</code> / <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">Member123!</code>
        </CardFooter>
      </Card>
    </div>
  );
}
