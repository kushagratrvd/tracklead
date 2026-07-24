"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { publicLeadSchema } from "@/features/leads/validation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, CircleCheckIcon, Loading01Icon } from "@hugeicons/core-free-icons";

// Use z.input to get the pre-parse type (fields are optional/unresolved)
// z.infer gives the post-parse output type which doesn't match raw form field values
type PublicLeadFormValues = z.input<typeof publicLeadSchema>;

export default function PublicLeadPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PublicLeadFormValues>({
    resolver: zodResolver(publicLeadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      source: "public_form",
      website_url_hp: "",
    },
  });

  const onSubmit = async (values: PublicLeadFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to submit lead");
      }

      setSubmittedLead(data.data.lead);
      reset();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-12">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          Public Capture Form Demonstration
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
          Convert Leads into <span className="text-emerald-600 dark:text-emerald-400">Winning Deals</span>
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Submit your contact details below to request a platform demo or consultation. Our sales team will immediately pick up your lead in our live pipeline dashboard.
        </p>
      </div>

      {/* Capture Form Section */}
      <div className="max-w-xl mx-auto w-full">
        <Card className="border border-zinc-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-900">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Request a Consultation
            </CardTitle>
            <CardDescription className="text-zinc-500">
              Fill out your details to get started with TrackLead
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submittedLead ? (
              <div className="flex flex-col items-center text-center py-6 gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <HugeiconsIcon icon={CircleCheckIcon} className="size-8" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Lead Received!
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm">
                  Thank you, <strong className="text-zinc-900 dark:text-zinc-100">{submittedLead.name}</strong>. Your lead has been logged into our pipeline system with status <span className="font-semibold text-emerald-600 capitalize">New</span>.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSubmittedLead(null)}
                  >
                    Submit Another Lead
                  </Button>
                  <Link href="/login">
                    <Button className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 gap-2">
                      Go to Dashboard <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
                    {errorMessage}
                  </div>
                )}

                {/* Honeypot Spam Protection Field */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  {...register("website_url_hp")}
                />

                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Alex Morgan"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-500 font-medium">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Work Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="alex@company.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 019-2834"
                      {...register("phone")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      placeholder="Acme Corp"
                      {...register("company")}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11 text-base mt-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <HugeiconsIcon icon={Loading01Icon} className="animate-spin size-4" /> Submitting Lead...
                    </span>
                  ) : (
                    "Submit Lead Request"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
