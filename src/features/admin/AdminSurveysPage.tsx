import { useState } from 'react';
import { useApiResource } from '../../lib/useApi';
import { api } from '../../lib/apiClient';
import type { Survey, SurveyQuestion } from '../../lib/types';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';
import { StatusBadge } from '../../components/Badge';

type DraftQuestion = Pick<SurveyQuestion, 'question_text' | 'question_type' | 'required'>;

export function AdminSurveysPage() {
  const { data: surveys, loading, error, reload } = useApiResource<Survey[]>('/surveys');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState<Survey['recurrence']>('none');
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    { question_text: '', question_type: 'text', required: true },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function updateQuestion(i: number, patch: Partial<DraftQuestion>) {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, { question_text: '', question_type: 'text', required: false }]);
  }

  function removeQuestion(i: number) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function create() {
    setSubmitting(true);
    setFormError(null);
    try {
      await api.post('/surveys', {
        title,
        description,
        recurrence,
        questions: questions.map((q, idx) => ({ ...q, sort_order: idx })),
      });
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setRecurrence('none');
      setQuestions([{ question_text: '', question_type: 'text', required: true }]);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create survey.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(survey: Survey) {
    await api.patch(`/surveys/${survey.id}`, { is_active: !survey.is_active });
    await reload();
  }

  if (loading) return <div className="page-loading">Loading surveys…</div>;
  if (error) return <div className="banner-error">{error}</div>;

  return (
    <div>
      <h1>Surveys</h1>
      <div className="toolbar">
        <button className="btn" onClick={() => setShowCreate(true)}>
          Build survey
        </button>
      </div>

      <div className="card-grid">
        {(surveys ?? []).map((s) => (
          <div className="card" key={s.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3>{s.title}</h3>
              <StatusBadge status={s.is_active ? 'active' : 'paused'} />
            </div>
            <p className="form-hint">{s.description}</p>
            <span className="form-hint">Recurrence: {s.recurrence}</span>
            <div className="form-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(s)}>
                {s.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <Modal title="Build survey" onClose={() => setShowCreate(false)}>
          {formError && <div className="banner-error">{formError}</div>}
          <FormField label="Title" required>
            {(id) => <input id={id} required value={title} onChange={(e) => setTitle(e.target.value)} />}
          </FormField>
          <FormField label="Description">
            {(id) => <textarea id={id} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />}
          </FormField>
          <FormField label="Recurrence">
            {(id) => (
              <select id={id} value={recurrence} onChange={(e) => setRecurrence(e.target.value as Survey['recurrence'])}>
                <option value="none">One-time</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            )}
          </FormField>

          <h3>Questions</h3>
          {questions.map((q, i) => (
            <div key={i} className="card" style={{ marginBottom: 'var(--space-3)' }}>
              <FormField label={`Question ${i + 1}`} required>
                {(id) => (
                  <input
                    id={id}
                    required
                    value={q.question_text}
                    onChange={(e) => updateQuestion(i, { question_text: e.target.value })}
                  />
                )}
              </FormField>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <select
                  aria-label={`Question ${i + 1} type`}
                  value={q.question_type}
                  onChange={(e) => updateQuestion(i, { question_type: e.target.value as DraftQuestion['question_type'] })}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="select">Select</option>
                  <option value="multiselect">Multi-select</option>
                  <option value="boolean">Yes/No</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => updateQuestion(i, { required: e.target.checked })}
                  />
                  Required
                </label>
                {questions.length > 1 && (
                  <button className="btn btn-secondary btn-sm" onClick={() => removeQuestion(i)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={addQuestion}>
            + Add question
          </button>

          <div className="form-actions">
            <button className="btn" onClick={create} disabled={submitting || !title}>
              {submitting ? 'Creating…' : 'Create survey'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
