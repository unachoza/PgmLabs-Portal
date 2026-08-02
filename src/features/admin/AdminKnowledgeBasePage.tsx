import { useMemo, useState } from 'react';
import { useApiResource } from '../../lib/useApi';
import { api } from '../../lib/apiClient';
import type { KnowledgeBaseArticle, KnowledgeBaseLink } from '../../lib/types';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';

type Draft = {
  category: string;
  title: string;
  content: string;
  links: KnowledgeBaseLink[];
};

const EMPTY_DRAFT: Draft = { category: '', title: '', content: '', links: [] };

export function AdminKnowledgeBasePage() {
  const { data: articles, loading, error, reload } = useApiResource<KnowledgeBaseArticle[]>('/knowledge-base');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, KnowledgeBaseArticle[]>();
    for (const article of articles ?? []) {
      const list = byCategory.get(article.category) ?? [];
      list.push(article);
      byCategory.set(article.category, list);
    }
    return [...byCategory.entries()];
  }, [articles]);

  function openCreate() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(article: KnowledgeBaseArticle) {
    setEditingId(article.id);
    setDraft({ category: article.category, title: article.title, content: article.content ?? '', links: article.links });
    setFormError(null);
    setShowForm(true);
  }

  function updateLink(i: number, patch: Partial<KnowledgeBaseLink>) {
    setDraft((prev) => ({ ...prev, links: prev.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));
  }

  function addLink() {
    setDraft((prev) => ({ ...prev, links: [...prev.links, { label: '', url: '' }] }));
  }

  function removeLink(i: number) {
    setDraft((prev) => ({ ...prev, links: prev.links.filter((_, idx) => idx !== i) }));
  }

  async function save() {
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        category: draft.category,
        title: draft.title,
        content: draft.content,
        links: draft.links.filter((l) => l.label.trim() && l.url.trim()),
      };
      if (editingId) {
        await api.patch(`/knowledge-base/${editingId}`, payload);
      } else {
        await api.post('/knowledge-base', payload);
      }
      setShowForm(false);
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save article.');
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(article: KnowledgeBaseArticle) {
    if (!confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
    await api.delete(`/knowledge-base/${article.id}`);
    await reload();
  }

  if (loading) return <div className="page-loading">Loading knowledge base…</div>;
  if (error) return <div className="banner-error">{error}</div>;

  return (
    <div>
      <h1>Knowledge Base</h1>
      <div className="toolbar">
        <button className="btn" onClick={openCreate}>
          Add article
        </button>
      </div>

      {grouped.length === 0 && <div className="empty-state">No knowledge base articles yet.</div>}

      {grouped.map(([category, categoryArticles]) => (
        <section key={category} style={{ marginBottom: 'var(--space-6)' }}>
          <h2>{category}</h2>
          <div className="card-grid">
            {categoryArticles.map((article) => (
              <div className="card" key={article.id}>
                <div className="card-title-row">
                  <h3>{article.title}</h3>
                </div>
                {article.content && (
                  <p style={{ whiteSpace: 'pre-wrap' }}>{article.content}</p>
                )}
                {article.links.length > 0 && (
                  <ul style={{ paddingLeft: 'var(--space-4)' }}>
                    {article.links.map((link, i) => (
                      <li key={i}>
                        <a href={link.url} target="_blank" rel="noreferrer noopener">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="form-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(article)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(article)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {showForm && (
        <Modal title={editingId ? 'Edit article' : 'Add article'} onClose={() => setShowForm(false)}>
          {formError && <div className="banner-error">{formError}</div>}
          <FormField label="Category" required hint="e.g. Strategy for Alex at Conferences">
            {(id) => (
              <input
                id={id}
                required
                list="kb-categories"
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              />
            )}
          </FormField>
          <datalist id="kb-categories">
            {[...new Set((articles ?? []).map((a) => a.category))].map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <FormField label="Title" required>
            {(id) => <input id={id} required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />}
          </FormField>
          <FormField label="Content" hint="Notes, talking points, answers — plain text">
            {(id) => (
              <textarea id={id} rows={8} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
            )}
          </FormField>

          <h3>Links</h3>
          <p className="form-hint">Paste links to Google Drive files, forms, decks, or videos (e.g. YouTube/Loom).</p>
          {draft.links.map((link, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', marginBottom: 'var(--space-3)' }}>
              <FormField label="Label" required>
                {(id) => (
                  <input id={id} required value={link.label} onChange={(e) => updateLink(i, { label: e.target.value })} />
                )}
              </FormField>
              <FormField label="URL" required>
                {(id) => (
                  <input
                    id={id}
                    required
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(i, { url: e.target.value })}
                  />
                )}
              </FormField>
              <button className="btn btn-secondary btn-sm" onClick={() => removeLink(i)}>
                Remove
              </button>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={addLink}>
            + Add link
          </button>

          <div className="form-actions">
            <button className="btn" onClick={save} disabled={submitting || !draft.category || !draft.title}>
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add article'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
