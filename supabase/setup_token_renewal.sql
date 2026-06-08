-- ============================================================
-- 1. Cria a tabela de configurações do app (se não existir)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. Insere o token atual do Meta Ads (renovado automaticamente)
--    Substitua <TOKEN_ATUAL> pelo valor do META_ADS_ACCESS_TOKEN
-- ============================================================
INSERT INTO app_settings (key, value, updated_at)
VALUES (
  'META_ADS_ACCESS_TOKEN',
  '<TOKEN_ATUAL>',
  NOW()
)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = NOW();

-- ============================================================
-- 3. Ativa a extensão pg_net (necessária para chamadas HTTP)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================================
-- 4. Agenda renovação automática todo dia 1º de cada mês
--    (token dura 60 dias, renovamos a cada 30 → nunca expira)
-- ============================================================
SELECT cron.schedule(
  'refresh-meta-ads-token',          -- nome do job
  '0 9 1 * *',                       -- todo dia 1º às 9h UTC
  $$
  SELECT extensions.http_post(
    url     := 'https://vsryecclsiglogyltyrl.supabase.co/functions/v1/refresh-ads-token',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
