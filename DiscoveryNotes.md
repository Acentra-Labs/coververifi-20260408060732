# Discovery Brief: CoverVerifi

**Generated:** 2026-04-08_01-41

---

## App Overview
**App Name:** CoverVerifi
**Alternative Names:** CompliSub, SubShield, CertifyFlow
CoverVerifi is a multi-tenant SaaS platform that automates subcontractor insurance compliance verification for construction consultants and general contractors. It replaces the current manual process of phone calls, spreadsheets, and One Drive folders with automated email workflows, W-9 ingestion, and a centralized dashboard showing real-time insurance status for every subcontractor across every job.

## Target Users

**Primary — Insurance Compliance Consultants (like Dawn):**
- Manage multiple GC clients simultaneously
- Need full administrative control: onboarding subs, contacting agents, tracking compliance across all GCs
- Business model: charge GC clients for compliance management services

**Secondary — General Contractors (GCs):**
- Need a simple read-mostly portal to see their subs' insurance status at a glance
- Must verify insurance before issuing payments (draw requests with 15-20 subs)
- Want to add new subcontractors and trigger verification workflows
- Need mobile-responsive access from job sites

**Tertiary — Insurance Agents (no login required):**
- Interact via email only — receive tokenized links
- Can upload new certificates or confirm current policy status via simple yes/no links
- Can indicate they are no longer the agent for a sub

## Core Problem
General contractors in Idaho (and nationwide) are legally liable if their subcontractors lack proper workers' compensation or general liability insurance. Under Idaho Code §72-216, a GC becomes the statutory employer of an injured sub's worker if the sub doesn't carry workers' comp. Current compliance verification is entirely manual — consultants must call dozens of different insurance agencies for every draw, cross-reference expiration dates in spreadsheets, and manually chase down lapsed policies. Existing solutions (Procore, HCSS, Avetta, myCOI) are either too expensive, too complex, or bundled with functionality that small-to-mid-size contractors don't need. Dawn needs a focused, affordable tool that does one thing well.

## Platform Recommendation
**Web App (responsive for mobile)** — confirmed by client.
- GCs need mobile access from job sites but a native app is Phase 2
- Responsive web app covers both desktop (consultant workflow) and mobile (GC quick-checks)
- Reduces build complexity to meet 3-5 day prototype timeline
- PWA capabilities can be added later for app-like mobile experience [INFERRED]

## Recommended Tech Stack
**React + Vite + TailwindCSS (SPA)**

Reasoning:
- Dashboard-centric app behind authentication — no SEO benefits from SSR
- Vite provides fastest dev iteration speed for a 3-5 day prototype
- TailwindCSS enables rapid, consistent UI with modern aesthetic
- SPA architecture suits role-based dashboards (consultant admin vs. GC portal)
- Component libraries like shadcn/ui provide polished, accessible components out of the box [INFERRED]
- For the production backend (post-prototype): Supabase is the proven choice in this space — the VendorShield COI tracker uses Supabase with 7 tables and row-level security successfully

## Competitive Landscape

| Product | Pricing | Target Market | Key Differentiator | Weakness for Dawn's Use Case |
|---------|---------|---------------|-------------------|------------------------------|
| **BCS** | Free (≤25 vendors), $0.95/vendor/mo self-service, $17.80/vendor/yr full-service (min $10K) | Small-to-mid construction | Free tier + AI-powered RiskBot OCR extraction | Free tier is limited; full-service has $10K minimum |
| **myCOI** | ~$200-400/month tiered | Mid-market (100-500 employees, 25-100 vendors) | Straightforward vendor self-service portal | No fraud prevention; accepts vendor-submitted PDFs; no real-time monitoring |
| **TrustLayer** | Custom (~$1,000+/mo) | Mid-market to enterprise | Modern UX, 298K+ vendor network, no vendor login required | Opaque pricing; verification methodology unclear |
| **Avetta** | Custom enterprise pricing, annual fees | Large enterprises | Broad contractor risk management beyond insurance | Too expensive and complex for small GCs; confusing pricing; over-scoped |
| **Certificial** | Custom (free ≤5 vendors) | Mid-to-large enterprise | Smart COI with real-time policy monitoring, source verification | Enterprise-focused; may be overkill for small Idaho contractors |
| **Jones** | Custom enterprise | Large construction/RE | Procore integration, 24-hr verification SLA | Construction-only; no real-time monitoring; enterprise pricing |
| **Billy** | $100-300/month | Property management | Lease-integrated tracking | Vertical-specific to property management |

