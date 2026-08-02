import { useApiResource } from '../../lib/useApi';
import type { SurveySubmission } from '../../lib/types';

export function ParticipantSurveyResponsesPage() {
  const { data: submissions, loading, error } = useApiResource<SurveySubmission[]>('/survey-submissions');

  if (loading) return <div className="page-loading">Loading survey responses…</div>;
  if (error) return <div className="banner-error">{error}</div>;

  return (
    <div>
      <h1>Survey Responses</h1>
      {(submissions ?? []).length === 0 && <div className="empty-state">You haven't submitted any surveys yet.</div>}
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {(submissions ?? []).map((s) => (
          <li key={s.id} className="card">
            <div className="card-title-row">
              <strong>{s.surveys?.title ?? 'Survey'}</strong>
              <span className="form-hint">{new Date(s.submitted_at).toLocaleDateString()}</span>
            </div>
            <ul style={{ marginTop: 'var(--space-2)', paddingLeft: 'var(--space-4)' }}>
              {(s.survey_answers ?? [])
                .slice()
                .sort((a, b) => (a.survey_questions?.sort_order ?? 0) - (b.survey_questions?.sort_order ?? 0))
                .map((a) => (
                  <li key={a.id}>
                    <strong>{a.survey_questions?.question_text ?? 'Question'}:</strong> {a.answer_text || '—'}
                  </li>
                ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
