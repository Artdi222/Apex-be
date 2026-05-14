CREATE TABLE incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    
    -- Admin fields 
    created_by UUID NOT NULL REFERENCES users(id), 
    type incident_type NOT NULL,
    severity incident_severity NOT NULL DEFAULT 'low',
    description TEXT NOT NULL, 
    official_photos JSONB DEFAULT '[]'::jsonb, 
    estimated_cost DECIMAL(10,2),
    status incident_status NOT NULL DEFAULT 'open',
    resolution_notes TEXT,
    
    -- User response fields 
    user_statement TEXT, 
    user_photos JSONB DEFAULT '[]'::jsonb, 
    user_responded_at TIMESTAMPTZ, 
    user_unable_to_respond BOOLEAN DEFAULT false, 
    
    -- Emergency/medical fields
    medical_response_required BOOLEAN DEFAULT false,
    medical_notes TEXT, 
    
    -- Insurance/legal fields
    insurance_notified BOOLEAN DEFAULT false,
    insurance_claim_number VARCHAR(100),
    police_report_filed BOOLEAN DEFAULT false,
    police_report_number VARCHAR(100),
    
    -- Witness information
    witnesses JSONB DEFAULT '[]'::jsonb,  
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_booking ON incident_reports(booking_id);
CREATE INDEX idx_incidents_status ON incident_reports(status);
CREATE INDEX idx_incidents_severity ON incident_reports(severity);

CREATE INDEX idx_incidents_pending_user_response 
ON incident_reports(booking_id) 
WHERE user_statement IS NULL 
  AND user_unable_to_respond = false 
  AND status != 'resolved';
