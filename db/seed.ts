import { db } from './index';
import { deals, spaces, emails, dealSpaces, emailDrafts } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  await db.delete(dealSpaces);
  await db.delete(emailDrafts);
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
        dogFriendly: true,
        afterHours: true,
      },
      availability: {
        tuesday: ['2pm', '4pm'],
        wednesday: ['10am', '11am', '2pm'],
      },
      monthlyRate: 4800,
      detailedAmenities: {
        parking: {
          type: 'off-site',
          location: 'Park & Go Garage (1 block away)',
          costMonthly: 200,
          spotsAvailable: 4,
          provider: 'Park & Go Garage',
        },
        access: {
          system: 'Key card (Honeywell)',
          costPerCard: 25,
          process: 'Building management issues cards within 48 hours',
          hours: '24/7',
        },
        meetingRooms: {
          count: 2,
          sizes: [6, 10],
          bookingSystem: 'BuildingOS online calendar',
          maxHoursPerBooking: 4,
        },
        rentInclusions: {
          utilities: true,
          internet: '1 Gbps fiber',
          janitorial: 'Monday/Wednesday/Friday',
          hvac: true,
        },
      },
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
        dogFriendly: false,
        afterHours: true,
      },
      availability: {
        wednesday: ['9am', '11am', '3pm'],
        thursday: ['10am', '2pm'],
      },
      monthlyRate: 5200,
      detailedAmenities: {
        parking: {
          type: 'building-garage',
          costPerDay: 25,
          sharedSpots: true,
          spotsAvailable: 2,
          note: 'Can share spots among team members',
        },
        dogPolicy: {
          allowed: false,
          reason: 'Landlord policy (building-wide)',
          flexibility: 'None',
          alternative: 'Service animals only',
        },
        access: {
          afterHours: true,
          advanceNotice: '24 hours to security',
          securityContact: 'security@buildingmgmt.com',
        },
        meetingRooms: {
          count: 3,
          sizes: [4, 8, 12],
          bookingSystem: 'First-come-first-served',
        },
        rentInclusions: {
          utilities: true,
          internet: '500 Mbps',
          janitorial: 'Daily',
        },
      },
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
      detailedAmenities: {
        parking: {
          type: 'street-only',
          note: 'Metered street parking, $3/hour',
        },
        dogPolicy: {
          allowed: true,
          sizeLimit: 'No limit',
          deposit: 0,
          note: 'Very dog-friendly, multiple office dogs on-site',
        },
        access: {
          hours: '24/7',
          system: 'Smart lock with code',
          cost: 0,
        },
        meetingRooms: {
          count: 1,
          sizes: [8],
          bookingSystem: 'Shared Slack channel',
          note: 'Casual booking, very flexible',
        },
        rentInclusions: {
          utilities: true,
          internet: '1 Gbps fiber',
          janitorial: 'Twice weekly',
          kitchen: 'Shared kitchen with coffee/snacks',
        },
        hostStatus: 'pending',
        lastContact: '2 days ago',
      },
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
      from: 'sarah@acme-ai.com',
      to: 'agent@tandem.space',
      subject: 'Office Space for 8-Person Team',
      body: `Hi! We're looking for office space for our 8-person team. Budget is around $5,000/month.

Must-haves:
- Dog-friendly (we have 2 office dogs)
- Parking for at least 4 cars
- Access outside of 9-5 (team works late sometimes)
- Meeting room we can use for client calls
- Decent internet (we do a lot of video calls)

Would love to see what's available in SF (ideally SOMA/Mission).

Thanks!
Sarah`,
      sentAt: new Date('2025-01-01T09:00:00Z'),
      aiGenerated: false,
      aiMetadata: null,
    },
    {
      dealId: deal.id,
      from: 'agent@tandem.space',
      to: 'sarah@acme-ai.com',
      subject: 'Re: Office Space for 8-Person Team',
      body: `Hi Sarah,

Great to hear from you! I have a few spaces that might work. Let me do some digging on the specific amenities you mentioned and I'll get back to you with details.

Talk soon,
Alex`,
      sentAt: new Date('2025-01-01T10:30:00Z'),
      aiGenerated: false,
      aiMetadata: null,
    },
    {
      dealId: deal.id,
      from: 'agent@tandem.space',
      to: 'leasing@techcorp.com',
      subject: 'Quick Questions: 123 Market St Space',
      body: `Hi,

I have a potential tenant interested in your FiDi space. Quick questions:
- Is the space dog-friendly?
- What's the parking situation?
- Can tenants access after hours?
- What meeting rooms are available?
- What's the internet speed?

Thanks!`,
      sentAt: new Date('2025-01-01T11:00:00Z'),
      aiGenerated: false,
      aiMetadata: null,
    },
    {
      dealId: deal.id,
      from: 'agent@tandem.space',
      to: 'hello@designstudio.com',
      subject: 'Quick Questions: 456 Folsom St Space',
      body: `Hi there,

I have a client looking at your SOMA space. Could you let me know:
- Dog-friendly?
- Parking options?
- After-hours access?
- Meeting room availability?
- Internet setup?

Appreciate it!`,
      sentAt: new Date('2025-01-01T11:05:00Z'),
      aiGenerated: false,
      aiMetadata: null,
    },
    {
      dealId: deal.id,
      from: 'agent@tandem.space',
      to: 'spaces@cloudscale.io',
      subject: 'Inquiry: Mission District Space',
      body: `Hey CloudScale team,

I have an 8-person AI startup looking for space. Your Mission location could be perfect. Can you share details on:
- Dog policy?
- Parking?
- Access hours?
- Meeting rooms?
- Internet?

Thanks!`,
      sentAt: new Date('2025-01-01T11:10:00Z'),
      aiGenerated: false,
      aiMetadata: null,
    },
    {
      dealId: deal.id,
      from: 'agent@tandem.space',
      to: 'sarah@acme-ai.com',
      subject: 'Re: Office Space - Initial Options',
      body: `Hi Sarah,

Good news! I've identified 3 spaces that match your criteria:

1. **FiDi Office** - 123 Market St ($4,800/mo)
2. **SOMA Creative Space** - 456 Folsom St ($5,200/mo)
3. **Mission District Hub** - 789 Valencia St ($4,900/mo)

I'm gathering detailed info on amenities from the hosts. Will send full details once I hear back!

Best,
Alex`,
      sentAt: new Date('2025-01-02T14:00:00Z'),
      aiGenerated: false,
      aiMetadata: null,
    },
    {
      dealId: deal.id,
      from: 'sarah@acme-ai.com',
      to: 'agent@tandem.space',
      subject: 'Re: Office Space - Follow-up Questions',
      body: `Hi Alex,

Thanks for these! Before we schedule tours, I have some detailed questions:

**FiDi Office:**
- Parking garage - do we pay monthly or per use? Can we get 4 passes?
- 24/7 access - how does the key card distribution work for 8 people?
- Meeting rooms - what's the booking system? Any size limits?
- What's included in rent? (utilities, internet, janitorial)

**SOMA Space:**
- You mentioned it might not be dog-friendly - is that a hard no or negotiable for small dogs under 20lbs?
- What's the parking situation exactly? $25/day per person or can we share spots?
- After hours - do we need to give advance notice to security?

**Mission Space:**
- Any update on this one? Still waiting to hear back?

**Tours:**
Our CEO can ONLY do Tuesday 2-4pm or Wednesday 11am-12pm next week. Can we see all three spaces in one of those windows? Ideally in geographical order so we're not zigzagging across the city.

Thanks!
Sarah`,
      sentAt: new Date('2025-01-03T09:00:00Z'),
      aiGenerated: false,
      aiMetadata: null,
    },
    {
      dealId: deal.id,
      from: 'agent@tandem.space',
      to: 'leasing@techcorp.com',
      subject: 'Follow-up: FiDi Office Details + Tour Request',
      body: `Hi,

Client has follow-up questions about the FiDi space:
- Parking: How do monthly passes work? Can they get 4?
- Key cards: Process for issuing 8 cards?
- Meeting rooms: Booking system and size limits?
- What's included in the $4,800/month rent?

Also, can we schedule a tour for Tuesday 2-4pm or Wednesday 11am-12pm?

Thanks!`,
      sentAt: new Date('2025-01-03T09:15:00Z'),
      aiGenerated: false,
      aiMetadata: null,
    },
    {
      dealId: deal.id,
      from: 'agent@tandem.space',
      to: 'hello@designstudio.com',
      subject: 'Follow-up: SOMA Space Questions',
      body: `Hi,

Client asking:
- Any flexibility on dog policy for small dogs (under 20lbs)?
- Parking details - can multiple people share spots?
- After hours access - how much advance notice needed?

Also checking Tuesday 2-4pm or Wednesday 11am-12pm availability for tour.

Thanks!`,
      sentAt: new Date('2025-01-03T09:20:00Z'),
      aiGenerated: false,
      aiMetadata: null,
    },
  ];

  await db.insert(emails).values(emailData);
  console.log('✅ Created email thread (10 emails - realistic multi-party coordination)');

  console.log('🎉 Seed complete!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
