-- Update incident_type: add 'damage' and 'accident', remove 'crash' and 'off_track'
ALTER TYPE incident_type ADD VALUE IF NOT EXISTS 'damage';
ALTER TYPE incident_type ADD VALUE IF NOT EXISTS 'accident';

-- Update incident_status: add 'dismissed', remove 'closed'
ALTER TYPE incident_status ADD VALUE IF NOT EXISTS 'dismissed';
