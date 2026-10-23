-- Invoices for the paid services (menu setup, photo editing).
--
-- ORIZ is run by a Kleinunternehmer: invoices carry no VAT and the exemption note
-- (§ 6 Abs. 1 Z 27 UStG). Numbers must run without gaps, so a number is handed out
-- and the invoice is stored in ONE transaction (issue_invoice). Invoices are never
-- changed or deleted afterwards (trigger) — a mistake is corrected with a new invoice.
-- Everything goes through server code (service role): no client policies.

create table public.invoice_counters (
  year int primary key,
  last int not null check (last >= 0)
);

create table public.invoices (
  id                uuid primary key default gen_random_uuid(),
  number            text not null unique,              -- "2026-0001"
  order_id          uuid unique references public.service_orders(id) on delete set null,
  venue_id          uuid references public.venues(id) on delete set null,
  issued_on         date not null,
  service_date      date not null,                     -- Leistungsdatum
  recipient_name    text not null,
  recipient_address text not null,
  description       text not null,
  quantity          int  not null default 1 check (quantity >= 1),
  amount_cents      int  not null check (amount_cents >= 0),
  paid_on           date,
  created_by        uuid not null,
  created_at        timestamptz not null default now()
);
create index invoices_venue_idx on public.invoices (venue_id, issued_on desc);

alter table public.invoice_counters enable row level security;
alter table public.invoices enable row level security;
revoke all on public.invoice_counters from anon, authenticated;
revoke all on public.invoices from anon, authenticated;

-- The order and venue links may be cleared by the database itself (ON DELETE SET NULL);
-- every other column is frozen.
create function public.invoices_freeze() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'invoices cannot be deleted';
  end if;
  if (new.id, new.number, new.issued_on, new.service_date, new.recipient_name, new.recipient_address,
      new.description, new.quantity, new.amount_cents, new.paid_on, new.created_by, new.created_at)
     is distinct from
     (old.id, old.number, old.issued_on, old.service_date, old.recipient_name, old.recipient_address,
      old.description, old.quantity, old.amount_cents, old.paid_on, old.created_by, old.created_at) then
    raise exception 'invoices cannot be changed';
  end if;
  return new;
end;
$$;
create trigger invoices_freeze_trg
  before update or delete on public.invoices
  for each row execute function public.invoices_freeze();

-- Numbers and invoice in one step; a failure rolls the number back too.
create function public.issue_invoice(
  p_order_id uuid,
  p_venue_id uuid,
  p_issued_on date,
  p_service_date date,
  p_recipient_name text,
  p_recipient_address text,
  p_description text,
  p_quantity int,
  p_amount_cents int,
  p_paid_on date,
  p_created_by uuid
) returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  y int := extract(year from p_issued_on)::int;
  n int;
  inv public.invoices;
begin
  insert into public.invoice_counters as c (year, last) values (y, 1)
  on conflict (year) do update set last = c.last + 1
  returning c.last into n;

  insert into public.invoices (
    number, order_id, venue_id, issued_on, service_date, recipient_name, recipient_address,
    description, quantity, amount_cents, paid_on, created_by
  ) values (
    y::text || '-' || lpad(n::text, 4, '0'), p_order_id, p_venue_id, p_issued_on, p_service_date,
    p_recipient_name, p_recipient_address, p_description, p_quantity, p_amount_cents, p_paid_on, p_created_by
  ) returning * into inv;
  return inv;
end;
$$;

revoke all on function public.issue_invoice(uuid, uuid, date, date, text, text, text, int, int, date, uuid) from public, anon, authenticated;
grant execute on function public.issue_invoice(uuid, uuid, date, date, text, text, text, int, int, date, uuid) to service_role;
