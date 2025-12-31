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

  // Detect questions addressed with enhanced structure
  if (lowerBody.includes('parking')) {
    questionsAddressed.push({
      question: 'Does the office have parking?',
      answer: 'Addressed parking availability',
      sourceEmailId: inboundEmailId,
      sourceText: originalContext?.inboundEmail?.body?.substring(0, 200),
    });
  }
  if (lowerBody.includes('after-hours') || lowerBody.includes('24/7') || lowerBody.includes('access')) {
    questionsAddressed.push({
      question: 'Is there after-hours access?',
      answer: 'Addressed after-hours access',
      sourceEmailId: inboundEmailId,
      sourceText: originalContext?.inboundEmail?.body?.substring(0, 200),
    });
  }
  if (lowerBody.includes('cloudscale') || lowerBody.includes('yc') || lowerBody.includes('startup')) {
    questionsAddressed.push({
      question: 'What is the host company background?',
      answer: 'Provided host company context',
      sourceEmailId: inboundEmailId,
      sourceText: originalContext?.inboundEmail?.body?.substring(0, 200),
    });
  }

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

  return {
    questionsAddressed,
    dataUsed,
    schedulingLogic: schedulingLogic.length > 0 ? schedulingLogic : undefined,
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
