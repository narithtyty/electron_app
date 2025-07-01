-- Transactions Table Schema for Supabase
-- Execute this in your Supabase SQL Editor

-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category VARCHAR(100),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create an index on user_id for better performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- Create an index on date for better performance
CREATE INDEX idx_transactions_date ON transactions(date);

-- Create an index on type for filtering
CREATE INDEX idx_transactions_type ON transactions(type);

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own transactions
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own transactions
CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own transactions
CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Insert some sample data (optional)
INSERT INTO transactions (user_id, title, description, amount, type, category, date) VALUES
  (auth.uid(), 'Salary Payment', 'Monthly salary from company', 5000.00, 'income', 'salary', CURRENT_DATE),
  (auth.uid(), 'Grocery Shopping', 'Weekly groceries at supermarket', -150.75, 'expense', 'food', CURRENT_DATE - INTERVAL '1 day'),
  (auth.uid(), 'Freelance Project', 'Web development project payment', 1200.00, 'income', 'freelance', CURRENT_DATE - INTERVAL '2 days'),
  (auth.uid(), 'Electricity Bill', 'Monthly electricity payment', -89.50, 'expense', 'utilities', CURRENT_DATE - INTERVAL '3 days'),
  (auth.uid(), 'Coffee Shop', 'Morning coffee and pastry', -12.50, 'expense', 'food', CURRENT_DATE - INTERVAL '1 day');

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
