-- Admin knowledge base: internal reference articles (conference strategy, FAQs,
-- deck outlines, etc.) with optional external links (Drive, forms, videos).
-- Admin-only — no participant or funder access.

create table knowledge_base_articles (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  content text,
  links jsonb not null default '[]'::jsonb,
  created_by uuid not null references profiles(id) on delete cascade,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index knowledge_base_articles_category_idx on knowledge_base_articles(category);

alter table knowledge_base_articles enable row level security;

create policy knowledge_base_articles_admin_all on knowledge_base_articles for all
  using (current_role_name() = 'admin')
  with check (current_role_name() = 'admin');
