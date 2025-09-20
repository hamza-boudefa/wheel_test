-- Add vouchers table for the fortune wheel system
-- This table stores all pre-generated voucher codes with their usage limits

CREATE TABLE IF NOT EXISTS vouchers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  prize_amount INTEGER NOT NULL,
  max_uses INTEGER NOT NULL,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert all the pre-generated voucher codes from the client requirements

-- $10 voucher codes (5 codes, 100 uses each)
INSERT INTO vouchers (code, prize_amount, max_uses) VALUES
('UMSPIN10894', 10, 100),
('UMSPIN10895', 10, 100),
('UMSPIN10896', 10, 100),
('UMSPIN10897', 10, 100),
('UMSPIN10898', 10, 100);

-- $20 voucher codes (5 codes, 100 uses each)
INSERT INTO vouchers (code, prize_amount, max_uses) VALUES
('UMSPIN20894', 20, 100),
('UMSPIN20895', 20, 100),
('UMSPIN20896', 20, 100),
('UMSPIN20897', 20, 100),
('UMSPIN20898', 20, 100);

-- $30 voucher codes (5 codes, 80 uses each)
INSERT INTO vouchers (code, prize_amount, max_uses) VALUES
('UMSPIN30894', 30, 80),
('UMSPIN30895', 30, 80),
('UMSPIN30896', 30, 80),
('UMSPIN30897', 30, 80),
('UMSPIN30898', 30, 80);

-- $40 voucher codes (5 codes, 50 uses each)
INSERT INTO vouchers (code, prize_amount, max_uses) VALUES
('UMSPIN40894', 40, 50),
('UMSPIN40895', 40, 50),
('UMSPIN40896', 40, 50),
('UMSPIN40897', 40, 50),
('UMSPIN40898', 40, 50);

-- $50 voucher codes (5 codes, 20 uses each)
INSERT INTO vouchers (code, prize_amount, max_uses) VALUES
('UMSPIN50894', 50, 20),
('UMSPIN50895', 50, 20),
('UMSPIN50896', 50, 20),
('UMSPIN50897', 50, 20),
('UMSPIN50898', 50, 20);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vouchers_prize_amount ON vouchers(prize_amount);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);

SELECT 'Vouchers table created and populated successfully!' as message;
