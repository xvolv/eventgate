"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function NewProposalPage() {
  const { data, isPending } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;

    const user = data?.user;

    if (!user) {
      // Not logged in - redirect to login
      router.replace("/login?redirect=" + encodeURIComponent("/proposals/new"));
      return;
    }

    if (!user.emailVerified) {
      // Not verified - redirect to verify page
      router.replace("/verify?email=" + encodeURIComponent(user.email || ""));
      return;
    }

    // User is authenticated and verified
    setIsChecking(false);
  }, [data, isPending, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      // TODO: Wire this to a real API endpoint when available
      await new Promise((resolve) => setTimeout(resolve, 600));
      setMessage("Proposal submitted (demo only).");
      setTitle("");
      setDate("");
      setLocation("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  };

  if (isPending || isChecking) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Checking your session...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <h1 className="text-2xl font-semibold font-serif text-gray-700">
            Submit Event Proposal
          </h1>
          <p className="text-sm text-muted-foreground">
            Provide event details for review and approval.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-10 max-w-5xl">
        <Card className="shadow-none rounded-none">
          <CardHeader>
            <CardTitle className="text-xl">Event Details</CardTitle>
            <CardDescription>
              Fill out the information below to start the approval process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  placeholder="e.g., Annual Budget Review Summit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-none shadow-none focus-visible:ring-0"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="date">Proposed Date</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="rounded-none shadow-none focus-visible:ring-0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    required
                    placeholder="Conference Hall A"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="rounded-none shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Summary</Label>
                <Textarea
                  id="description"
                  required
                  rows={5}
                  placeholder="Describe the event objectives, attendees, and logistical needs."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-none shadow-none focus-visible:ring-0"
                />
              </div>

              {message && <p className="text-sm text-emerald-700">{message}</p>}

              <Button
                type="submit"
                className="w-full md:w-auto rounded-none"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Proposal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
