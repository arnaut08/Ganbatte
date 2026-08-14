import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 10;

function AssessmentHistory({ onBack }) {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      if (!supabase) {
        setError('No records found');
        setIsLoading(false);
        return;
      }

      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, count, error: queryError } = await supabase
        .from('assessment_results')
        .select('id, assessment_type, score_percentage, correct_questions, total_questions, created_at, companion_user_id', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (cancelled) return;
      if (queryError) {
        setError('No records found');
      } else {
        setResults(data || []);
        setTotalCount(count ?? 0);
      }
      setIsLoading(false);
    };

    loadHistory();
    return () => { cancelled = true; };
  }, [currentPage]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const scoreVariant = (score) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'destructive';
  };

  return (
    <main className="container mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Your progress
              </p>
              <CardTitle className="text-2xl">Assessment history</CardTitle>
              <CardDescription>Review your previous practice sessions.</CardDescription>
            </div>
            <Button variant="secondary" size="sm" onClick={onBack}>
              <ChevronLeftIcon className="h-4 w-4" />
              Back to home
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      {isLoading && (
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && results.length === 0 && (
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-muted-foreground">
              No records found
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && results.length > 0 && (
        <>
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="divide-y divide-border">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-transform-capitalize">
                        {result.assessment_type.replaceAll('-', ' ')}
                      </p>
                      {result.companion_user_id ? (
                        <p className="text-sm text-secondary">
                          With another player
                        </p>
                      ) : (
                        <p className="text-sm text-secondary">
                          Solo session
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(result.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge
                          variant={scoreVariant(result.score_percentage)}
                          className="text-lg font-bold"
                        >
                          {result.score_percentage}%
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {result.correct_questions}/{result.total_questions} correct
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => goToPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </main>
  );
}

export default AssessmentHistory;
