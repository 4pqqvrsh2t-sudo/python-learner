CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  learned_concepts TEXT NOT NULL DEFAULT '["print","variables","strings","numbers","input","comparisons","if"]',
  mastery TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_client_id ON subscriptions(client_id);

CREATE TABLE IF NOT EXISTS delivery_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,
  local_date TEXT NOT NULL,
  slot INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(endpoint, local_date, slot)
);

CREATE INDEX IF NOT EXISTS idx_delivery_date_slot ON delivery_log(local_date, slot);
