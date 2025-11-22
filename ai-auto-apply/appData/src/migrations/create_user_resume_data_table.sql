-- Create table for user resume data (one record per user)
CREATE TABLE IF NOT EXISTS user_resume_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL UNIQUE, -- One record per user
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  extracted_text TEXT,
  text_file_path TEXT,
  screenshot_path TEXT,
  total_pages INTEGER DEFAULT 0,
  pdf_info JSONB,
  filename TEXT,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_resume_data_user_id ON user_resume_data(user_id);

-- Create index for document lookups
CREATE INDEX IF NOT EXISTS idx_user_resume_data_document_id ON user_resume_data(document_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_resume_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_resume_data_updated_at_trigger
  BEFORE UPDATE ON user_resume_data
  FOR EACH ROW EXECUTE FUNCTION update_user_resume_data_updated_at();
