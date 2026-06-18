-- Add sender_name, sender_email, and subject columns to messages table
-- These are needed for contact form submissions where sender info is not from a registered user

ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_email VARCHAR(320);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS subject VARCHAR(500);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_email ON messages(sender_email);
CREATE INDEX IF NOT EXISTS idx_messages_subject ON messages(subject);
