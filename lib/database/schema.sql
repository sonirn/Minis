-- Enhanced Database Schema for TRX Mining Platform
-- This file contains the complete database schema with indexes, triggers, and constraints

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with enhanced constraints and indexes
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Should be hashed in production
    mine_balance DECIMAL(15,6) DEFAULT 25.0 CHECK (mine_balance >= 0),
    referral_balance DECIMAL(15,6) DEFAULT 0.0 CHECK (referral_balance >= 0),
    total_referrals INTEGER DEFAULT 0 CHECK (total_referrals >= 0),
    valid_referrals INTEGER DEFAULT 0 CHECK (valid_referrals >= 0),
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    has_active_mining BOOLEAN DEFAULT FALSE,
    has_bought_node4 BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mining nodes configuration (reference table)
CREATE TABLE IF NOT EXISTS mining_nodes (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    storage VARCHAR(20) NOT NULL,
    mining_amount DECIMAL(10,2) NOT NULL CHECK (mining_amount > 0),
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User nodes with enhanced tracking
CREATE TABLE IF NOT EXISTS user_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_id VARCHAR(20) NOT NULL REFERENCES mining_nodes(id),
    transaction_hash VARCHAR(128) UNIQUE NOT NULL, -- Unique constraint for security
    transaction_verified BOOLEAN DEFAULT FALSE,
    transaction_amount DECIMAL(10,2) NOT NULL,
    transaction_verified_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'cancelled')),
    progress DECIMAL(5,2) DEFAULT 0.0 CHECK (progress >= 0 AND progress <= 100),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    mining_amount DECIMAL(10,2) NOT NULL,
    daily_mining DECIMAL(10,2) NOT NULL,
    duration INTEGER NOT NULL,
    total_mined DECIMAL(10,2) DEFAULT 0.0,
    last_mining_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (end_date > start_date),
    CONSTRAINT valid_mining_amounts CHECK (daily_mining > 0 AND mining_amount > 0)
);

-- Referrals with enhanced tracking
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    is_valid BOOLEAN DEFAULT FALSE,
    reward_paid BOOLEAN DEFAULT FALSE,
    reward_amount DECIMAL(10,2) DEFAULT 50.0,
    activated_at TIMESTAMPTZ, -- When the referral became valid
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure users can't refer themselves
    CONSTRAINT no_self_referral CHECK (referrer_id != referred_id),
    -- Unique constraint to prevent duplicate referrals
    CONSTRAINT unique_referral UNIQUE (referrer_id, referred_id)
);

-- Withdrawals with enhanced tracking
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('mine', 'referral')),
    amount DECIMAL(15,6) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    transaction_hash VARCHAR(128), -- For completed withdrawals
    processing_fee DECIMAL(10,6) DEFAULT 0.0,
    net_amount DECIMAL(15,6), -- Amount after fees
    processed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction verification log for security
CREATE TABLE IF NOT EXISTS transaction_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash VARCHAR(128) NOT NULL,
    verification_status VARCHAR(20) NOT NULL CHECK (verification_status IN ('pending', 'verified', 'failed', 'invalid')),
    trongrid_response JSONB,
    verification_attempts INTEGER DEFAULT 1,
    first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_active_mining ON users(has_active_mining) WHERE has_active_mining = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_user_nodes_user_id ON user_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nodes_node_id ON user_nodes(node_id);
CREATE INDEX IF NOT EXISTS idx_user_nodes_transaction_hash ON user_nodes(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_user_nodes_status ON user_nodes(status);
CREATE INDEX IF NOT EXISTS idx_user_nodes_running ON user_nodes(user_id, status) WHERE status = 'running';
CREATE INDEX IF NOT EXISTS idx_user_nodes_created_at ON user_nodes(created_at);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_valid ON referrals(is_valid) WHERE is_valid = TRUE;
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_type ON withdrawals(type);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);

