-- Aftenvagt-checkliste: bar, 3 center-runder og lukkerunde (alle ugedage)

WITH task_defs AS (
  SELECT * FROM (VALUES
    -- Gøremål i baren (runde 1 — løbende i vagten)
    (1, 'cafe', 0, 'Fyld snacks på'),
    (1, 'hallen', 1, 'Fyld bolde op løbende'),
    (1, 'cafe', 2, 'Tør borde af løbende'),
    (1, 'cafe', 3, 'Fyld opvaskemaskine løbende så de begge ikke er helt fyldt dagen efter'),
    (1, 'omklaedningsrum', 4, 'Tjek om der er tøj i tørretumbleren som skal lægges sammen eller tøj der skal vaskes eller tørres'),

    -- 3 runder i centeret: vagtstart (runde 1)
    (1, 'hallen', 10, 'Fjern bolde og affald'),
    (1, 'hallen', 11, 'Sæt bænke på plads'),
    (1, 'sal1', 12, 'Gå ovenpå og tjek for affald og glas samt tør borde af'),
    (1, 'toiletter', 13, 'Tjek toiletterne i centeret for papir på gulvet og om der mangler papir'),

    -- Runde 2 (kl. 19.30)
    (2, 'hallen', 0, 'Fjern bolde og affald'),
    (2, 'hallen', 1, 'Sæt bænke på plads'),
    (2, 'sal1', 2, 'Gå ovenpå og tjek for affald og glas samt tør borde af'),
    (2, 'toiletter', 3, 'Tjek toiletterne i centeret for papir på gulvet og om der mangler papir'),

    -- Runde 3 (efter kl. 22)
    (3, 'hallen', 0, 'Fjern bolde og affald'),
    (3, 'hallen', 1, 'Sæt bænke på plads'),
    (3, 'sal1', 2, 'Gå ovenpå og tjek for affald og glas samt tør borde af'),
    (3, 'toiletter', 3, 'Tjek toiletterne i centeret for papir på gulvet og om der mangler papir'),

    -- Inden luk (lukkerunde)
    (4, 'cafe', 0, 'Fyld køleskab op inden luk'),
    (4, 'hallen', 1, 'Tøm skraldespande som er halvt fyldte samt pant'),
    (4, 'udeareal', 2, 'Gå ud med skrald og pap samt glas'),
    (4, 'cafe', 3, 'Snacksbar ud på lageret, lås køleskabet, lås fadøl'),
    (4, 'cafe', 4, 'Nøgler og resten låses inde i skabet'),
    (4, 'shop', 5, 'Tæl kassen op og send billede til Lasse'),
    (4, 'udeareal', 6, 'Sæt lås på hoveddøren på kontakten')
  ) AS t(round_number, area, sort_order, title)
),
weekdays AS (
  SELECT unnest(
    ARRAY[
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ]::public.weekday[]
  ) AS weekday
)
INSERT INTO public.daily_tasks (weekday, round_number, area, title, sort_order)
SELECT
  wd.weekday,
  td.round_number,
  td.area::public.daily_task_area,
  td.title,
  td.sort_order
FROM task_defs td
CROSS JOIN weekdays wd
WHERE NOT EXISTS (
  SELECT 1
  FROM public.daily_tasks dt
  WHERE dt.weekday = wd.weekday
    AND dt.round_number = td.round_number
    AND dt.title = td.title
);
