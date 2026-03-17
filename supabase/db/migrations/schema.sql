CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    name TEXT,
    avatar_url TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    delivery_instructions TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE user_role_enum AS ENUM ('buyer','partner','admin','moderator');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role user_role_enum DEFAULT 'buyer',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role)
);

CREATE TABLE public.user_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_type TEXT,
    document_url TEXT,
    status TEXT DEFAULT 'pending',
    rejected_reason TEXT,
    verified_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, document_type)
);

CREATE TABLE public.blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    blocked_until TIMESTAMPTZ,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE request_status AS ENUM (
'pending','accepted','picked_up','in_transit','delivered','cancelled','expired'
);

CREATE TYPE item_size_enum AS ENUM (
'small','medium','large','extra_large'
);

CREATE TYPE urgency_level AS ENUM (
'flexible','today','scheduled','urgent'
);

CREATE TABLE public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    item_description TEXT,
    brand TEXT,
    item_size item_size_enum DEFAULT 'small',
    weight DECIMAL(5,2),
    item_value DECIMAL(10,2),
    pickup_address TEXT,
    pickup_city TEXT,
    pickup_postal_code TEXT,
    pickup_location GEOGRAPHY(Point,4326),
    drop_address TEXT,
    drop_city TEXT,
    drop_postal_code TEXT,
    drop_location GEOGRAPHY(Point,4326),
    pickup_notes TEXT,
    drop_notes TEXT,
    is_phone_visible BOOLEAN DEFAULT false,
    estimated_price DECIMAL(10,2),
    reward DECIMAL(10,2),
    platform_fee DECIMAL(10,2),
    total_price DECIMAL(10,2),
    urgency urgency_level DEFAULT 'flexible',
    preferred_date DATE,
    status request_status DEFAULT 'pending',
    expires_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    accepted_by UUID REFERENCES users(id)
);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
ON requests FOR SELECT
USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create own requests"
ON requests FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update own requests"
ON requests FOR UPDATE
USING (auth.uid() = buyer_id);

CREATE INDEX idx_requests_pickup_geo
ON requests USING GIST (pickup_location);

CREATE TABLE public.request_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    image_url TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE delivery_status AS ENUM (
'assigned','arriving_pickup','picked_up','in_transit','delivered','completed','cancelled'
);

CREATE TABLE public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES users(id),
    escrow_id UUID,
    pickup_otp TEXT,
    drop_otp TEXT,
    purchase_proof_url TEXT,
    purchase_proof_uploaded_at TIMESTAMPTZ,
    status delivery_status DEFAULT 'assigned',
    accepted_at TIMESTAMPTZ,
    pickup_deadline TIMESTAMPTZ,
    delivery_deadline TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    buyer_rated BOOLEAN DEFAULT false,
    partner_rated BOOLEAN DEFAULT false
);

CREATE TABLE public.partner_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    location GEOGRAPHY(Point,4326),
    accuracy DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    is_online BOOLEAN DEFAULT false,
    max_detour_km DECIMAL(5,2) DEFAULT 5,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_partner_geo
ON partner_locations USING GIST (location);

CREATE TABLE public.delivery_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    location GEOGRAPHY(Point,4326),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE message_type_enum AS ENUM (
'text','image','system'
);

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    message_type message_type_enum DEFAULT 'text',
    message_text TEXT,
    media_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_delivery
ON messages(delivery_id);

CREATE TABLE public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID REFERENCES deliveries(id),
    from_user UUID REFERENCES users(id),
    to_user UUID REFERENCES users(id),
    rater_role TEXT,
    rating INTEGER CHECK (rating >=1 AND rating <=5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(delivery_id, from_user)
);

CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE transaction_type AS ENUM (
'deposit','withdrawal','payment','escrow_hold','escrow_release','refund','platform_fee','partner_payout'
);

CREATE TYPE transaction_status AS ENUM (
'pending','completed','failed','refunded'
);

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id),
    delivery_id UUID REFERENCES deliveries(id),
    type transaction_type,
    amount DECIMAL(12,2),
    status transaction_status DEFAULT 'pending',
    reference_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TYPE escrow_status_enum AS ENUM (
'held','released','refunded','disputed'
);

CREATE TABLE public.escrow_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID UNIQUE REFERENCES deliveries(id),
    sender_id UUID REFERENCES users(id),
    partner_id UUID REFERENCES users(id),
    amount DECIMAL(12,2),
    platform_fee DECIMAL(12,2),
    partner_payout DECIMAL(12,2),
    status escrow_status_enum DEFAULT 'held',
    held_at TIMESTAMPTZ DEFAULT now(),
    released_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ
);

CREATE TABLE public.trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id),
    score DECIMAL(3,2) DEFAULT 0.50,
    completed_deliveries INT DEFAULT 0,
    cancelled_deliveries INT DEFAULT 0,
    total_as_buyer INT DEFAULT 0,
    total_as_partner INT DEFAULT 0,
    avg_rating_as_buyer DECIMAL(2,1),
    avg_rating_as_partner DECIMAL(2,1),
    disputes INT DEFAULT 0,
    flags_received INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.request_assignment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES requests(id),
    partner_id UUID REFERENCES users(id),
    score DECIMAL(5,2),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.demand_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location GEOGRAPHY(Point,4326),
    item_name TEXT,
    request_time TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type TEXT,
    title TEXT,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
