import { useState } from 'react';
import { useApiResource } from '../../lib/useApi';
import { api } from '../../lib/apiClient';
import type { Survey, SurveySubmission } from '../../lib/types';
import { surveyEligibility } from '../../lib/recurrence';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';

export function ParticipantSurveysPage() {
  const { data: surveys, loading, error } = useApiResource<Survey[]>('/surveys');
  const { data: submissions, reload: reloadSubmissions } = useApiResource<SurveySubmission[]>('/survey-submissions');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function lastSubmissionFor(surveyId: string) {
    return (submissions ?? [])
      .filter((s) => s.survey_id === surveyId)
      .map((s) => s.submitted_at)
      .sort()
      .at(-1);
  }

  async function open(id: string) {
    setActiveId(id);
    setAnswers({});
    setSubmitError(null);
    const full = await api.get<Survey>(`/surveys/${id}`);
    setSurvey(full);
  }

  async function submit() {
    if (!survey) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        answers: (survey.questions ?? []).map((q) => ({ question_id: q.id, answer_text: answers[q.id] ?? '' })),
      };
      await api.post(`/surveys/${survey.id}/submissions`, payload);
      await reloadSubmissions();
      setActiveId(null);
      setSurvey(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit survey.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page-loading">Loading surveys…</div>;
  if (error) return <div className="banner-error">{error}</div>;

  return (
    <div>
      <h1>Surveys</h1>
      {(surveys ?? []).length === 0 && <div className="empty-state">No open surveys right now.</div>}
      <div className="card-grid">
        {(surveys ?? []).map((s) => {
          const eligibility = surveyEligibility(s.recurrence, lastSubmissionFor(s.id));
          return (
            <div className="card" key={s.id}>
              <h3>{s.title}</h3>
              <p className="form-hint">{s.description}</p>
              <button className="btn btn-sm" onClick={() => open(s.id)} disabled={eligibility.status !== 'open'}>
                {eligibility.status === 'open' ? 'Fill out' : 'Completed'}
              </button>
              {eligibility.status === 'locked_forever' && (
                <p className="form-hint">Need to change your answer? Contact your program admin.</p>
              )}
              {eligibility.status === 'locked_until' && (
                <p className="form-hint">
                  You can fill this out again on {new Date(eligibility.availableAt).toLocaleDateString()}. Need to update your last
                  answer sooner? Contact your program admin.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {activeId && survey && (
        <Modal title={survey.title} onClose={() => setActiveId(null)}>
          {submitError && <div className="banner-error">{submitError}</div>}
          {(survey.questions ?? []).map((q) => (
            <FormField key={q.id} label={q.question_text} required={q.required}>
              {(id) =>
                q.question_type === 'boolean' ? (
                  <select
                    id={id}
                    value={answers[q.id] ?? ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  >
                    <option value="">Select…</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                ) : q.question_type === 'number' ? (
                  <input
                    id={id}
                    type="number"
                    value={answers[q.id] ?? ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                ) : (
                  <textarea
                    id={id}
                    rows={2}
                    value={answers[q.id] ?? ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                )
              }
            </FormField>
          ))}
          <div className="form-actions">
            <button className="btn" onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit survey'}
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveId(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
