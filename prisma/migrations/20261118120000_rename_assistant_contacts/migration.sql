-- Rename three assistant contacts in saved website settings (if the team list was saved to the DB).
-- Only entries matching BOTH the old name and the WhatsApp number are changed.
UPDATE "Setting"
SET "value" = jsonb_set(
  "value",
  '{team}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'phone' = '+201157270078' AND elem->>'name' = 'Judy Haytham' THEN jsonb_set(elem, '{name}', '"Selia"')
        WHEN elem->>'phone' = '+201106234228' AND elem->>'name' = 'Judy Nader' THEN jsonb_set(elem, '{name}', '"Mina Morcos"')
        WHEN elem->>'phone' = '+201010309627' AND elem->>'name' = 'Martin' THEN jsonb_set(elem, '{name}', '"Jaiana"')
        ELSE elem
      END
      ORDER BY ord
    )
    FROM jsonb_array_elements("value"->'team') WITH ORDINALITY AS t(elem, ord)
  )
),
"updatedAt" = NOW()
WHERE "key" = 'site'
  AND jsonb_typeof("value"->'team') = 'array'
  AND jsonb_array_length("value"->'team') > 0;
