-- Add new columns to incident_reports table for safety-first approach

-- Rename existing columns to match new schema
ALTER TABLE incident_reports 
  RENAME COLUMN reported_by TO created_by;

ALTER TABLE incident_reports 
  RENAME COLUMN photos TO official_photos;

-- Add user response fields
ALTER TABLE incident_reports 
  ADD COLUMN IF NOT EXISTS user_statement TEXT,
  ADD COLUMN IF NOT EXISTS user_photos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS user_responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS user_unable_to_respond BOOLEAN DEFAULT false;

-- Add emergency/medical fields
ALTER TABLE incident_reports 
  ADD COLUMN IF NOT EXISTS medical_response_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS medical_notes TEXT;

-- Add insurance/legal fields
ALTER TABLE incident_reports 
  ADD COLUMN IF NOT EXISTS insurance_notified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurance_claim_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS police_report_filed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS police_report_number VARCHAR(100);

-- Add witness information
ALTER TABLE incident_reports 
  ADD COLUMN IF NOT EXISTS witnesses JSONB DEFAULT '[]'::jsonb;

-- Add new indexes
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incident_reports(severity);

-- Index for quick lookup of incidents needing user response
CREATE INDEX IF NOT EXISTS idx_incidents_pending_user_response 
ON incident_reports(booking_id) 
WHERE user_statement IS NULL 
  AND user_unable_to_respond = false 
  AND status != 'resolved';
