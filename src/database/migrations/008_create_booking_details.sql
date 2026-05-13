-- Link multiple vehicles to a single booking
CREATE TABLE booking_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link multiple equipment to a single booking
CREATE TABLE booking_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES equipment(id),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_bv_booking ON booking_vehicles(booking_id);
CREATE INDEX idx_be_booking ON booking_equipment(booking_id);
