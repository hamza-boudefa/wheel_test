-- Create sessions table for persistent session storage

CREATE TABLE IF NOT EXISTS admin_sessions (
  id VARCHAR(255) PRIMARY KEY,
  admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Clean up any existing expired sessions
DELETE FROM admin_sessions WHERE expires_at < NOW();

SELECT 'Sessions table created successfully!' as message;
