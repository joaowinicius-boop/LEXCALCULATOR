-- Tickets (bugs, melhorias, sugestões, dúvidas) com texto, áudio e imagem.
-- Rodado no SQL Editor do projeto LexCalculator (LexGroup) em 23/11/2026.
-- Quem responde: usuários com app_metadata.lex_admin = true (só o banco muda isso;
-- o usuário não consegue se promover, ao contrário de user_metadata/profiles.role).

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  autor text,
  tipo text not null check (tipo in ('bug', 'melhoria', 'sugestao', 'duvida', 'outro')),
  descricao text,
  anexos jsonb not null default '[]'::jsonb,      -- [{ tipo: 'imagem'|'audio', path, nome, tamanho }]
  contexto jsonb not null default '{}'::jsonb,    -- página, passo do cálculo, erro, dados do cálculo
  status text not null default 'aberto' check (status in ('aberto', 'em_andamento', 'resolvido')),
  resposta text,
  respondido_em timestamptz,
  created_at timestamptz not null default now(),
  constraint tickets_tem_conteudo check (coalesce(btrim(descricao), '') <> '' or jsonb_array_length(anexos) > 0)
);
create index tickets_user_created_idx on public.tickets (user_id, created_at desc);

alter table public.tickets enable row level security;

create policy tickets_select on public.tickets for select to authenticated
  using (user_id = (select auth.uid()) or coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'lex_admin')::boolean, false));
create policy tickets_insert on public.tickets for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'aberto' and resposta is null);
create policy tickets_update on public.tickets for update to authenticated
  using (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'lex_admin')::boolean, false))
  with check (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'lex_admin')::boolean, false));

-- Anexos: pasta privada, cada usuário grava em tickets/<seu id>/...; admin lê tudo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tickets', 'tickets', false, 15728640, array['image/*', 'audio/*']);

create policy tickets_anexos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'tickets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy tickets_anexos_select on storage.objects for select to authenticated
  using (bucket_id = 'tickets' and ((storage.foldername(name))[1] = (select auth.uid())::text
         or coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'lex_admin')::boolean, false)));

-- Para dar acesso a quem responde (rodar à parte, com o e-mail da pessoa):
-- update auth.users set raw_app_meta_data = raw_app_meta_data || '{"lex_admin": true}' where email = '<e-mail>';
