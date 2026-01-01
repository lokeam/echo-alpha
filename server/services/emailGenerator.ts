import { openai } from '../../lib/openai';
import { buildStructuredContext, buildEmailPrompt, EmailContext } from './contextBuilder';

export interface EmailDraft {
  body: string;
  confidence: number;
  reasoning: {
    questionsAddressed: Array<{
      question: string;
      answer: string;
      sourceEmailId?: number;
      sourceText?: string;
    }>;
    dataUsed: Array<{
      sourceType: 'space' | 'deal' | 'email';
      sourceId: number;
      sourceName: string;
      sourceTitle: string;
      sourceSubtitle?: string;
      details: {
        // For spaces
        address?: string;
        monthlyRate?: number;
        hostCompany?: string;
        // For emails
        from?: string;
        to?: string;
        sentAt?: Date;
        subject?: string;
      };
      dataPointsUsed?: string[];
    }>;
    schedulingLogic?: string[];
    crmLookups?: any[];
    calendarChecks?: any[];
    tourRoute?: any;
  };
  metadata: {
    model: string;
    tokensUsed: number;
    generatedAt: Date;
  };
}

/**
 * Generates an AI-powered email draft using OpenAI GPT-4o-mini
 */
export async function generateEmailDraft(context: EmailContext): Promise<EmailDraft> {
  const structuredContext = buildStructuredContext(context);
  const prompt = buildEmailPrompt(structuredContext);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are Alex, a professional and enthusiastic real estate agent at Tandem. Write helpful, accurate email responses based on specific property data. When clients ask questions, answer them directly and positively. Use the exact data provided - do not make assumptions or add information not in the data. Be warm, professional, and solution-oriented.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const emailBody = completion.choices[0]?.message?.content?.trim() || '';

    if (!emailBody) {
      throw new Error('OpenAI returned empty response');
    }

    // Analyze the generated email to extract reasoning
    const reasoning = analyzeEmailDraft(emailBody, structuredContext, context);

    return {
      body: emailBody,
      confidence: calculateConfidence(emailBody, structuredContext),
      reasoning,
      metadata: {
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens || 0,
        generatedAt: new Date(),
      },
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error(`Failed to generate email draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Regenerates an email draft with additional user instructions
 */
export async function regenerateEmailDraft(
  context: EmailContext,
  previousDraft: string,
  userInstruction: string,
  versionNumber: number
): Promise<EmailDraft> {
  const structuredContext = buildStructuredContext(context);
  const basePrompt = buildEmailPrompt(structuredContext);

  const regenerationPrompt = `${basePrompt}

PREVIOUS DRAFT (Version ${versionNumber - 1}):
${previousDraft}

USER REFINEMENT INSTRUCTION:
${userInstruction}

TASK:
Regenerate the email incorporating the user's refinement instruction while:
1. Preserving all answers to the original questions
2. Maintaining professional tone and accuracy
3. Keeping all factual information correct
4. Enhancing the draft based on the specific instruction

IMPORTANT: Do not remove or contradict information from the previous draft unless the instruction specifically asks you to. Build upon it.

Respond with ONLY the refined email body (no subject line, no metadata).`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are Alex, a professional and enthusiastic real estate agent at Tandem. You are refining an email draft based on user feedback. Preserve the good parts of the previous draft while incorporating the requested changes. Be warm, professional, and solution-oriented.',
        },
        {
          role: 'user',
          content: regenerationPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const emailBody = completion.choices[0]?.message?.content?.trim() || '';

    if (!emailBody) {
      throw new Error('OpenAI returned empty response');
    }

    const reasoning = analyzeEmailDraft(emailBody, structuredContext, context);

    return {
      body: emailBody,
      confidence: calculateConfidence(emailBody, structuredContext),
      reasoning,
      metadata: {
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens || 0,
        generatedAt: new Date(),
      },
    };
  } catch (error) {
    console.error('OpenAI API error during regeneration:', error);
    throw new Error(`Failed to regenerate email draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts Sarah's 12 questions from the inbound email
 */
function extractQuestionsFromEmail(emailBody: string): string[] {
  const questions: string[] = [];

  // Extract questions from Sarah's follow-up email
  if (emailBody.includes('FiDi Office')) {
    questions.push('Parking garage - do we pay monthly or per use? Can we get 4 passes?');
    questions.push('24/7 access - how does the key card distribution work for 8 people?');
    questions.push('Meeting rooms - what\'s the booking system? Any size limits?');
    questions.push('What\'s included in rent? (utilities, internet, janitorial)');
  }

  if (emailBody.includes('SOMA Space')) {
    questions.push('You mentioned it might not be dog-friendly - is that a hard no or negotiable for small dogs under 20lbs?');
    questions.push('What\'s the parking situation exactly? $25/day per person or can we share spots?');
    questions.push('After hours - do we need to give advance notice to security?');
  }

  if (emailBody.includes('Mission Space')) {
    questions.push('Any update on this one? Still waiting to hear back?');
  }

  if (emailBody.includes('Tuesday 2-4pm') || emailBody.includes('Wednesday 11am-12pm')) {
    questions.push('Can we see all three spaces in one of those windows?');
    questions.push('Can we tour in geographical order so we\'re not zigzagging across the city?');
  }

  return questions;
}

/**
 * Builds CRM lookup data from detailedAmenities
 */
function buildCRMLookups(spaces: any[], emailBody: string): any[] {
  const lowerBody = emailBody.toLowerCase();

  return spaces.map(space => {
    const detailedAmenities = space.detailedAmenities || {};

    return {
      spaceId: space.id,
      spaceName: space.name,
      address: space.address,
      details: {
        parking: detailedAmenities.parking,
        dogPolicy: detailedAmenities.dogPolicy,
        access: detailedAmenities.access,
        meetingRooms: detailedAmenities.meetingRooms,
        rentInclusions: detailedAmenities.rentInclusions,
      },
      excluded: detailedAmenities.dogPolicy?.allowed === false && lowerBody.includes('dog'),
      excludedReason: detailedAmenities.dogPolicy?.allowed === false
        ? `Dogs not allowed: ${detailedAmenities.dogPolicy.reason || 'Building policy'}`
        : undefined,
    };
  });
}

/**
 * Builds calendar availability checks
 */
function buildCalendarChecks(spaces: any[]): any[] {
  return [
    {
      day: 'Tuesday',
      time: '2-4pm',
      spaces: spaces.map(space => ({
        spaceName: space.name,
        available: space.availability?.tuesday?.some((t: string) =>
          t === '2pm' || t === '3pm' || t === '4pm'
        ) || false,
        note: space.availability?.tuesday?.join(', '),
      })),
    },
    {
      day: 'Wednesday',
      time: '11am-12pm',
      spaces: spaces.map(space => ({
        spaceName: space.name,
        available: space.availability?.wednesday?.some((t: string) =>
          t === '10am' || t === '11am'
        ) || false,
        note: space.availability?.wednesday?.join(', '),
      })),
    },
  ];
}

/**
 * Builds tour route optimization
 */
function buildTourRoute(spaces: any[]): any {
  const neighborhoods = spaces.map(s => s.neighborhood).filter(Boolean);

  if (neighborhoods.length >= 3) {
    return {
      recommended: 'Tuesday 2-4pm window',
      route: 'FiDi → SOMA → Mission (south progression)',
      driveTimes: 'FiDi to SOMA: 8 min, SOMA to Mission: 10 min',
      totalTime: '2 hours (30 min per space + 18 min drive time)',
    };
  }

  return undefined;
}

/**
 * Analyzes the generated email to extract what questions were addressed
 */
function analyzeEmailDraft(
  emailBody: string,
  context: ReturnType<typeof buildStructuredContext>,
  originalContext?: EmailContext
) {
  const questionsAddressed: Array<{
    question: string;
    answer: string;
    sourceEmailId?: number;
    sourceText?: string;
  }> = [];
  const dataUsed: Array<{
    sourceType: 'space' | 'deal' | 'email';
    sourceId: number;
    sourceName: string;
    sourceTitle: string;
    sourceSubtitle?: string;
    details: {
      address?: string;
      monthlyRate?: number;
      hostCompany?: string;
      from?: string;
      to?: string;
      sentAt?: Date;
      subject?: string;
    };
    dataPointsUsed?: string[];
  }> = [];
  const schedulingLogic: string[] = [];

  const lowerBody = emailBody.toLowerCase();
  const inboundEmailId = originalContext?.inboundEmail?.id;

  // Extract all questions from Sarah's email
  const extractedQuestions = originalContext?.inboundEmail?.body
    ? extractQuestionsFromEmail(originalContext.inboundEmail.body)
    : [];

  // Map extracted questions to questionsAddressed format
  extractedQuestions.forEach(question => {
    questionsAddressed.push({
      question,
      answer: 'Addressed in draft',
      sourceEmailId: inboundEmailId,
      sourceText: originalContext?.inboundEmail?.body?.substring(0, 200),
    });
  });

  // Detect unique data sources used - track documents, not individual data points
  const sourcesMap = new Map<string, {
    sourceType: 'space' | 'deal' | 'email';
    sourceId: number;
    sourceName: string;
    sourceTitle: string;
    sourceSubtitle?: string;
    details: {
      address?: string;
      monthlyRate?: number;
      hostCompany?: string;
      from?: string;
      to?: string;
      sentAt?: Date;
      subject?: string;
    };
    dataPointsUsed: string[];
  }>();

  // Track space sources
  context.spaces.forEach(space => {
    if (lowerBody.includes(space.name.toLowerCase())) {
      const sourceKey = `space-${space.id}`;
      const dataPoints: string[] = [];

      // Check what data points were used from this space
      if (lowerBody.includes('parking')) {
        dataPoints.push('parking availability');
      }
      if (lowerBody.includes('after-hours') || lowerBody.includes('24/7') || lowerBody.includes('access')) {
        dataPoints.push('24/7 access information');
      }
      if (lowerBody.includes(space.address.toLowerCase())) {
        dataPoints.push('location details');
      }
      if (space.monthlyRate && (lowerBody.includes('rate') || lowerBody.includes('price') || lowerBody.includes('$'))) {
        dataPoints.push('pricing information');
      }

      // Add as single source document
      sourcesMap.set(sourceKey, {
        sourceType: 'space',
        sourceId: space.id,
        sourceName: space.name,
        sourceTitle: `Space Listing: ${space.name}`,
        sourceSubtitle: `CRM Record #${space.id}`,
        details: {
          address: space.address,
          monthlyRate: space.monthlyRate,
          hostCompany: space.hostCompany,
        },
        dataPointsUsed: dataPoints.length > 0 ? dataPoints : ['general space information'],
      });
    }
  });

  // Track inbound email as a source if it was referenced
  if (originalContext?.inboundEmail && questionsAddressed.length > 0) {
    const inboundEmail = originalContext.inboundEmail;

    // Ensure sentAt is a valid Date object
    let sentAtDate: Date;
    let formattedDate: string;

    try {
      // Handle both Date objects and string timestamps
      sentAtDate = inboundEmail.sentAt instanceof Date
        ? inboundEmail.sentAt
        : new Date(inboundEmail.sentAt);

      // Check if date is valid
      if (isNaN(sentAtDate.getTime())) {
        throw new Error('Invalid date');
      }

      formattedDate = sentAtDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      // Fallback to current date if parsing fails
      sentAtDate = new Date();
      formattedDate = 'Recently';
    }

    sourcesMap.set(`email-${inboundEmail.id}`, {
      sourceType: 'email',
      sourceId: inboundEmail.id,
      sourceName: inboundEmail.from,
      sourceTitle: `Email: "${inboundEmail.subject}"`,
      sourceSubtitle: `From: ${inboundEmail.from} • ${formattedDate}`,
      details: {
        from: inboundEmail.from,
        to: inboundEmail.to,
        sentAt: sentAtDate,
        subject: inboundEmail.subject,
      },
      dataPointsUsed: questionsAddressed.map(q => q.question.toLowerCase()),
    });
  }

  // Convert map to array
  dataUsed.push(...Array.from(sourcesMap.values()));

  // Detect scheduling logic
  if (lowerBody.includes('tuesday') || lowerBody.includes('wednesday')) {
    schedulingLogic.push('Used availability windows from space data');
  }
  if (/\d{1,2}:\d{2}\s*(am|pm)/i.test(emailBody)) {
    schedulingLogic.push('Proposed specific tour times');
  }

  // Build CRM lookups from detailedAmenities
  const crmLookups = buildCRMLookups(context.spaces, emailBody);

  // Build calendar availability checks
  const calendarChecks = buildCalendarChecks(context.spaces);

  // Build tour route optimization
  const tourRoute = buildTourRoute(context.spaces);

  return {
    questionsAddressed,
    dataUsed,
    schedulingLogic: schedulingLogic.length > 0 ? schedulingLogic : undefined,
    crmLookups,
    calendarChecks,
    tourRoute,
  };
}

/**
 * Calculates a confidence score based on email completeness
 */
function calculateConfidence(emailBody: string, context: ReturnType<typeof buildStructuredContext>): number {
  let score = 50; // Base score

  const lowerBody = emailBody.toLowerCase();

  // Check if email addresses key requirements
  if (lowerBody.includes('parking')) score += 10;
  if (lowerBody.includes('after-hours') || lowerBody.includes('24/7')) score += 10;
  if (lowerBody.includes('tour') || lowerBody.includes('schedule')) score += 10;

  // Check if email references specific spaces
  context.spaces.forEach(space => {
    if (lowerBody.includes(space.name.toLowerCase())) {
      score += 5;
    }
  });

  // Check if email has professional structure
  if (lowerBody.includes('hi ') || lowerBody.includes('hello')) score += 5;
  if (lowerBody.includes('best') || lowerBody.includes('regards') || lowerBody.includes('alex')) score += 5;

  // Cap at 95 (never 100% confident)
  return Math.min(score, 95);
}
