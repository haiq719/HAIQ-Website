CREATE TABLE IF NOT EXISTS request_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method          VARCHAR(10) NOT NULL,
  path            VARCHAR(500) NOT NULL,
  status_code     INTEGER NOT NULL,
  duration_ms     INTEGER,
  ip              VARCHAR(50),
  user_agent      VARCHAR(500),
  user_id         UUID,
  request_size    INTEGER,
  response_size   INTEGER,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS error_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level           VARCHAR(10) NOT NULL DEFAULT 'error',
  message         TEXT NOT NULL,
  stack_trace     TEXT,
  pg_error_code   VARCHAR(10),
  path            VARCHAR(500),
  method          VARCHAR(10),
  user_id         UUID,
  ip              VARCHAR(50),
  metadata        JSONB,
  resolved        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID NOT NULL,
  action          VARCHAR(50) NOT NULL,
  resource_type   VARCHAR(50) NOT NULL,
  resource_id     VARCHAR(100),
  resource_name   VARCHAR(200),
  old_data        JSONB,
  new_data        JSONB,
  ip              VARCHAR(50),
  user_agent      VARCHAR(500),
  status          VARCHAR(20) DEFAULT 'success',
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_logs_created ON request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_status ON request_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_request_logs_user ON request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_path ON request_logs(path);
CREATE INDEX IF NOT EXISTS idx_request_logs_method ON request_logs(method);

CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_path ON error_logs(path);

CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON admin_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);
