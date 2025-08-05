-- Expense Edit History Setup for Transactions Page
-- This script creates the table and triggers needed for expense edit history tracking

-- Create expense edit history table
CREATE TABLE IF NOT EXISTS expense_edit_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    edited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    previous_data JSONB NOT NULL,
    new_data JSONB NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance  
CREATE INDEX IF NOT EXISTS idx_expense_edit_history_expense_id 
    ON expense_edit_history(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_edit_history_edited_by 
    ON expense_edit_history(edited_by);
CREATE INDEX IF NOT EXISTS idx_expense_edit_history_edited_at 
    ON expense_edit_history(edited_at);

-- Enable Row Level Security
ALTER TABLE expense_edit_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view edit history for their own expenses
CREATE POLICY "Users can view edit history for their own expenses" ON expense_edit_history
    FOR SELECT USING (
        expense_id IN (
            SELECT id FROM expenses WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can create edit history for their own expenses
CREATE POLICY "Users can create edit history for their own expenses" ON expense_edit_history
    FOR INSERT WITH CHECK (
        edited_by = auth.uid() AND
        expense_id IN (
            SELECT id FROM expenses WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Admins can view edit history for expenses of users they created
CREATE POLICY "Admins can view edit history for their users' expenses" ON expense_edit_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        ) AND
        expense_id IN (
            SELECT e.id FROM expenses e
            INNER JOIN users u ON e.user_id = u.id
            WHERE u.created_by = auth.uid() OR e.user_id = auth.uid()
        )
    );

-- Add updated_at column to expenses table if it doesn't exist
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expense_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on expense updates
DROP TRIGGER IF EXISTS trigger_update_expense_updated_at ON expenses;
CREATE TRIGGER trigger_update_expense_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_expense_updated_at();

-- Grant necessary permissions
GRANT SELECT, INSERT ON expense_edit_history TO authenticated;

-- Optional: Create a function to get expense edit history with user details
CREATE OR REPLACE FUNCTION get_expense_edit_history(expense_uuid UUID)
RETURNS TABLE (
    id UUID,
    expense_id UUID,
    edited_by UUID,
    editor_username TEXT,
    editor_full_name TEXT,
    previous_data JSONB,
    new_data JSONB,
    edited_at TIMESTAMP WITH TIME ZONE,
    reason TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        eeh.id,
        eeh.expense_id,
        eeh.edited_by,
        u.username,
        u.username as editor_full_name, -- Using username as full_name since users table doesn't have full_name
        eeh.previous_data,
        eeh.new_data,
        eeh.edited_at,
        eeh.reason
    FROM expense_edit_history eeh
    INNER JOIN users u ON eeh.edited_by = u.id
    WHERE eeh.expense_id = expense_uuid
    ORDER BY eeh.edited_at DESC;
END;
$$;
