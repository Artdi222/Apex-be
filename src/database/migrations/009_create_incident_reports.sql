CREATE TABLE incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    reported_by UUID NOT NULL REFERENCES users(id),
    type incident_type NOT NULL,
    severity incident_severity NOT NULL DEFAULT 'low',
    description TEXT NOT NULL,
    photos JSONB DEFAULT '[]'::jsonb,
    estimated_cost DECIMAL(10,2),
    status incident_status NOT NULL DEFAULT 'open',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_booking ON incident_reports(booking_id);
