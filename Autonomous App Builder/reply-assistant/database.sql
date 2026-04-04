-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  created_at timestamptz default now()
);

-- Contacts
create table contacts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  relationship_type text not null,
  relationship_notes text,
  preferred_reply_tone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Conversations
create table conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  contact_id uuid references contacts(id) not null,
  their_message text not null,
  user_goal text not null,
  context_notes text,
  selected_reply text,
  outcome_notes text,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- Reply Drafts
create table reply_drafts (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  tone_label text not null,
  tone_description text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table contacts enable row level security;
alter table conversations enable row level security;
alter table reply_drafts enable row level security;

-- RLS Policies
create policy "Users can manage own profile"
  on profiles for all using (auth.uid() = id);

create policy "Users can manage own contacts"
  on contacts for all using (auth.uid() = user_id);

create policy "Users can manage own conversations"
  on conversations for all using (auth.uid() = user_id);

create policy "Users can manage own reply drafts"
  on reply_drafts for all
  using (
    conversation_id in (
      select id from conversations where user_id = auth.uid()
    )
  );

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Indexes for performance
create index idx_contacts_user_id on contacts(user_id);
create index idx_conversations_user_id on conversations(user_id);
create index idx_conversations_contact_id on conversations(contact_id);
create index idx_conversations_deleted_at on conversations(deleted_at);
create index idx_reply_drafts_conversation_id on reply_drafts(conversation_id);
