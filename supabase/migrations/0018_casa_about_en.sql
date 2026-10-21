-- Casa guest page switches DE/EN, but the property description only had a
-- German version. English guests fall back to `about` when this is empty.
alter table casa.properties add column if not exists about_en text;

update casa.properties
   set about_en = 'A quiet guesthouse in the heart of Vienna, a short walk from the Belvedere.'
 where slug = 'belmondo' and about_en is null;
