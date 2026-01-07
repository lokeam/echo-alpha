export const FAQS_CONSTANTS = [
  {
    question: "What problem does this AI co-pilot solve?",
    answer:
      "Traditional office brokers spend 80% of their time on transactional work: drafting emails, looking up space details, coordinating tours. Only 20% of time is spent on their superpower: building trust, reading between the lines, delivering empathy at critical moments. As a result, brokers can only handle 5-10 deals simultaneously.",
  },
  {
    question: "How does the AI co-pilot work?",
    answer:
      "AI handles the 80%: Analyzes deal data, generates email drafts, proposes tour schedules. Human handles the 20%: Reviews drafts, makes edits, approves before sending. This results in 10-20x volume currently, with a target of 100x with better tooling.",
  },
  {
    question: "What's an example of a complex email the AI can handle?",
    answer:
      "Sarah from Acme AI sent a follow-up email with 12 detailed questions about 3 different spaces. For the FiDi Office, she asked about parking (monthly or per use?), key cards for 8 people, meeting room booking system, and what's included in rent. For the SOMA Space, she asked if the dog policy is negotiable, parking details (per person or shared?), and after-hours advance notice requirements. For the Mission space and tours, she asked for an update on the Mission space, Tuesday 2-4pm availability, Wednesday 11am-12pm slots, whether she could see all 3 in one window, and if tours could be arranged in geographical order. That's 12 questions across 3 spaces, requiring 36 data points to look up across CRM, calendars, and host communications.",
  },
  {
    question: "How much time does the AI save compared to manual work?",
    answer:
      "Traditional approach takes 45+ minutes: reading and parsing questions (3 min), looking up space details in CRM (11 min total), checking 3 calendars for availability (5 min), calculating optimal tour route (3 min), drafting comprehensive response (15 min), waiting for host responses (hours to days), and final review (3 min). The AI co-pilot approach takes approximately 3 minutes total: AI reads thread and identifies questions instantly, queries CRM for all spaces' detailed amenities instantly, checks calendar availability instantly, calculates optimal tour route instantly, generates comprehensive draft in 30 seconds, and broker reviews with full transparency into AI reasoning in 2 minutes. That's a 93% time savings, reducing 45 minutes to 3 minutes.",
  },
  {
    question: "What happens after the AI generates a draft?",
    answer:
      "The workflow has 5 steps: (1) AI Generation takes 3 seconds to analyze deal requirements, space amenities, availability windows, and email history to generate a contextually relevant response. (2) Confidence Scoring: AI calculates confidence (50-95%) based on how well it addressed questions and used available data. (3) Human Review: You'll see the draft with AI insights. Low confidence drafts appear first in the queue for priority review. (4) Edit & Approve: Make any changes needed, then approve. You can approve without sending, or approve and send immediately. (5) Real Email Sent: Email goes out via Resend API to the recipient.",
  },
  {
    question: "Does the AI send emails automatically?",
    answer:
      "No. This is a human-in-the-loop AI co-pilot workflow. The AI generates drafts and provides insights, but a human broker must review, edit if needed, and explicitly approve before any email is sent. This ensures quality control and maintains the personal touch that's critical in office leasing relationships.",
  },
  {
    question: "What technology powers this system?",
    answer:
      "Frontend: Next.js 15 with App Router, TypeScript, shadcn/ui with Tailwind CSS, and tRPC with React Query. Backend: tRPC procedures, OpenAI GPT-4o-mini for AI generation, Drizzle ORM for database operations, Supabase (Postgres) for data storage, and Resend for email sending.",
  },
  {
    question: "How does the AI access CRM and calendar data?",
    answer:
      "The AI queries your CRM database for detailed space information (amenities, parking, access systems, policies) and checks calendar systems for availability across multiple spaces and time windows. All data lookups are logged and shown transparently in the AI reasoning panel, so you can see exactly what information the AI used to generate each draft. This transparency ensures you can verify the AI's work and catch any potential errors before sending.",
  },
];
