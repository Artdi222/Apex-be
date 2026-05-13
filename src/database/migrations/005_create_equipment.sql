CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category equipment_category NOT NULL,
    size VARCHAR(20),
    brand VARCHAR(100),
    condition equipment_condition NOT NULL DEFAULT 'new',
    rental_price DECIMAL(10,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    available_quantity INT NOT NULL DEFAULT 0,
    images JSONB DEFAULT '[]'::jsonb,
    status equipment_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_available CHECK (available_quantity <= stock_quantity)
);