CREATE INDEX IF NOT EXISTS idx_transaction_verifications_hash ON transaction_verifications(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_transaction_verifications_status ON transaction_verifications(verification_status);

-- Trigger functions for automatic timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_nodes table
DROP TRIGGER IF EXISTS update_user_nodes_updated_at ON user_nodes;
CREATE TRIGGER update_user_nodes_updated_at
    BEFORE UPDATE ON user_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for referrals table
DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for withdrawals table
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON withdrawals;
CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for mining_nodes table
DROP TRIGGER IF EXISTS update_mining_nodes_updated_at ON mining_nodes;
CREATE TRIGGER update_mining_nodes_updated_at
    BEFORE UPDATE ON mining_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update mining progress
CREATE OR REPLACE FUNCTION update_mining_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update progress when user_node is updated
    IF NEW.status = 'running' AND NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
        NEW.progress = LEAST(100.0, 
            GREATEST(0.0, 
                EXTRACT(EPOCH FROM (NOW() - NEW.start_date)) / 
                EXTRACT(EPOCH FROM (NEW.end_date - NEW.start_date)) * 100
            )
        );
        
        -- Calculate total mined based on progress
        NEW.total_mined = (NEW.progress / 100.0) * NEW.mining_amount;
        
        -- Mark as completed if progress reaches 100%
        IF NEW.progress >= 100.0 THEN
            NEW.status = 'completed';
            NEW.progress = 100.0;
            NEW.total_mined = NEW.mining_amount;
        END IF;
        
        NEW.last_mining_update = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic mining progress updates
DROP TRIGGER IF EXISTS auto_update_mining_progress ON user_nodes;
CREATE TRIGGER auto_update_mining_progress
    BEFORE UPDATE ON user_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_mining_progress();

-- Function to update user balances when referrals are activated
CREATE OR REPLACE FUNCTION process_referral_reward()
RETURNS TRIGGER AS $$
BEGIN
    -- When a referral becomes valid, update referrer's balance
    IF NEW.is_valid = TRUE AND OLD.is_valid = FALSE THEN
        -- Update referrer's balance and counts
        UPDATE users 
        SET 
            referral_balance = referral_balance + NEW.reward_amount,
            valid_referrals = valid_referrals + 1,
            updated_at = NOW()
        WHERE id = NEW.referrer_id;
        
        -- Mark reward as paid and set activation time
        NEW.reward_paid = TRUE;
        NEW.activated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic referral reward processing
DROP TRIGGER IF EXISTS auto_process_referral_reward ON referrals;
CREATE TRIGGER auto_process_referral_reward
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION process_referral_reward();

-- Function to validate transaction hash uniqueness across the system
CREATE OR REPLACE FUNCTION validate_transaction_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if transaction hash already exists in user_nodes
    IF EXISTS (SELECT 1 FROM user_nodes WHERE transaction_hash = NEW.transaction_hash AND id != NEW.id) THEN
        RAISE EXCEPTION 'Transaction hash already used: %', NEW.transaction_hash;
    END IF;
    
    -- Check if transaction hash already exists in withdrawals
    IF NEW.transaction_hash IS NOT NULL AND EXISTS (SELECT 1 FROM withdrawals WHERE transaction_hash = NEW.transaction_hash) THEN
        RAISE EXCEPTION 'Transaction hash already used in withdrawals: %', NEW.transaction_hash;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for transaction hash uniqueness validation
DROP TRIGGER IF EXISTS validate_unique_transaction_hash ON user_nodes;
CREATE TRIGGER validate_unique_transaction_hash
    BEFORE INSERT OR UPDATE ON user_nodes
    FOR EACH ROW
    EXECUTE FUNCTION validate_transaction_uniqueness();

-- Insert default mining nodes
INSERT INTO mining_nodes (id, name, price, storage, mining_amount, duration_days, description) VALUES
('node1', '64 GB Node', 50, '64 GB', 500, 30, 'Mine 500 TRX in 30 days'),
('node2', '128 GB Node', 75, '128 GB', 500, 15, 'Mine 500 TRX in 15 days'),
('node3', '256 GB Node', 100, '256 GB', 1000, 7, 'Mine 1000 TRX in 7 days'),
('node4', '1024 GB Node', 250, '1024 GB', 1000, 3, 'Mine 1000 TRX in 3 days')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    storage = EXCLUDED.storage,
    mining_amount = EXCLUDED.mining_amount,
    duration_days = EXCLUDED.duration_days,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Create a view for easy mining statistics
CREATE OR REPLACE VIEW mining_statistics AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(un.id) as total_nodes,
    COUNT(CASE WHEN un.status = 'running' THEN 1 END) as active_nodes,
    COUNT(CASE WHEN un.status = 'completed' THEN 1 END) as completed_nodes,
    COALESCE(SUM(CASE WHEN un.status = 'completed' THEN un.mining_amount ELSE 0 END), 0) as total_mined,
    COALESCE(SUM(CASE WHEN un.status = 'running' THEN un.total_mined ELSE 0 END), 0) as current_mining_total,
    u.mine_balance,
    u.referral_balance,
    u.valid_referrals
FROM users u
LEFT JOIN user_nodes un ON u.id = un.user_id
GROUP BY u.id, u.username, u.mine_balance, u.referral_balance, u.valid_referrals;