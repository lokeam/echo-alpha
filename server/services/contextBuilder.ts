import { Deal, Space, Email } from '../../db/schema';

export interface EmailContext {
  deal: Deal;
  spaces: Space[];
  emailThread: Email[];
  inboundEmail: Email;
}

export interface StructuredContext {
  dealInfo: {
    seekerName: string;
    companyName: string;
    teamSize: number;
    monthlyBudget: number;
    requirements: {
      dogFriendly?: boolean;
      parking?: boolean;
      afterHours?: boolean;
      location?: string;
    };
  };
  spaces: Array<{
    id: number;
    name: string;
    address: string;
    neighborhood: string | null;
    hostCompany: string;
    hostContext: string | null;
    amenities: {
      parking?: boolean;
      dogFriendly?: boolean;
      afterHours?: boolean;
      [key: string]: boolean | undefined;
    };
    availability: {
      tuesday?: string[];
      wednesday?: string[];
      [key: string]: string[] | undefined;
    };
    monthlyRate: number;
    detailedAmenities?: any;
  }>;
  emailHistory: Array<{
    from: string;
    to: string;
    subject: string;
    body: string;
    sentAt: Date;
  }>;
  inboundEmail: {
    from: string;
    to: string;
    subject: string;
    body: string;
    sentAt: Date;
  };
}

/**
 * Extracts and structures context from database entities for AI processing
 */
export function buildStructuredContext(context: EmailContext): StructuredContext {
  return {
    dealInfo: {
      seekerName: context.deal.seekerName,
      companyName: context.deal.companyName,
      teamSize: context.deal.teamSize,
      monthlyBudget: context.deal.monthlyBudget,
      requirements: context.deal.requirements as {
        dogFriendly?: boolean;
        parking?: boolean;
        afterHours?: boolean;
        location?: string;
      },
    },
    spaces: context.spaces.map(space => ({
      id: space.id,
      name: space.name,
      address: space.address,
      neighborhood: space.neighborhood,
      hostCompany: space.hostCompany,
      hostContext: space.hostContext,
      amenities: space.amenities as {
        parking?: boolean;
        dogFriendly?: boolean;
        afterHours?: boolean;
        [key: string]: boolean | undefined;
      },
      availability: space.availability as {
        tuesday?: string[];
        wednesday?: string[];
        [key: string]: string[] | undefined;
      },
      monthlyRate: space.monthlyRate,
      detailedAmenities: space.detailedAmenities,
    })),
    emailHistory: context.emailThread.map(email => ({
      from: email.from,
      to: email.to,
      subject: email.subject,
      body: email.body,
      sentAt: email.sentAt,
    })),
    inboundEmail: {
      from: context.inboundEmail.from,
      to: context.inboundEmail.to,
      subject: context.inboundEmail.subject,
      body: context.inboundEmail.body,
      sentAt: context.inboundEmail.sentAt,
    },
  };
}

/**
 * Builds a comprehensive prompt for AI email generation
 */
export function buildEmailPrompt(structuredContext: StructuredContext): string {
  const { dealInfo, spaces, inboundEmail } = structuredContext;

  return `You are Alex, a professional real estate agent at AI Email Assistant helping ${dealInfo.seekerName} from ${dealInfo.companyName} find office space.

DEAL CONTEXT:
- Company: ${dealInfo.companyName}
- Team size: ${dealInfo.teamSize} people
- Budget: $${dealInfo.monthlyBudget}/month
- Requirements: ${JSON.stringify(dealInfo.requirements, null, 2)}

AVAILABLE SPACES:
${spaces.map((space, i) => `
${i + 1}. ${space.name}
   - Address: ${space.address}
   - Host: ${space.hostCompany}${space.hostContext ? `\n   - Context: ${space.hostContext}` : ''}
   - Rate: $${space.monthlyRate}/month
   - Amenities: ${JSON.stringify(space.amenities, null, 2)}
   - Availability: ${JSON.stringify(space.availability, null, 2)}
`).join('\n')}

INBOUND EMAIL TO RESPOND TO:
From: ${inboundEmail.from}
Subject: ${inboundEmail.subject}

${inboundEmail.body}

TASK:
Write a professional, helpful email response that:
1. Addresses ALL questions asked in the inbound email with clear, direct answers
2. Uses specific data from the spaces (amenities, availability, host context)
3. When a question asks "does X have Y?", answer YES or NO clearly if the data shows it
4. Use the hostContext field to provide background on companies when asked
5. Proposes a concrete tour schedule based on the availability windows mentioned
6. Maintains a friendly, professional, enthusiastic tone
7. Signs off as "Alex" from AI Email Assistant

IMPORTANT CONSTRAINTS:
- Answer questions directly and positively when the answer is YES
- Only reference amenities/features that are explicitly listed in the space data
- Use actual availability windows from the data
- If proposing tours, consider travel time between locations (spaces in same neighborhood are ~15 min apart)
- Be specific with times and addresses
- When asked about a host company, use the hostContext field to provide relevant details

EXAMPLE GOOD RESPONSES:
- Question: "Does FiDi have parking?" → "Yes! The FiDi office has parking available."
- Question: "What's the story with CloudScale?" → Use the hostContext field to explain

Respond with ONLY the email body (no subject line, no metadata). Start with a greeting and end with a signature.`;
}
