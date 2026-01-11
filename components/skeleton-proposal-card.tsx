import { Card, CardContent } from "@/components/ui/card";

export function SkeletonProposalCard() {
  return (
    <Card className="shadow-none rounded-none">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left content */}
          <div className="flex-1 space-y-2">
            {/* Title skeleton */}
            <div className="h-5 w-48 skeleton rounded" />

            {/* Time skeleton */}
            <div className="h-4 w-32 skeleton rounded" />

            {/* Status badge skeleton */}
            <div className="h-6 w-20 skeleton rounded-full" />
          </div>

          {/* Action buttons skeleton */}
          <div className="flex gap-2">
            <div className="h-8 w-8 skeleton rounded" />
            <div className="h-8 w-8 skeleton rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
