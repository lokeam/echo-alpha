import { db } from './index';
import { deals, spaces, emails, dealSpaces } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  await db.delete(dealSpaces);
  await db.delete(emails);
  await db.delete(spaces);
  await db.delete(deals);

  const [deal] = await db.insert(deals).values({
    seekerName: 'Sarah Chen',
    seekerEmail: 'sarah@acme-ai.com',
    companyName: 'Acme AI',
    teamSize: 8,
    monthlyBudget: 5000,
    requirements: {
      dogFriendly: true,
      parking: false,
      afterHours: false,
      location: 'San Francisco',
    },
    stage: 'touring',
  }).returning();

  console.log('✅ Created deal:', deal.companyName);

  const spaceData = [
    {
      name: 'FiDi Office',
      address: '123 Market St, San Francisco, CA 94105',
      neighborhood: 'Financial District',
      hostCompany: 'TechCorp',
      hostEmail: 'leasing@techcorp.com',
      hostContext: 'Established fintech company, professional environment',
      amenities: {
        parking: true,
        dogFriendly: false,
        afterHours: true,
      },
      availability: {
        tuesday: ['2pm', '4pm'],
        wednesday: ['10am', '11am', '2pm'],
      },
      monthlyRate: 4800,
    },
    {
      name: 'SOMA Creative Space',
      address: '456 Folsom St, San Francisco, CA 94107',
      neighborhood: 'SOMA',
      hostCompany: 'DesignStudio',
      hostEmail: 'hello@designstudio.com',
      hostContext: 'Creative agency, collaborative atmosphere',
      amenities: {
        parking: false,
        dogFriendly: true,
        afterHours: true,
      },
      availability: {
        wednesday: ['9am', '11am', '3pm'],
        thursday: ['10am', '2pm'],
      },
      monthlyRate: 5200,
    },
    {
      name: 'Mission District Hub',
      address: '789 Valencia St, San Francisco, CA 94110',
      neighborhood: 'Mission',
      hostCompany: 'CloudScale',
      hostEmail: 'spaces@cloudscale.io',
      hostContext: 'YC W21 AI infrastructure startup, similar stage to Acme AI',
      amenities: {
        parking: false,
        dogFriendly: true,
        afterHours: true,
      },
      availability: {
        tuesday: ['3pm', '4pm'],
        wednesday: ['10am', '1pm'],
      },
      monthlyRate: 4900,
    },
  ];

  const insertedSpaces = await db.insert(spaces).values(spaceData).returning();
  console.log('✅ Created spaces:', insertedSpaces.length);

  await db.insert(dealSpaces).values(
    insertedSpaces.map(space => ({
      dealId: deal.id,
      spaceId: space.id,
      status: 'shown',
    }))
  );

  const emailData = [
    {
      dealId: deal.id,
      from: 'agent@tandem.space',
      to: 'sarah@acme-ai.com',
      subject: 'Office Spaces for Acme AI - 3 Great Options',
      body: `Hi Sarah,

Great speaking with you yesterday! Based on your requirements (8-person team, $5k/month budget, dog-friendly), I've identified 3 excellent spaces in SF:

1. **FiDi Office** - 123 Market St
   - $4,800/month, parking available
   - Professional fintech environment

2. **SOMA Creative Space** - 456 Folsom St
   - $5,200/month, dog-friendly, creative vibe
   - After-hours access included

3. **Mission District Hub** - 789 Valencia St
   - $4,900/month, dog-friendly
   - Hosted by CloudScale (YC W21, AI startup like you!)

Would you like to schedule tours? I'm happy to coordinate with all three hosts.

Best,
Alex
Tandem`,
      sentAt: new Date('2025-01-02T10:00:00Z'),
      aiGenerated: false,
      aiMetadata: null,
    },
    {
      dealId: deal.id,
      from: 'sarah@acme-ai.com',
      to: 'agent@tandem.space',
      subject: 'Re: Office Spaces for Acme AI - 3 Great Options',
      body: `Hi Alex,

These all look great! I'd love to tour all three spaces.

I'm available Tuesday afternoon or Wednesday morning. Our CEO can only join Tuesday 2-4pm or Wednesday 11am-12pm, and we really want him to see the spaces.

Quick questions:
- Does the FiDi office have parking? (We might need it for client visits)
- Can we access the SOMA space after hours? (Our team works late sometimes)
- What's the story with CloudScale? Would be great to connect with a similar-stage company.

Can you help coordinate tours that work with our CEO's schedule?

Thanks!
Sarah`,
      sentAt: new Date('2025-01-02T14:30:00Z'),
      aiGenerated: false,
      aiMetadata: null,
    },
  ];

  await db.insert(emails).values(emailData);
  console.log('✅ Created email thread');

  console.log('🎉 Seed complete!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
