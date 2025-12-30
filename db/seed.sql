-- Seed data for Tandem demo

-- Clear existing data
DELETE FROM deal_spaces;
DELETE FROM emails;
DELETE FROM spaces;
DELETE FROM deals;

-- Insert deal (Acme AI)
INSERT INTO deals (seeker_name, seeker_email, company_name, team_size, monthly_budget, requirements, stage)
VALUES (
  'Sarah Chen',
  'sarah@acme-ai.com',
  'Acme AI',
  8,
  5000,
  '{"dogFriendly": true, "parking": false, "afterHours": false, "location": "San Francisco"}'::jsonb,
  'touring'
);

-- Insert spaces
INSERT INTO spaces (name, address, neighborhood, host_company, host_email, host_context, amenities, availability, monthly_rate)
VALUES
  (
    'FiDi Office',
    '123 Market St, San Francisco, CA 94105',
    'Financial District',
    'TechCorp',
    'leasing@techcorp.com',
    'Established fintech company, professional environment',
    '{"parking": true, "dogFriendly": false, "afterHours": true}'::jsonb,
    '{"tuesday": ["2pm", "4pm"], "wednesday": ["10am", "11am", "2pm"]}'::jsonb,
    4800
  ),
  (
    'SOMA Creative Space',
    '456 Folsom St, San Francisco, CA 94107',
    'SOMA',
    'DesignStudio',
    'hello@designstudio.com',
    'Creative agency, collaborative atmosphere',
    '{"parking": false, "dogFriendly": true, "afterHours": true}'::jsonb,
    '{"wednesday": ["9am", "11am", "3pm"], "thursday": ["10am", "2pm"]}'::jsonb,
    5200
  ),
  (
    'Mission District Hub',
    '789 Valencia St, San Francisco, CA 94110',
    'Mission',
    'CloudScale',
    'spaces@cloudscale.io',
    'YC W21 AI infrastructure startup, similar stage to Acme AI',
    '{"parking": false, "dogFriendly": true, "afterHours": true}'::jsonb,
    '{"tuesday": ["3pm", "4pm"], "wednesday": ["10am", "1pm"]}'::jsonb,
    4900
  );

-- Link spaces to deal
INSERT INTO deal_spaces (deal_id, space_id, status)
SELECT 1, id, 'shown' FROM spaces;

-- Insert email thread
INSERT INTO emails (deal_id, "from", "to", subject, body, sent_at, ai_generated)
VALUES
  (
    1,
    'agent@tandem.space',
    'sarah@acme-ai.com',
    'Office Spaces for Acme AI - 3 Great Options',
    'Hi Sarah,

Great speaking with you yesterday! Based on your requirements (8-person team, $5k/month budget, dog-friendly), I''ve identified 3 excellent spaces in SF:

1. **FiDi Office** - 123 Market St
   - $4,800/month, parking available
   - Professional fintech environment

2. **SOMA Creative Space** - 456 Folsom St
   - $5,200/month, dog-friendly, creative vibe
   - After-hours access included

3. **Mission District Hub** - 789 Valencia St
   - $4,900/month, dog-friendly
   - Hosted by CloudScale (YC W21, AI startup like you!)

Would you like to schedule tours? I''m happy to coordinate with all three hosts.

Best,
Alex
Tandem',
    '2025-01-02 10:00:00',
    false
  ),
  (
    1,
    'sarah@acme-ai.com',
    'agent@tandem.space',
    'Re: Office Spaces for Acme AI - 3 Great Options',
    'Hi Alex,

These all look great! I''d love to tour all three spaces.

I''m available Tuesday afternoon or Wednesday morning. Our CEO can only join Tuesday 2-4pm or Wednesday 11am-12pm, and we really want him to see the spaces.

Quick questions:
- Does the FiDi office have parking? (We might need it for client visits)
- Can we access the SOMA space after hours? (Our team works late sometimes)
- What''s the story with CloudScale? Would be great to connect with a similar-stage company.

Can you help coordinate tours that work with our CEO''s schedule?

Thanks!
Sarah',
    '2025-01-02 14:30:00',
    false
  );
