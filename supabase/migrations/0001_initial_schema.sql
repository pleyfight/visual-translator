-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE job_type AS ENUM ('translate', 'ocr', 'analyze');

-- Assets table: stores uploaded files and their metadata
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Jobs table: tracks translation and processing jobs
CREATE TABLE ai_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    job_type job_type NOT NULL,
    status job_status DEFAULT 'pending',
    config JSONB DEFAULT '{}', -- stores source/target language, options, etc.
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Results table: stores the output of completed jobs
CREATE TABLE ai_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES ai_jobs(id) ON DELETE CASCADE,
    result_type TEXT NOT NULL, -- 'translation', 'ocr_text', 'analysis', etc.
    result_data JSONB NOT NULL, -- the actual translation/OCR output
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_jobs_updated_at BEFORE UPDATE ON ai_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_results ENABLE ROW LEVEL SECURITY;

-- Assets policies: users can only access their own assets
CREATE POLICY "Users can view their own assets" ON assets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets" ON assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assets" ON assets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets" ON assets
    FOR DELETE USING (auth.uid() = user_id);

-- AI Jobs policies: users can only access jobs for their assets
CREATE POLICY "Users can view their own jobs" ON ai_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert jobs for their assets" ON ai_jobs
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        EXISTS (SELECT 1 FROM assets WHERE id = ai_jobs.asset_id AND user_id = auth.uid())
    );

CREATE POLICY "Users can update their own jobs" ON ai_jobs
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can update any job (for worker processes)
CREATE POLICY "Service role can update any job" ON ai_jobs
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

-- AI Results policies: users can only access results for their jobs
CREATE POLICY "Users can view results for their jobs" ON ai_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_jobs 
            WHERE ai_jobs.id = ai_results.job_id 
            AND ai_jobs.user_id = auth.uid()
        )
    );

-- Service role can insert results (for worker processes)
CREATE POLICY "Service role can insert results" ON ai_results
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Indexes for performance
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_upload_date ON assets(upload_date);
CREATE INDEX idx_ai_jobs_user_id ON ai_jobs(user_id);
CREATE INDEX idx_ai_jobs_asset_id ON ai_jobs(asset_id);
CREATE INDEX idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX idx_ai_jobs_created_at ON ai_jobs(created_at);
CREATE INDEX idx_ai_results_job_id ON ai_results(job_id);

-- Create storage bucket for assets (this needs to be run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', false);

-- Storage policies for the assets bucket
-- CREATE POLICY "Users can upload their own files" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view their own files" ON storage.objects
--     FOR SELECT USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own files" ON storage.objects
--     FOR DELETE USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);
