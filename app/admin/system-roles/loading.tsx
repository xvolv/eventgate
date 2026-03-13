import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 grid gap-8">
      <Card className="border-border/60 bg-muted/40 rounded-none">
        <CardHeader className="space-y-1">
          <div className="h-5 w-44 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-80 bg-gray-100 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_auto]">
            <div className="h-11 bg-gray-200 rounded animate-pulse" />
            <div className="h-11 bg-gray-200 rounded animate-pulse" />
            <div className="h-11 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader className="space-y-2">
          <div className="h-5 w-56 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-72 bg-gray-100 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="grid gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`roles-skeleton-${idx}`}
              className="h-12 bg-gray-100 rounded animate-pulse"
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
