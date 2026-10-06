-- ==============================================================================
-- Migration: 20261006000000_core_schema.sql
-- Description: Production-Ready Database Schema for Code Review Agent
-- Tables:
--   1. profiles (linked to auth.users)
--   2. repository_connections (OAuth & VCS integration credentials/metadata)
--   3. repositories (tracked repositories with review settings)
--   4. review_jobs (individual analysis runs, PR/push/manual triggers)
--   5. review_files (per-file scan status and metrics)
--   6. review_findings (detected vulnerabilities, bugs, code style issues)
--   7. review_results (high-level scores, verdicts, and markdown summaries)
--   8. review_history (audit log and quality trend timeline)
-- Security: Strict Row Level Security (RLS) enabled on all tables
-- Performance: Covering indexes on all FKs and query columns
-- ==============================================================================

-- 1. Helper function for maintaining updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke execute on function public.handle_updated_at() from public, anon, authenticated;

-- 2. Profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  company text,
  bio text,
  github_username text,
  notification_preferences jsonb not null default '{"email_on_review_complete": true, "email_on_critical_finding": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Trigger for automatically creating profiles on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to postgres, service_role;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for existing users
insert into public.profiles (id, display_name, avatar_url)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
  coalesce(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture')
from auth.users
on conflict (id) do nothing;

-- 3. Repository Connections table
create table if not exists public.repository_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'github' check (provider in ('github', 'gitlab', 'bitbucket', 'custom')),
  account_identifier text not null,
  account_name text not null,
  account_avatar_url text,
  installation_id text,
  access_token_encrypted text,
  scopes text[] not null default array[]::text[],
  status text not null default 'active' check (status in ('active', 'revoked', 'expired', 'error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, account_identifier)
);

create or replace trigger set_repository_connections_updated_at
  before update on public.repository_connections
  for each row execute function public.handle_updated_at();

-- 4. Repositories table
create table if not exists public.repositories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.repository_connections(id) on delete set null,
  provider text not null default 'github' check (provider in ('github', 'gitlab', 'bitbucket', 'custom')),
  repo_identifier text not null,
  name text not null,
  full_name text not null,
  clone_url text not null,
  html_url text not null,
  default_branch text not null default 'main',
  is_private boolean not null default false,
  language text,
  description text,
  stars_count integer not null default 0,
  forks_count integer not null default 0,
  is_active boolean not null default true,
  settings jsonb not null default '{"auto_review_prs": true, "fail_on_critical": true, "rulesets": ["owasp", "clean_code", "performance"]}'::jsonb,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, full_name)
);

create or replace trigger set_repositories_updated_at
  before update on public.repositories
  for each row execute function public.handle_updated_at();