**CoverVerifi's Competitive Gap:**
- No competitor targets the **consultant-as-intermediary** model — they all assume the GC or enterprise manages directly
- Small GCs (5-50 subs) are underserved — BCS free tier caps at 25 vendors, others start at $200+/mo
- None offer the specific **Idaho workers' comp + IIC registration** workflow
- Agent interaction via simple tokenized email links (no login) is underutilized in the market
- W-9 ingestion paired with insurance tracking in a single lightweight tool is unique

## Key Requirements

### MUST HAVE (Prototype Scope)

**1. Multi-Tenant Consultant Admin Dashboard**
- Consultant creates account, manages multiple GC clients
- Overview showing all GCs, total subs, compliance status at a glance
- Ability to add/edit/remove GC clients
- Color-coded compliance indicators: compliant (green), expiring soon (yellow), lapsed/missing (red)
- [INFERRED] Multi-consultant support: each consultant sees only their own GC clients

**2. General Contractor Portal**
- Separate login for each GC
- Dashboard showing only their subcontractors with insurance status
- Columns: Sub name, GL expiration, WC expiration, policy numbers, agent name/email, compliance status
- GC can add a new subcontractor → triggers intake workflow
- GC cannot see other GCs' subcontractors (data isolation)
- Search/filter by sub name, compliance status, expiration date [INFERRED]

**3. W-9 Ingestion & Parsing**
- Upload W-9 PDF/image for each subcontractor
- Extract and auto-populate fields:
  - **Line 1:** Legal name (individual or entity)
  - **Line 2:** Business name / DBA (if different)
  - **Line 3:** Federal tax classification (individual/sole proprietor, C Corp, S Corp, Partnership, LLC, Trust/Estate, Other)
  - **Line 4:** Exemptions (exempt payee code, FATCA reporting code)
  - **Line 5:** Address (street, city, state, ZIP)
  - **Line 6:** Account numbers (optional)
  - **Part I:** Taxpayer Identification Number (SSN or EIN)
  - **Signature & Date**
- Highlight missing/unreadable fields for manual completion
- Store parsed W-9 data linked to subcontractor record
- Track W-9 annual renewal requirement [INFERRED]

**4. Subcontractor Management**
- Create subcontractor profiles with: company name, contact name, phone, email, W-9 data, insurance agent info
- Attach subcontractors to one or more GCs (many-to-many relationship)
- When a GC adds a sub that already exists in the system, auto-populate known data including agent info
- Track per-sub: Workers' Comp policy (number, expiration, carrier), General Liability policy (number, expiration, carrier, limit verification — minimum $1M GL standard), agent name, agent email, agent phone
- [INFERRED] Subcontractor status lifecycle: Pending → Under Verification → Compliant → Expiring → Lapsed

