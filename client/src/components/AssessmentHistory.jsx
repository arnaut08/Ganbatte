import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import './AssessmentHistory.css';

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
        .select('id, assessment_type, score_percentage, correct_questions, total_questions, created_at, companion:profiles!assessment_results_companion_user_id_fkey(display_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (cancelled) return;
      if (queryError) setError('No records found');
      else {
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

  return (
    <main className="history-page">
      <div className="history-header">
        <div>
          <p className="study-kicker">Your progress</p>
          <h2>Assessment history</h2>
          <p>Review your previous practice sessions.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={onBack}>Back to home</button>
      </div>

      {isLoading && <p className="history-state">Loading your history...</p>}
      {error && <p className="history-state history-error">{error}</p>}
      {!isLoading && !error && results.length === 0 && (
        <p className="history-state">No records found</p>
      )}
      {!isLoading && !error && results.length > 0 && (
        <>
          <div className="history-list">
            {results.map((result) => (
              <article className="history-item" key={result.id}>
                <div>
                  <p className="history-type">{result.assessment_type.replaceAll('-', ' ')}</p>
                  {result.companion?.display_name && (
                    <p className="history-companion">With {result.companion.display_name}</p>
                  )}
                  <p className="history-date">{new Date(result.created_at).toLocaleString()}</p>
                </div>
                <div className="history-score">
                  <strong>{result.score_percentage}%</strong>
                  <span>{result.correct_questions}/{result.total_questions} correct</span>
                </div>
              </article>
            ))}
          </div>

          <div className="history-pagination">
            <button
              type="button"
              className="pagination-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <div className="pagination-pages">
              {pageNumbers.map((page) => (
                <button
                  type="button"
                  key={page}
                  className={`pagination-btn ${page === currentPage ? 'pagination-btn-active' : ''}`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="pagination-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </main>
  );
}

export default AssessmentHistory;