-- Initialize the fortune wheel database

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  email VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  credits INTEGER DEFAULT 1,
  total_spins INTEGER DEFAULT 0,
  prizes TEXT[] DEFAULT '{}',
  last_played TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create game_results table
CREATE TABLE IF NOT EXISTS game_results (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) REFERENCES users(email),
  prize VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_game_results_user_email ON game_results(user_email);
CREATE INDEX IF NOT EXISTS idx_game_results_timestamp ON game_results(timestamp);

SELECT 'Database initialized successfully!' as message;