-- 5. Review Jobs table
create table if not exists public.review_jobs (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references public.repositories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_type text not null default 'manual' check (trigger_type in ('manual', 'pull_request', 'push', 'scheduled', 'api')),
  pull_request_number integer,
  pull_request_title text,
  branch text not null default 'main',
  base_branch text,
  commit_sha text not null,
  commit_message text,
  commit_author text,
  status text not null default 'queued' check (status in ('queued', 'cloning', 'scanning', 'analyzing', 'completed', 'failed', 'cancelled')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  error_message text,
  error_stack text,
  started_at timestamptz,
  completed_at timestamptz,
  total_files integer not null default 0,
  total_lines integer not null default 0,
  critical_count integer not null default 0,
  high_count integer not null default 0,
  medium_count integer not null default 0,
  low_count integer not null default 0,
  info_count integer not null default 0,
  quality_score numeric(4,1) check (quality_score is null or (quality_score >= 0 and quality_score <= 100)),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger set_review_jobs_updated_at
  before update on public.review_jobs
  for each row execute function public.handle_updated_at();

-- 6. Review Files table
create table if not exists public.review_files (
  id uuid primary key default gen_random_uuid(),
  review_job_id uuid not null references public.review_jobs(id) on delete cascade,
  repository_id uuid not null references public.repositories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  language text,
  status text not null default 'pending' check (status in ('pending', 'analyzed', 'skipped', 'failed')),
  lines_count integer not null default 0,
  findings_count integer not null default 0,
  checksum text,
  duration_ms integer,
  error_message text,
  created_at timestamptz not null default now(),
  unique (review_job_id, file_path)
);

-- 7. Review Findings table
create table if not exists public.review_findings (
  id uuid primary key default gen_random_uuid(),
  review_job_id uuid not null references public.review_jobs(id) on delete cascade,
  repository_id uuid not null references public.repositories(id) on delete cascade,
  review_file_id uuid references public.review_files(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low', 'info')),
  category text not null check (category in ('security', 'bug_risk', 'performance', 'code_style', 'architecture', 'best_practice')),
  cwe_id text,
  owasp_category text,
  title text not null,
  description text not null,
  line_start integer not null check (line_start > 0),
  line_end integer not null check (line_end >= line_start),
  column_start integer,
  column_end integer,
  snippet text,
  recommendation text not null,
  suggested_fix text,
  fix_applied boolean not null default false,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed', 'false_positive', 'ignored')),
  dismissed_reason text,
  dismissed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace trigger set_review_findings_updated_at
  before update on public.review_findings
  for each row execute function public.handle_updated_at();

-- 8. Review Results table
create table if not exists public.review_results (
  id uuid primary key default gen_random_uuid(),
  review_job_id uuid not null unique references public.review_jobs(id) on delete cascade,
  repository_id uuid not null references public.repositories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  verdict text not null check (verdict in ('passed', 'passed_with_warnings', 'failed', 'blocked')),
  score numeric(4,1) not null default 100.0 check (score >= 0 and score <= 100),
  summary_markdown text not null,
  strengths text[] not null default array[]::text[],
  improvements text[] not null default array[]::text[],
  critical_issues integer not null default 0,
  high_issues integer not null default 0,
  medium_issues integer not null default 0,
  low_issues integer not null default 0,
  info_issues integer not null default 0,
  rules_evaluated integer not null default 0,
  execution_time_ms integer not null default 0,
  raw_report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 9. Review History table
create table if not exists public.review_history (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references public.repositories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  review_job_id uuid references public.review_jobs(id) on delete cascade,
  event_type text not null check (event_type in ('job_created', 'job_started', 'job_completed', 'job_failed', 'finding_detected', 'finding_resolved', 'finding_dismissed', 'score_improved', 'score_regressed')),
  actor_id uuid references auth.users(id) on delete set null,
  commit_sha text,
  quality_score numeric(4,1),
  critical_count integer not null default 0,
  high_count integer not null default 0,
  description text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 10. Indexes for fast queries, joins, and cascades
create index if not exists idx_repo_connections_user_id on public.repository_connections(user_id);
create index if not exists idx_repo_connections_provider on public.repository_connections(provider);

create index if not exists idx_repositories_user_id on public.repositories(user_id);
create index if not exists idx_repositories_connection_id on public.repositories(connection_id);
create index if not exists idx_repositories_user_active on public.repositories(user_id, is_active);
create index if not exists idx_repositories_full_name on public.repositories(user_id, full_name);

create index if not exists idx_review_jobs_user_id on public.review_jobs(user_id);
create index if not exists idx_review_jobs_repository_id on public.review_jobs(repository_id);
create index if not exists idx_review_jobs_user_status on public.review_jobs(user_id, status);
create index if not exists idx_review_jobs_commit_sha on public.review_jobs(repository_id, commit_sha);
create index if not exists idx_review_jobs_created_at on public.review_jobs(user_id, created_at desc);

create index if not exists idx_review_files_job_id on public.review_files(review_job_id);
create index if not exists idx_review_files_repository_id on public.review_files(repository_id);
create index if not exists idx_review_files_user_id on public.review_files(user_id);
create index if not exists idx_review_files_path on public.review_files(review_job_id, file_path);

create index if not exists idx_review_findings_job_id on public.review_findings(review_job_id);
create index if not exists idx_review_findings_repository_id on public.review_findings(repository_id);
create index if not exists idx_review_findings_user_id on public.review_findings(user_id);
create index if not exists idx_review_findings_file_id on public.review_findings(review_file_id);
create index if not exists idx_review_findings_user_severity on public.review_findings(user_id, severity);
create index if not exists idx_review_findings_user_status on public.review_findings(user_id, status);
create index if not exists idx_review_findings_user_category on public.review_findings(user_id, category);
create index if not exists idx_review_findings_job_file on public.review_findings(review_job_id, file_path);

create index if not exists idx_review_results_job_id on public.review_results(review_job_id);
create index if not exists idx_review_results_repository_id on public.review_results(repository_id);
create index if not exists idx_review_results_user_id on public.review_results(user_id);
create index if not exists idx_review_results_user_verdict on public.review_results(user_id, verdict);

create index if not exists idx_review_history_user_id on public.review_history(user_id);
create index if not exists idx_review_history_repository_id on public.review_history(repository_id);
create index if not exists idx_review_history_job_id on public.review_history(review_job_id);
create index if not exists idx_review_history_actor_id on public.review_history(actor_id);
create index if not exists idx_review_history_user_event on public.review_history(user_id, event_type);
create index if not exists idx_review_history_created_at on public.review_history(user_id, created_at desc);

-- 11. Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.repository_connections enable row level security;
alter table public.repositories enable row level security;
alter table public.review_jobs enable row level security;
alter table public.review_files enable row level security;
alter table public.review_findings enable row level security;
alter table public.review_results enable row level security;
alter table public.review_history enable row level security;

-- 12. RLS Policies (Optimized with (select auth.uid()) cached subqueries)

-- PROFILES
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- REPOSITORY_CONNECTIONS
create policy "repo_conn_select_own"
  on public.repository_connections for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "repo_conn_insert_own"
  on public.repository_connections for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "repo_conn_update_own"
  on public.repository_connections for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "repo_conn_delete_own"
  on public.repository_connections for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- REPOSITORIES
create policy "repositories_select_own"
  on public.repositories for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "repositories_insert_own"
  on public.repositories for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "repositories_update_own"
  on public.repositories for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "repositories_delete_own"
  on public.repositories for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- REVIEW_JOBS
create policy "review_jobs_select_own"
  on public.review_jobs for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "review_jobs_insert_own"
  on public.review_jobs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "review_jobs_update_own"
  on public.review_jobs for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "review_jobs_delete_own"
  on public.review_jobs for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- REVIEW_FILES
create policy "review_files_select_own"
  on public.review_files for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "review_files_insert_own"
  on public.review_files for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "review_files_update_own"
  on public.review_files for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "review_files_delete_own"
  on public.review_files for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- REVIEW_FINDINGS
create policy "review_findings_select_own"
  on public.review_findings for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "review_findings_insert_own"
  on public.review_findings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "review_findings_update_own"
  on public.review_findings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "review_findings_delete_own"
  on public.review_findings for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- REVIEW_RESULTS
create policy "review_results_select_own"
  on public.review_results for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "review_results_insert_own"
  on public.review_results for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "review_results_update_own"
  on public.review_results for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "review_results_delete_own"
  on public.review_results for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- REVIEW_HISTORY
create policy "review_history_select_own"
  on public.review_history for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "review_history_insert_own"
  on public.review_history for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "review_history_update_own"
  on public.review_history for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "review_history_delete_own"
  on public.review_history for delete
  to authenticated
  using ((select auth.uid()) = user_id);
