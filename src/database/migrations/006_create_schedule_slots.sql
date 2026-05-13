CREATE TABLE schedule_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_type slot_type NOT NULL DEFAULT 'open',
    max_capacity INT NOT NULL DEFAULT 6,
    current_bookings INT NOT NULL DEFAULT 0,
    status slot_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_time_range CHECK (end_time > start_time),
    CONSTRAINT chk_capacity CHECK (current_bookings <= max_capacity),
    CONSTRAINT uq_slot UNIQUE (date, start_time, end_time)
);

CREATE INDEX idx_slots_date ON schedule_slots(date);
CREATE INDEX idx_slots_available ON schedule_slots(date, status) WHERE status = 'available';
