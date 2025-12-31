import { openai } from '../../lib/openai';
import { buildStructuredContext, buildEmailPrompt, EmailContext } from './contextBuilder';

export interface EmailDraft {
  body: string;
  confidence: number;
  reasoning: {
    questionsAddressed: string[];
    dataUsed: string[];
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
    const reasoning = analyzeEmailDraft(emailBody, structuredContext);

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
 * Analyzes the generated email to extract what questions were addressed
 */
function analyzeEmailDraft(emailBody: string, context: ReturnType<typeof buildStructuredContext>) {
  const questionsAddressed: string[] = [];
  const dataUsed: string[] = [];
  const schedulingLogic: string[] = [];

  const lowerBody = emailBody.toLowerCase();

  // Detect questions addressed
  if (lowerBody.includes('parking')) {
    questionsAddressed.push('Parking availability');
  }
  if (lowerBody.includes('after-hours') || lowerBody.includes('24/7') || lowerBody.includes('access')) {
    questionsAddressed.push('After-hours access');
  }
  if (lowerBody.includes('cloudscale') || lowerBody.includes('yc') || lowerBody.includes('startup')) {
    questionsAddressed.push('Host company context');
  }

  // Detect data sources used
  context.spaces.forEach(space => {
    if (lowerBody.includes(space.name.toLowerCase())) {
      dataUsed.push(`${space.name} details`);
    }
    if (space.amenities.parking && lowerBody.includes('parking')) {
      dataUsed.push(`${space.name} parking amenity`);
    }
    if (space.amenities.afterHours && (lowerBody.includes('after-hours') || lowerBody.includes('24/7'))) {
      dataUsed.push(`${space.name} after-hours access`);
    }
  });

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
