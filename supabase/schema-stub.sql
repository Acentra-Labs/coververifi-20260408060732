-- ============================================================
-- CoverVerifi Database Schema
-- Supabase (PostgreSQL) with Row Level Security
-- 13 tables matching the mock data model
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Consultants (multi-tenant root)
CREATE TABLE consultants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'consultant' CHECK (role = 'consultant'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consultants can read own data" ON consultants
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Consultants can update own data" ON consultants
  FOR UPDATE USING (auth.uid() = id);

-- 2. GC Clients
CREATE TABLE gc_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultant_id UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  active_jobs INTEGER DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'gc' CHECK (role = 'gc'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gc_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consultants can manage their GC clients" ON gc_clients
  FOR ALL USING (consultant_id = auth.uid());
CREATE POLICY "GCs can read own data" ON gc_clients
  FOR SELECT USING (id = auth.uid());

-- 3. Insurance Agents
CREATE TABLE insurance_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  agency_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE insurance_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read agents" ON insurance_agents
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Consultants can manage agents" ON insurance_agents
  FOR ALL USING (auth.role() = 'authenticated');

-- 4. Subcontractors
CREATE TABLE subcontractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  tax_classification TEXT NOT NULL CHECK (tax_classification IN (
    'sole_proprietor', 'c_corp', 's_corp', 'partnership',
    'llc_c', 'llc_s', 'llc_p', 'trust_estate', 'other'
  )),
  ein TEXT,
  business_name_dba TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'under_verification', 'compliant', 'expiring', 'lapsed'
  )),
  agent_id UUID REFERENCES insurance_agents(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
-- Subs visible to their GCs and the consultant managing those GCs
CREATE POLICY "Subs visible via GC relationship" ON subcontractors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gc_subcontractors gs
      JOIN gc_clients gc ON gs.gc_id = gc.id
      WHERE gs.sub_id = subcontractors.id
      AND (gc.consultant_id = auth.uid() OR gc.id = auth.uid())
    )
  );

-- 5. GC-Subcontractor junction table (many-to-many)
CREATE TABLE gc_subcontractors (
  gc_id UUID NOT NULL REFERENCES gc_clients(id) ON DELETE CASCADE,
  sub_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (gc_id, sub_id)
);

ALTER TABLE gc_subcontractors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GC-Sub links visible to related users" ON gc_subcontractors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gc_clients gc
      WHERE gc.id = gc_subcontractors.gc_id
      AND (gc.consultant_id = auth.uid() OR gc.id = auth.uid())
    )
  );

-- 6. Insurance Policies
CREATE TABLE insurance_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES insurance_agents(id),
  type TEXT NOT NULL CHECK (type IN ('gl', 'wc')),
  policy_number TEXT NOT NULL,
  carrier TEXT NOT NULL,
  effective_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  limit_per_occurrence INTEGER,
  limit_aggregate INTEGER,
  additional_insured BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Policies visible via sub relationship" ON insurance_policies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subcontractors s
      JOIN gc_subcontractors gs ON gs.sub_id = s.id
      JOIN gc_clients gc ON gs.gc_id = gc.id
      WHERE s.id = insurance_policies.sub_id
      AND (gc.consultant_id = auth.uid() OR gc.id = auth.uid())
    )
  );

-- 7. Certificates (ACORD uploads)
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES insurance_policies(id),
  file_name TEXT NOT NULL,
  file_path TEXT, -- Supabase Storage path
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by TEXT, -- agent ID or user ID
  certificate_holder TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Certs visible via sub relationship" ON certificates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subcontractors s
      JOIN gc_subcontractors gs ON gs.sub_id = s.id
      JOIN gc_clients gc ON gs.gc_id = gc.id
      WHERE s.id = certificates.sub_id
      AND (gc.consultant_id = auth.uid() OR gc.id = auth.uid())
    )
  );

