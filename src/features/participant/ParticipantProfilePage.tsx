import { useState } from 'react';
import { useApiResource } from '../../lib/useApi';
import { api } from '../../lib/apiClient';
import type { Participant, ParticipantMilestone } from '../../lib/types';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';

type ProfileDraft = {
  company_name: string;
  industry: string;
  company_website: string;
  company_description: string;
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
  current_challenges: string;
};

function draftFromParticipant(p: Participant): ProfileDraft {
  return {
    company_name: p.company_name ?? '',
    industry: p.industry ?? '',
    company_website: p.company_website ?? '',
    company_description: p.company_description ?? '',
    address_line1: p.address_line1 ?? '',
    city: p.city ?? '',
    state: p.state ?? '',
    zip_code: p.zip_code ?? '',
    current_challenges: p.current_challenges ?? '',
  };
}

const EMPTY_MILESTONE_DRAFT = { title: '', description: '', achieved_on: '' };

export function ParticipantProfilePage() {
  const { data: participant, loading, error, reload } = useApiResource<Participant>('/participants/me');
  const { data: milestones, reload: reloadMilestones } = useApiResource<ParticipantMilestone[]>('/participant-milestones');

  const [showEdit, setShowEdit] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [milestoneDraft, setMilestoneDraft] = useState(EMPTY_MILESTONE_DRAFT);
  const [milestoneSubmitting, setMilestoneSubmitting] = useState(false);
  const [milestoneError, setMilestoneError] = useState<string | null>(null);

  function openEdit() {
    if (!participant) return;
    setDraft(draftFromParticipant(participant));
    setFormError(null);
    setShowEdit(true);
  }

  async function saveProfile() {
    if (!draft) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await api.patch('/participants/me', {
        company_name: draft.company_name || null,
        industry: draft.industry || null,
        company_website: draft.company_website || null,
        company_description: draft.company_description || null,
        address_line1: draft.address_line1 || null,
        city: draft.city || null,
        state: draft.state || null,
        zip_code: draft.zip_code || null,
        current_challenges: draft.current_challenges || null,
      });
      setShowEdit(false);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSubmitting(false);
    }
  }

  function openAddMilestone() {
    setEditingMilestoneId(null);
    setMilestoneDraft(EMPTY_MILESTONE_DRAFT);
    setMilestoneError(null);
    setShowMilestoneForm(true);
  }

  function openEditMilestone(m: ParticipantMilestone) {
    setEditingMilestoneId(m.id);
    setMilestoneDraft({ title: m.title, description: m.description ?? '', achieved_on: m.achieved_on?.slice(0, 10) ?? '' });
    setMilestoneError(null);
    setShowMilestoneForm(true);
  }

  async function saveMilestone() {
    setMilestoneSubmitting(true);
    setMilestoneError(null);
    try {
      const payload = {
        title: milestoneDraft.title,
        description: milestoneDraft.description || undefined,
        achieved_on: milestoneDraft.achieved_on || undefined,
      };
      if (editingMilestoneId) {
        await api.patch(`/participant-milestones/${editingMilestoneId}`, payload);
      } else {
        await api.post('/participant-milestones', payload);
      }
      setShowMilestoneForm(false);
      await reloadMilestones();
    } catch (err) {
      setMilestoneError(err instanceof Error ? err.message : 'Could not save milestone.');
    } finally {
      setMilestoneSubmitting(false);
    }
  }

  async function removeMilestone(m: ParticipantMilestone) {
    if (!confirm(`Delete milestone "${m.title}"?`)) return;
    await api.delete(`/participant-milestones/${m.id}`);
    await reloadMilestones();
  }

  if (loading) return <div className="page-loading">Loading your profile…</div>;
  if (error) return <div className="banner-error">{error}</div>;
  if (!participant) return null;

  return (
    <div>
      <h1>My Profile</h1>
      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-title-row">
          <h2 style={{ margin: 0 }}>{participant.profiles?.name}</h2>
          <button className="btn btn-secondary btn-sm" onClick={openEdit}>
            Edit
          </button>
        </div>
        <dl>
          <dt className="card-title">Cohort</dt>
          <dd style={{ margin: '0 0 var(--space-3)' }}>{participant.cohort}</dd>
          <dt className="card-title">Status</dt>
          <dd style={{ margin: '0 0 var(--space-3)' }}>
            <StatusBadge status={participant.status} />
          </dd>
          <dt className="card-title">Company</dt>
          <dd style={{ margin: '0 0 var(--space-3)' }}>{participant.company_name ?? '—'}</dd>
          <dt className="card-title">Industry</dt>
          <dd style={{ margin: '0 0 var(--space-3)' }}>{participant.industry ?? '—'}</dd>
          <dt className="card-title">Website</dt>
          <dd style={{ margin: '0 0 var(--space-3)' }}>{participant.company_website ?? '—'}</dd>
          <dt className="card-title">About the business</dt>
          <dd style={{ margin: '0 0 var(--space-3)' }}>{participant.company_description ?? '—'}</dd>
          <dt className="card-title">Address</dt>
          <dd style={{ margin: '0 0 var(--space-3)' }}>
            {[participant.address_line1, participant.city, participant.state, participant.zip_code].filter(Boolean).join(', ') || '—'}
          </dd>
          <dt className="card-title">Current challenges</dt>
          <dd style={{ margin: 0 }}>{participant.current_challenges ?? '—'}</dd>
        </dl>
      </div>

      <section style={{ marginTop: 'var(--space-6)' }}>
        <div className="toolbar">
          <h2 style={{ margin: 0 }}>Milestones</h2>
          <button className="btn btn-sm" onClick={openAddMilestone}>
            Add milestone
          </button>
        </div>
        {(milestones ?? []).length === 0 && <div className="empty-state">No milestones logged yet.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {(milestones ?? []).map((m) => (
            <div className="card" key={m.id}>
              <div className="card-title-row">
                <strong>{m.title}</strong>
                {m.achieved_on && <span className="form-hint">{new Date(m.achieved_on).toLocaleDateString()}</span>}
              </div>
              {m.description && <p style={{ margin: 'var(--space-2) 0' }}>{m.description}</p>}
              <div className="form-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openEditMilestone(m)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => removeMilestone(m)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showEdit && draft && (
        <Modal title="Edit profile" onClose={() => setShowEdit(false)}>
          {formError && <div className="banner-error">{formError}</div>}
          <FormField label="Company name">
            {(id) => <input id={id} value={draft.company_name} onChange={(e) => setDraft({ ...draft, company_name: e.target.value })} />}
          </FormField>
          <FormField label="Industry">
            {(id) => <input id={id} value={draft.industry} onChange={(e) => setDraft({ ...draft, industry: e.target.value })} />}
          </FormField>
          <FormField label="Company website">
            {(id) => (
              <input id={id} type="url" value={draft.company_website} onChange={(e) => setDraft({ ...draft, company_website: e.target.value })} />
            )}
          </FormField>
          <FormField label="About the business" hint="A short description of what your company does">
            {(id) => (
              <textarea
                id={id}
                rows={3}
                value={draft.company_description}
                onChange={(e) => setDraft({ ...draft, company_description: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Address">
            {(id) => (
              <input id={id} value={draft.address_line1} onChange={(e) => setDraft({ ...draft, address_line1: e.target.value })} />
            )}
          </FormField>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <FormField label="City">
              {(id) => <input id={id} value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />}
            </FormField>
            <FormField label="State">
              {(id) => <input id={id} value={draft.state} onChange={(e) => setDraft({ ...draft, state: e.target.value })} />}
            </FormField>
            <FormField label="Zip code">
              {(id) => <input id={id} value={draft.zip_code} onChange={(e) => setDraft({ ...draft, zip_code: e.target.value })} />}
            </FormField>
          </div>
          <FormField label="Current challenges" hint="What's blocking you right now — the team can use this to prioritize support">
            {(id) => (
              <textarea
                id={id}
                rows={3}
                value={draft.current_challenges}
                onChange={(e) => setDraft({ ...draft, current_challenges: e.target.value })}
              />
            )}
          </FormField>
          <div className="form-actions">
            <button className="btn" onClick={saveProfile} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {showMilestoneForm && (
        <Modal title={editingMilestoneId ? 'Edit milestone' : 'Add milestone'} onClose={() => setShowMilestoneForm(false)}>
          {milestoneError && <div className="banner-error">{milestoneError}</div>}
          <FormField label="Title" required>
            {(id) => (
              <input
                id={id}
                required
                value={milestoneDraft.title}
                onChange={(e) => setMilestoneDraft({ ...milestoneDraft, title: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Date achieved">
            {(id) => (
              <input
                id={id}
                type="date"
                value={milestoneDraft.achieved_on}
                onChange={(e) => setMilestoneDraft({ ...milestoneDraft, achieved_on: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Description">
            {(id) => (
              <textarea
                id={id}
                rows={3}
                value={milestoneDraft.description}
                onChange={(e) => setMilestoneDraft({ ...milestoneDraft, description: e.target.value })}
              />
            )}
          </FormField>
          <div className="form-actions">
            <button className="btn" onClick={saveMilestone} disabled={milestoneSubmitting || !milestoneDraft.title}>
              {milestoneSubmitting ? 'Saving…' : editingMilestoneId ? 'Save changes' : 'Add milestone'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowMilestoneForm(false)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
