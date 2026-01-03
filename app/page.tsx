import Link from "next/link";
import { Button } from "@/components/ui/button";


export default function Home() {
  return  <div className="min-h-svh bg-background">
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold font-serif text-gray-600">EventGate</h1>
          <p className="text-sm text-muted-foreground">Event Proposal & Approval System</p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-semibold mb-4 text-balance">Streamline Your Event Approval Process</h2>
          <p className="text-lg text-muted-foreground mb-8 text-pretty">
            EventGate is a professional event proposal and approval system designed for governmental and organizational
            event management. Submit proposals, track status, and manage approvals all in one place.
          </p>

          <div className="flex gap-3 mb-12">
            <Link href="/sign-up">
              <Button size="lg" className="rounded-none">Create Account</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="rounded-none">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
            <div>
              <h3 className="font-semibold text-lg mb-2">For Requesters</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>Submit event proposals with detailed information</li>
                <li>Track proposal status in real-time</li>
                <li>Receive notifications on approvals</li>
                <li>Maintain audit trail of all actions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">For Approvers</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>Review all event proposals systematically</li>
                <li>Approve or reject with detailed feedback</li>
                <li>View approval history and audit trails</li>
                <li>Access system-wide statistics and insights</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-12">
            <h3 className="font-semibold text-lg mb-4">Core Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <p className="font-medium mb-2">7-Day Advance Submission</p>
                <p className="text-muted-foreground">All events must be submitted at least 7 days in advance</p>
              </div>
              <div>
                <p className="font-medium mb-2">Role-Based Access</p>
                <p className="text-muted-foreground">Different views and permissions for requesters and approvers</p>
              </div>
              <div>
                <p className="font-medium mb-2">Complete Audit Trail</p>
                <p className="text-muted-foreground">Track every submission, approval, and modification</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-16 py-6 text-center text-sm text-muted-foreground">
        <p>EventGate - Professional Event Proposal System</p>
      </footer>
    </div>
}
