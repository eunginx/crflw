-- Add aesthetic_score column to document_processing_results if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'document_processing_results' 
        AND column_name = 'aesthetic_score'
    ) THEN
        ALTER TABLE document_processing_results 
        ADD COLUMN aesthetic_score INTEGER DEFAULT 75;
    END IF;
END $$;

-- Create resume_analysis table if it doesn't exist
CREATE TABLE IF NOT EXISTS resume_analysis (
    id SERIAL PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    contact_info JSONB DEFAULT '{}',
    sections_detected JSONB DEFAULT '[]',
    skills JSONB DEFAULT '{}',
    quality_score INTEGER DEFAULT 70,
    ats_score INTEGER DEFAULT 0,
    aesthetic_score INTEGER DEFAULT 0,
    recommendations JSONB DEFAULT '[]',
    strengths JSONB DEFAULT '[]',
    improvements JSONB DEFAULT '[]',
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(document_id)
);

-- Add ats_score column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resume_analysis' 
        AND column_name = 'ats_score'
    ) THEN
        ALTER TABLE resume_analysis 
        ADD COLUMN ats_score INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_resume_analysis_document_id 
ON resume_analysis(document_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_resume_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_resume_analysis_updated_at ON resume_analysis;
CREATE TRIGGER update_resume_analysis_updated_at
    BEFORE UPDATE ON resume_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_resume_analysis_updated_at();
