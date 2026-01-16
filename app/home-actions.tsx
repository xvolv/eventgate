import Link from "next/link";
import { Button } from "@/components/ui/button";

type HomeActionsProps = {
  isAuthed: boolean;
  isVerified: boolean;
  userEmail: string;
  dashboardHref: string;
};

export function HomeActions({
  isAuthed,
  isVerified,
  userEmail,
  dashboardHref,
}: HomeActionsProps) {
  if (isAuthed && !isVerified) {
    return (
      <div className="flex gap-3 mb-12">
        <Link href={"/verify?email=" + encodeURIComponent(userEmail || "")}>
          <Button size="lg" className="rounded-none hover:cursor-pointer">
            Verify Email
          </Button>
        </Link>
      </div>
    );
  }

  if (isAuthed && isVerified) {
    return (
      <div className="flex gap-3 mb-12">
        <Link href={dashboardHref}>
          <Button size="lg" className="rounded-none hover:cursor-pointer">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-12">
      <Link href="/sign-up">
        <Button size="lg" className="rounded-none hover:cursor-pointer">
          Create Account
        </Button>
      </Link>
      <Link href="/login">
        <Button
          size="lg"
          variant="outline"
          className="rounded-none hover:cursor-pointer"
        >
          Sign In
        </Button>
      </Link>
    </div>
  );
}
