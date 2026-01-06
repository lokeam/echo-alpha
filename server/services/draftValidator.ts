import { openai } from '../../lib/openai';
import { buildStructuredContext } from './contextBuilder';

/**
 * Validates AI-generated draft against source data to catch hallucinations
 */
export async function validateDraftAccuracy(
  emailBody: string,
  context: ReturnType<typeof buildStructuredContext>
): Promise<{
  status: 'passed' | 'warnings' | 'failed';
  issues: string[];
  confidenceAdjustment: number;
}> {
  // Build list of valid prices for validation prompt
  const validPrices = context.spaces.map(s => `$${s.monthlyRate}`);

  const validationPrompt = `You are a fact-checker. Review this email draft for accuracy against the provided data.

EMAIL DRAFT:
${emailBody}

AVAILABLE DATA:
${context.spaces.map((space, i) => `
Space ${i + 1}: ${space.name}
- Address: ${space.address}
- Monthly Rate: $${space.monthlyRate}
- Amenities: ${JSON.stringify(space.amenities)}
- Detailed Amenities: ${JSON.stringify(space.detailedAmenities || {})}
`).join('\n')}

VALIDATION CHECKLIST:
1. Are all prices mentioned in the draft exactly matching the data? (Valid prices: ${validPrices.join(', ')})
2. Are all amenities mentioned in the draft explicitly listed in the space data?
3. Are all addresses mentioned correctly?
4. Are there any claims about features not in the data?

Respond in this exact format:
STATUS: [PASSED/WARNINGS/FAILED]
ISSUES:
- [List each issue found, or write "None" if passed]

Be strict. If the draft mentions "parking" but the data doesn't explicitly show parking details, that's an issue.`;

  try {
    const validation = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a strict fact-checker. Your job is to catch any information in the draft that is not explicitly in the provided data.',
        },
        {
          role: 'user',
          content: validationPrompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent validation
      max_tokens: 300,  // Short response needed
    });

    const validationResponse = validation.choices[0]?.message?.content || '';

    // Parse validation response
    const statusMatch = validationResponse.match(/STATUS:\s*(PASSED|WARNINGS|FAILED)/i);
    const status = (statusMatch?.[1]?.toLowerCase() || 'warnings') as 'passed' | 'warnings' | 'failed';

    const issuesSection = validationResponse.split('ISSUES:')[1] || '';
    const issues = issuesSection
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-'))
      .map(line => line.substring(1).trim())
      .filter(issue => issue.toLowerCase() !== 'none');

    // Calculate confidence adjustment
    let confidenceAdjustment = 0;
    if (status === 'warnings') confidenceAdjustment = -10;
    if (status === 'failed') confidenceAdjustment = -25;

    return {
      status,
      issues,
      confidenceAdjustment,
    };
  } catch (error) {
    console.error('Validation error:', error);
    // If validation fails, return neutral result (don't block draft generation)
    return {
      status: 'warnings',
      issues: ['Validation check could not be completed'],
      confidenceAdjustment: 0,
    };
  }
}
