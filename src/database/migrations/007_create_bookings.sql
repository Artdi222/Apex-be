CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    schedule_slot_id UUID NOT NULL REFERENCES schedule_slots(id),
    status booking_status NOT NULL DEFAULT 'pending',
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    checked_in_at TIMESTAMPTZ,
    qr_code_token VARCHAR(64) UNIQUE NOT NULL,
    agreement_accepted BOOLEAN NOT NULL DEFAULT false,
    agreement_accepted_at TIMESTAMPTZ,
    participants_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_slot ON bookings(schedule_slot_id);
CREATE INDEX idx_bookings_status ON bookings(status);
