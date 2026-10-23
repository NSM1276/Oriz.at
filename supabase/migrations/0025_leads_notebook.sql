-- Sales notebook on the lead inbox: people we meet in person have no email yet, and every lead
-- needs a status, a note and a follow-up date. Written only through server code (service role).

alter table casa.leads alter column email drop not null;
alter table casa.leads
  add column status       text not null default 'neu'
    check (status in ('neu', 'kontaktiert', 'testet', 'kunde', 'kein_interesse')),
  add column follow_up_on date,
  add column note         text,
  add column updated_at   timestamptz not null default now();
create index casa_leads_status_idx on casa.leads (status, follow_up_on);
