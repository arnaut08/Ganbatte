import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function AssessmentLoadingScreen({
  title = 'Preparing the grammar deck',
  description = 'Generating the question set and getting both players ready.',
}) {
  return (
    <div className="flex min-h-[calc(100vh-64px-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-6 w-24" />
            <Badge variant="secondary" className="mx-0">Generating deck</Badge>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-black">{title}</CardTitle>
            <CardDescription className="font-bold">{description}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-3 border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-8 w-20" />
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
              <div className="space-y-2 border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000]">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="space-y-2 border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000]">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-black/60">
              <span>Building grammar card set</span>
              <span>Preparing…</span>
            </div>
            <Skeleton className="h-2.5 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AssessmentLoadingScreen;