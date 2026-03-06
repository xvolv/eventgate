import Link from "next/link";

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
  // If not logged in, show nothing (public page - no auth buttons)
  if (!isAuthed) {
    return null;
  }

  // If logged in but email not verified
  if (!isVerified) {
    return (
      <div className="flex flex-wrap gap-3">
        <a
          href={"/verify?email=" + encodeURIComponent(userEmail || "")}
          className="inline-flex items-center justify-center rounded-md font-semibold text-white px-8 py-3 cursor-pointer shadow-md hover:shadow-lg transition-all text-sm"
          style={{ backgroundColor: "var(--aau-blue)" }}
        >
          Verify Email
        </a>
      </div>
    );
  }

  // If logged in and verified, show dashboard button
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href={dashboardHref}
        prefetch
        className="inline-flex items-center justify-center rounded-md font-semibold text-white px-8 py-3 cursor-pointer shadow-md hover:shadow-lg transition-all"
        style={{ backgroundColor: "var(--aau-blue)" }}
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
