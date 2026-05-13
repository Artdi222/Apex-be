CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES vehicle_models(id) ON DELETE CASCADE,
    internal_id VARCHAR(50) NOT NULL, -- e.g. MX5-001
    vin VARCHAR(100) UNIQUE,
    status vehicle_status NOT NULL DEFAULT 'available',
    condition VARCHAR(50) NOT NULL DEFAULT 'excellent',
    mileage INT NOT NULL DEFAULT 0,
    last_service_mileage INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_model ON vehicles(model_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
