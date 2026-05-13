-- Enums for Apex Circuit
CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
CREATE TYPE vehicle_class AS ENUM ('gt', 'touring', 'formula', 'drift', 'endurance');
CREATE TYPE vehicle_status AS ENUM ('available', 'in_use', 'maintenance', 'retired');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show');
CREATE TYPE equipment_category AS ENUM ('helmet', 'gloves', 'suit', 'shoes', 'hans_device', 'other');
CREATE TYPE equipment_condition AS ENUM ('new', 'good', 'fair', 'needs_replacement');
CREATE TYPE equipment_status AS ENUM ('available', 'unavailable', 'retired');
CREATE TYPE slot_type AS ENUM ('open', 'exclusive', 'maintenance');
CREATE TYPE slot_status AS ENUM ('available', 'full', 'blocked');
CREATE TYPE incident_type AS ENUM ('crash', 'mechanical', 'off_track', 'other');
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE incident_status AS ENUM ('open', 'investigating', 'resolved', 'closed');
