CREATE TABLE vehicle_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model_code VARCHAR(100), -- Internal factory code
    year INT NOT NULL,
    class vehicle_class NOT NULL,
    horsepower INT NOT NULL,
    transmission VARCHAR(50) NOT NULL,
    base_hourly_rate DECIMAL(10,2) NOT NULL,
    description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