**5. Insurance Certificate Tracking**
- Store uploaded ACORD certificate PDFs linked to subcontractor
- Track key fields from ACORD 25 certificates:
  - Insured name, policy number, coverage type (GL/WC)
  - Effective and expiration dates
  - Coverage limits (GL: typically $1M per occurrence; WC: per Idaho statute ~$500K)
  - Additional insured status (checkbox per GC — some require, some don't)
  - Certificate holder information
- [INFERRED] Parse uploaded certificates to auto-populate fields (AI/OCR — can be simulated in prototype with manual entry)

**6. Automated Email Workflows**
- Configurable email templates per GC (with GC branding/info)
- Email types:
  - **New sub onboarding:** Request to agent for certificate of insurance
  - **Verification request:** Periodic email to agent asking to confirm policy is still active (before draw payments)
  - **Expiration warning:** 30-day advance notice to agent, sub, and GC/consultant
  - **Lapsed notification:** Alert when insurance has expired — sent to GC, consultant, and agent
- Emails sent from CoverVerifi domain (coververifi.com)
- Agent receives tokenized link — can: upload new certificate, confirm valid (yes/no), or indicate "no longer this sub's agent"
- [INFERRED] Email sending via AWS SES or SendGrid for deliverability

**7. Compliance Dashboard & Notifications**
- At-a-glance view of all subs' compliance status per GC
- Expiration timeline: which policies expire in 30/60/90 days
- In-app notifications to consultant and GC when insurance lapses or approaches expiration
- [INFERRED] Audit-ready export: generate a report of all subs, their insurance status, and verification history for annual audits

### NICE TO HAVE (Phase 2+)

- **Subcontract agreement tracking:** Annual agreement between GC and sub — upload, track, remind for renewal
- **Idaho IIC Workers' Comp registration verification** — check registration status with Idaho Industrial Commission
- **Ghost policy detection/flagging** [INFERRED]
- **Additional insured endorsement tracking** with configurable GC requirement
- **Payment draw integration:** Tie sub verification to specific draw requests
- **Mobile native app** for GCs
- **Consultant resale/white-label** capabilities
- **Bulk import** of existing sub data from spreadsheets [INFERRED]
- **API integrations** with Procore, HCSS, QuickBooks [INFERRED]

## UX Considerations

### Design Direction
- **Modern, cool, sleek** — client's explicit direction
- Color palette: suggest a cool-toned scheme (deep navy/charcoal primary, teal or electric blue accent, with green/yellow/red for compliance status) [INFERRED]
- Clean, minimal UI — the #1 complaint about competitors is complexity. CoverVerifi must be the "easy" option
- Logo needed for CoverVerifi — modern wordmark or icon+wordmark

### User Flows

**Consultant Onboarding Flow:**
1. Sign up → Create consultant account
2. Add first GC client (company name, contact, email)
3. Add subcontractors (manually or via W-9 upload)
4. Enter/upload insurance certificates
5. System sends verification emails to agents
6. Dashboard populates with compliance status

**GC Daily Flow:**
1. Login → See sub compliance dashboard
2. Before payment draw: filter/view subs on current job
3. Check all green → proceed with payment
4. See yellow/red → click to see details, trigger re-verification email
5. Add new sub → enters basic info → consultant is notified to complete onboarding

**Agent Email Flow (no login):**
1. Receive email with tokenized link
2. Click link → lands on simple single-purpose page
3. For verification: click "Yes, policy is active" or "No, policy has lapsed" or "I am no longer their agent"
4. For certificate request: upload PDF via drag-and-drop
5. Done — no account creation needed

### Key UX Patterns
- **F-pattern layout** for dashboards — most critical compliance metrics top-left
- **Progressive disclosure** — show summary status first, drill down to details on click
- **Color-coded status system** throughout (green/yellow/red) — construction industry understands traffic-light metaphors
- **Role-based navigation** — consultant sees multi-GC admin controls; GC sees simplified single-company view
- [INFERRED] **Empty state guidance** — first-time users see helpful prompts explaining each step
- [INFERRED] **Search-first interaction** for subs with many records

## Technical Considerations

### Data Model (Key Entities)
- **Consultants** (multi-tenant root) → has many GC Clients
- **GC Clients** → has many Subcontractors (via junction table)
- **Subcontractors** → shared across GCs, has W-9 data, has many Insurance Policies
- **Insurance Policies** → type (GL/WC), policy number, carrier, agent, effective/expiration dates, limits, additional insured flag
- **Insurance Agents** → name, email, phone, agency — linked to policies
- **Certificates** → uploaded ACORD PDFs, linked to policy, parsed data
- **Email Logs** → track all outbound emails, status, agent responses
- **Verification History** — audit trail of all compliance checks [INFERRED]

### Integrations
- **Email sending:** AWS SES or SendGrid (production) — need custom domain (coververifi.com) with SPF/DKIM/DMARC for deliverability
- **File storage:** S3 or Supabase Storage for W-9s and certificates
- **OCR/AI parsing:** For W-9 ingestion — can use GPT-4 Vision, Claude, or Tesseract+LLM pipeline
- **Authentication:** Supabase Auth or Auth0 — magic links for consultants/GCs, tokenized links for agents [INFERRED]

### Compliance & Security
- W-9s contain SSNs/EINs — **PII must be encrypted at rest and in transit** [INFERRED]
- Role-based access control: GCs cannot see other GCs' data; consultants see only their clients [INFERRED]
- Audit logging for all compliance verification actions (required for annual audits)
- [INFERRED] SOC 2 consideration for production launch given sensitive tax/insurance data

### Domain & Email Setup
- Purchase coververifi.com (or .io / .app as fallback)
- Configure DNS for email sending (SPF, DKIM, DMARC records)
- Warm up sending domain before production email volume [INFERRED]

## Open Questions

1. **Pricing model:** What will Dawn charge her GC clients? Per-sub? Per-month flat fee? This affects whether we need billing/subscription features. Competitors range from $0.95/vendor/mo (BCS) to $200-400/mo flat (myCOI).
2. **W-9 parsing accuracy expectations:** For the prototype, should we simulate OCR results with pre-populated data, or invest in actual AI parsing? Real OCR on W-9s is achievable but adds backend complexity.
3. **Certificate verification depth:** Is agent email confirmation sufficient, or does Dawn eventually want real-time policy status checks (like Certificial's Smart COI)? This significantly changes the architecture.
4. **Ghost policies:** Dawn mentioned these — what specifically should the app do when a ghost policy is detected? Flag it? Block the sub from being marked compliant?
5. **"Endorsement" detail:** Dawn mentioned something about endorsements that was missed in the meeting. Need clarification — likely refers to "Additional Insured" endorsement on GL policies, but may include Waiver of Subrogation or other specific endorsement types.
6. **Sole proprietor handling:** Idaho doesn't require sole proprietor subs to carry WC, but GCs are liable if they don't. Should the system flag sole proprietor subs differently and recommend GCs require coverage anyway?

---

Sources:
- [myCOI Reviews & Pricing - Capterra](https://www.capterra.com/p/234580/myCOI/)
- [TrustLayer Reviews & Pricing - G2](https://www.g2.com/products/trustlayer/reviews)
- [Avetta Insurance Verification](https://www.avetta.com/clients/solutions/business-risk/insurance-verification)
- [BCS Pricing & Plans](https://www.getbcs.com/pricing-and-plans)
- [7 Best COI Tracking Software Compared - Certificial](https://www.certificial.com/blog-post/we-compared-7-best-coi-tracking-software-in-depth-feedback-and-review)
- [COI Tracking Software 2026 Pricing Guide - Vertikal](https://www.vertikalrms.com/article/how-much-does-coi-tracking-software-cost-2026-pricing-guide/)
- [W-9 Form 2026 Draft - IRS](https://www.irs.gov/pub/irs-dft/fw9--dft.pdf)
- [Idaho Workers' Comp Requirements - OnPay](https://onpay.com/insights/workers-comp-requirements-by-state/idaho/)
- [Idaho Employer FAQs - Industrial Commission](https://iic.idaho.gov/employer-compliance-division/employer-information/employers-faqs/)
- [VendorShield COI Tracker Tech Stack - DEV Community](https://dev.to/crawde/i-built-a-coi-tracking-tool-for-construction-heres-the-tech-stack-47eh)
- [ACORD 25 & 27 Forms Guide - Vertikal](https://www.vertikalrms.com/article/acord-25-27-forms-complete-insurance-certificate-guide/)
- [COI Construction Software Platforms - Jones](https://getjones.com/blog/top-coi-construction-software-platforms-for-compliance-and-risk-management/)
- [Dashboard Design UX Patterns - Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
