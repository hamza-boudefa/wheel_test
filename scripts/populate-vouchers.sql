-- Populate vouchers table with all the required voucher codes
-- This script ensures all voucher codes are available in the database

-- First, check if vouchers already exist to avoid duplicates
DO $$
BEGIN
    -- Only insert if the vouchers table is empty
    IF NOT EXISTS (SELECT 1 FROM vouchers LIMIT 1) THEN
        
        -- Insert $10 voucher codes (5 codes, 100 uses each)
        INSERT INTO vouchers (code, prize_amount, max_uses) VALUES
        ('UMSPIN10894', 10, 100),
        ('UMSPIN10895', 10, 100),
        ('UMSPIN10896', 10, 100),
        ('UMSPIN10897', 10, 100),
        ('UMSPIN10898', 10, 100);

        -- Insert $20 voucher codes (5 codes, 100 uses each)
        INSERT INTO vouchers (code, prize_amount, max_uses) VALUES
        ('UMSPIN20894', 20, 100),
        ('UMSPIN20895', 20, 100),
        ('UMSPIN20896', 20, 100),
        ('UMSPIN20897', 20, 100),
        ('UMSPIN20898', 20, 100);

        -- Insert $30 voucher codes (5 codes, 80 uses each)
        INSERT INTO vouchers (code, prize_amount, max_uses) VALUES
        ('UMSPIN30894', 30, 80),
        ('UMSPIN30895', 30, 80),
        ('UMSPIN30896', 30, 80),
        ('UMSPIN30897', 30, 80),
        ('UMSPIN30898', 30, 80);

        -- Insert $40 voucher codes (5 codes, 50 uses each)
        INSERT INTO vouchers (code, prize_amount, max_uses) VALUES
        ('UMSPIN40894', 40, 50),
        ('UMSPIN40895', 40, 50),
        ('UMSPIN40896', 40, 50),
        ('UMSPIN40897', 40, 50),
        ('UMSPIN40898', 40, 50);

        -- Insert $50 voucher codes (5 codes, 20 uses each)
        INSERT INTO vouchers (code, prize_amount, max_uses) VALUES
        ('UMSPIN50894', 50, 20),
        ('UMSPIN50895', 50, 20),
        ('UMSPIN50896', 50, 20),
        ('UMSPIN50897', 50, 20),
        ('UMSPIN50898', 50, 20);

        RAISE NOTICE 'Successfully populated % voucher codes!', (SELECT COUNT(*) FROM vouchers);
    ELSE
        RAISE NOTICE 'Vouchers already exist. Current count: %', (SELECT COUNT(*) FROM vouchers);
    END IF;
END $$;

-- Display current voucher statistics
SELECT 
    prize_amount,
    COUNT(*) as total_codes,
    SUM(max_uses) as total_max_uses,
    SUM(current_uses) as total_current_uses,
    SUM(max_uses - current_uses) as remaining_uses
FROM vouchers 
GROUP BY prize_amount 
ORDER BY prize_amount ASC;
