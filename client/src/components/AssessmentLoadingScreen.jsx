import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function AssessmentLoadingScreen({
  title = 'Preparing the grammar deck',
  description = 'Generating the question set and getting both players ready.',
}) {
  return (
    <div className="flex min-h-[calc(100vh-64px-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-3xl border-border bg-card/95 shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Badge variant="secondary" className="mx-0">Generating deck</Badge>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            <div className="grid gap-3 pt-2 md:grid-cols-2">
              <div className="space-y-2 rounded-md border border-border bg-background/40 p-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="space-y-2 rounded-md border border-border bg-background/40 p-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Building grammar card set</span>
              <span>Preparing…</span>
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AssessmentLoadingScreen;