-- 8. W-9 Records
CREATE TABLE w9_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  business_name TEXT,
  tax_classification TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  ein TEXT, -- encrypted at rest
  ssn TEXT, -- encrypted at rest, stored only last 4 in practice
  exempt_payee_code TEXT,
  fatca_code TEXT,
  signature_date DATE,
  file_name TEXT,
  file_path TEXT, -- Supabase Storage path
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE w9_records ENABLE ROW LEVEL SECURITY;
-- W-9s contain PII — consultant access only
CREATE POLICY "W9 visible to consultants only" ON w9_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subcontractors s
      JOIN gc_subcontractors gs ON gs.sub_id = s.id
      JOIN gc_clients gc ON gs.gc_id = gc.id
      WHERE s.id = w9_records.sub_id
      AND gc.consultant_id = auth.uid()
    )
  );

-- 9. Email Logs
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_id UUID NOT NULL REFERENCES subcontractors(id),
  agent_id UUID REFERENCES insurance_agents(id),
  gc_id UUID REFERENCES gc_clients(id),
  type TEXT NOT NULL CHECK (type IN (
    'new_sub_onboarding', 'verification_request',
    'expiration_warning', 'lapsed_notification'
  )),
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  opened_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  token TEXT UNIQUE -- tokenized link for agent response
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Email logs visible to consultants" ON email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gc_clients gc
      WHERE gc.id = email_logs.gc_id
      AND (gc.consultant_id = auth.uid() OR gc.id = auth.uid())
    )
  );

-- 10. Verification History (audit trail)
CREATE TABLE verification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_id UUID NOT NULL REFERENCES subcontractors(id),
  gc_id UUID REFERENCES gc_clients(id),
  verified_by TEXT NOT NULL, -- agent ID, consultant ID, or 'system'
  method TEXT NOT NULL CHECK (method IN (
    'agent_confirmation', 'certificate_upload', 'manual_check', 'system_auto'
  )),
  result TEXT NOT NULL CHECK (result IN (
    'confirmed_active', 'lapsed', 'partial', 'not_agent'
  )),
  notes TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE verification_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verifications visible to related users" ON verification_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gc_clients gc
      WHERE gc.id = verification_history.gc_id
      AND (gc.consultant_id = auth.uid() OR gc.id = auth.uid())
    )
  );

-- 11. Compliance Rules
CREATE TABLE compliance_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state TEXT NOT NULL DEFAULT 'ID',
  rule_type TEXT NOT NULL,
  description TEXT NOT NULL,
  min_coverage INTEGER DEFAULT 0,
  applies_to TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rules readable by all authenticated" ON compliance_rules
  FOR SELECT USING (auth.role() = 'authenticated');

-- 12. Notifications (in-app)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- consultant or GC ID
  type TEXT NOT NULL CHECK (type IN ('lapsed', 'expiring', 'verification', 'new_sub', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sub_id UUID REFERENCES subcontractors(id),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- 13. Agent Verification Tokens
CREATE TABLE agent_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  email_log_id UUID REFERENCES email_logs(id),
  sub_id UUID NOT NULL REFERENCES subcontractors(id),
  agent_id UUID NOT NULL REFERENCES insurance_agents(id),
  gc_id UUID NOT NULL REFERENCES gc_clients(id),
  policy_type TEXT NOT NULL CHECK (policy_type IN ('gl', 'wc')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  response TEXT, -- 'confirmed_active', 'lapsed', 'not_agent'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS — tokens are accessed publicly via unique token value
-- Application logic validates token expiry

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX idx_gc_clients_consultant ON gc_clients(consultant_id);
CREATE INDEX idx_gc_subs_gc ON gc_subcontractors(gc_id);
CREATE INDEX idx_gc_subs_sub ON gc_subcontractors(sub_id);
CREATE INDEX idx_policies_sub ON insurance_policies(sub_id);
CREATE INDEX idx_policies_expiration ON insurance_policies(expiration_date);
CREATE INDEX idx_certs_sub ON certificates(sub_id);
CREATE INDEX idx_w9_sub ON w9_records(sub_id);
CREATE INDEX idx_email_logs_sub ON email_logs(sub_id);
CREATE INDEX idx_verifications_sub ON verification_history(sub_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_agent_tokens_token ON agent_tokens(token);

-- ============================================================
-- Updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON consultants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON gc_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON insurance_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subcontractors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON insurance_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON w9_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
