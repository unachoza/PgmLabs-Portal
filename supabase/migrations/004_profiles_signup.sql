-- Add signup profile fields for participant/funder self-registration.

alter table profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text;