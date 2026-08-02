import { useState } from 'react';
import { useApiResource } from '../../lib/useApi';
import { api } from '../../lib/apiClient';
import type { HousekeepingFeed, HousekeepingItem, HousekeepingResponseValue } from '../../lib/types';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';

const PRIORITY_BADGE: Record<HousekeepingItem['priority'], string> = {
  high: 'badge-danger',
  medium: 'badge-warning',
  low: 'badge-accent',
};

function pluralize(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function HousekeepingWidget() {
  const { data: feed, error, reload } = useApiResource<HousekeepingFeed>('/housekeeping');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(true);
  const [emailItem, setEmailItem] = useState<HousekeepingItem | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function respond(item: HousekeepingItem, response: HousekeepingResponseValue) {
    setDismissed((prev) => new Set(prev).add(item.item_key));
    try {
      await api.post('/housekeeping/respond', { item_key: item.item_key, response });
    } catch {
      // Best-effort — if this failed the item will simply reappear next load.
    }
  }

  function openEmail(item: HousekeepingItem) {
    setEmailItem(item);
    setSubject(item.suggested_subject ?? '');
    setBody(item.suggested_body ?? '');
    setSendError(null);
  }

  async function confirmSend() {
    if (!emailItem?.participant_id) return;
    setSending(true);
    setSendError(null);
    try {
      await api.post('/housekeeping/send-email', {
        participant_id: emailItem.participant_id,
        subject,
        body,
        item_key: emailItem.item_key,
      });
      setDismissed((prev) => new Set(prev).add(emailItem.item_key));
      setEmailItem(null);
      await reload();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not send email.');
    } finally {
      setSending(false);
    }
  }

  if (error || !feed) return null; // supplementary widget — never block the page it sits on

  const items = feed.items.filter((item) => !dismissed.has(item.item_key));

  if (items.length === 0) {
    return (
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ margin: 0 }}>Housekeeping</h2>
        <p className="form-hint">Nothing needs attention right now — everything looks caught up.</p>
      </div>
    );
  }

  const counts = {
    overdue_checkin: items.filter((i) => i.type === 'overdue_checkin').length,
    risk_response: items.filter((i) => i.type === 'risk_response').length,
    pending_funder_followup: items.filter((i) => i.type === 'pending_funder_followup').length,
    inactive_participant: items.filter((i) => i.type === 'inactive_participant').length,
  };

  return (
    <section className="card" style={{ marginBottom: 'var(--space-6)' }}>
      <div className="card-title-row">
        <h2 style={{ margin: 0 }}>Housekeeping</h2>
        <button className="btn btn-secondary btn-sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Collapse' : `Expand (${items.length})`}
        </button>
      </div>
      <p className="form-hint">
        Needs attention — {pluralize(items.length, 'item')}: {pluralize(counts.overdue_checkin, 'overdue check-in')},{' '}
        {pluralize(counts.risk_response, 'risk flag')}, {pluralize(counts.pending_funder_followup, 'funder follow-up')}, and{' '}
        {pluralize(counts.inactive_participant, 'inactive participant')}.
      </p>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {items.map((item) => (
            <div key={item.item_key} className="card" style={{ boxShadow: 'none' }}>
              <div className="card-title-row">
                <strong>{item.title}</strong>
                <span className={`badge ${PRIORITY_BADGE[item.priority]}`}>{item.priority}</span>
              </div>
              <p style={{ margin: 'var(--space-2) 0' }}>{item.description}</p>
              <div className="form-actions">
                <button
                  className="btn btn-sm"
                  onClick={() => (item.emailable && item.participant_email ? openEmail(item) : respond(item, 'yes'))}
                >
                  Yes
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => respond(item, 'no')}>
                  No
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => respond(item, 'maybe')}>
                  Maybe
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {emailItem && (
        <Modal title="Send follow-up email?" onClose={() => setEmailItem(null)}>
          {sendError && <div className="banner-error">{sendError}</div>}
          <p className="form-hint">
            To: {emailItem.participant_name} &lt;{emailItem.participant_email}&gt;
          </p>
          <FormField label="Subject" required>
            {(id) => <input id={id} required value={subject} onChange={(e) => setSubject(e.target.value)} />}
          </FormField>
          <FormField label="Message" required>
            {(id) => <textarea id={id} rows={8} required value={body} onChange={(e) => setBody(e.target.value)} />}
          </FormField>
          <p className="form-hint">
            This logs the email to the participant's communication history — it doesn't ask you to confirm again after this.
          </p>
          <div className="form-actions">
            <button className="btn" onClick={confirmSend} disabled={sending || !subject.trim() || !body.trim()}>
              {sending ? 'Sending…' : 'Send email'}
            </button>
            <button className="btn btn-secondary" onClick={() => setEmailItem(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
