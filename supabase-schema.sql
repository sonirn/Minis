-- TRX Mining Platform Database Schema for Supabase

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mine_balance DECIMAL(18,8) DEFAULT 25.0,
    referral_balance DECIMAL(18,8) DEFAULT 0.0,
    total_referrals INTEGER DEFAULT 0,
    valid_referrals INTEGER DEFAULT 0,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    has_active_mining BOOLEAN DEFAULT FALSE,
    has_bought_node4 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    is_valid BOOLEAN DEFAULT FALSE,
    reward_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User nodes table
CREATE TABLE IF NOT EXISTS user_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    node_id VARCHAR(20) NOT NULL,
    transaction_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'running',
    progress DECIMAL(5,2) DEFAULT 0.0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    mining_amount DECIMAL(18,8) NOT NULL,
    daily_mining DECIMAL(18,8) NOT NULL,
    duration INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawals table (for tracking withdrawal history)
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'mine' or 'referral'
    amount DECIMAL(18,8) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_user_nodes_user_id ON user_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nodes_status ON user_nodes(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies - Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Basic policies (you can customize these based on your needs)
CREATE POLICY "Public read access on users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Public read access on referrals" ON referrals FOR SELECT USING (true);
CREATE POLICY "Users can create referrals" ON referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update referrals" ON referrals FOR UPDATE USING (true);

CREATE POLICY "Public read access on user_nodes" ON user_nodes FOR SELECT USING (true);
CREATE POLICY "Users can create user_nodes" ON user_nodes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update user_nodes" ON user_nodes FOR UPDATE USING (true);

CREATE POLICY "Public read access on withdrawals" ON withdrawals FOR SELECT USING (true);
CREATE POLICY "Users can create withdrawals" ON withdrawals FOR INSERT WITH CHECK (true);