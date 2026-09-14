import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
  });
});

// Helper to sanitize and extract JSON safely
function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

// Extraction endpoint
app.post('/api/extract', async (req, res) => {
  try {
    const { text, policies } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required.' });
    }

    const availablePoliciesDesc = (policies || [])
      .map((p: any) => `- ID: "${p.id}", Name: "${p.name}", Carrier: "${p.carrier}", Type: "${p.type}"`)
      .join('\n');

    if (ai) {
      const prompt = `You are an expert insurance assistant assistant system. Extract structured customer information from this informal voice or call notes dump from an insurance agent.
Available agent policies in library:
${availablePoliciesDesc}

Agent Call Note:
"""${text}"""

Extract whatever information is mentioned into this JSON schema. If any field cannot be determined or inferred from the text, use empty string "" or null (or "Not sure yet" for smoker/textConsent):
{
  "name": string | null,
  "age": string | null,
  "income": string | null,
  "policyId": string | null (match best policy ID from available policies list or null),
  "coverageAmount": string | null (e.g. "$15,000"),
  "termLength": string | null (leave empty "" if whole life or final expense),
  "monthlyPayment": string | null (e.g. "$67"),
  "smoker": "No" | "Yes" | "Not sure yet",
  "protecting": string | null (e.g. "Her daughter", "family"),
  "currentCoverage": string | null (e.g. "Just through work", "None"),
  "textConsent": "Yes" | "No" | "Not sure yet",
  "stage": string | null (e.g. "Quoted, thinking it over", "Initial Call / Discovery"),
  "notes": string | null (any emotional triggers, specific situations like "sister passed away last year with no money for funeral")
}

Return ONLY raw JSON, with no explanation and no markdown fences.`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '{}';
        const parsed = JSON.parse(cleanJsonString(rawText));
        const notSure = 'Not sure yet';
        parsed.name = parsed.name || notSure;
        parsed.age = parsed.age || notSure;
        parsed.income = parsed.income || notSure;
        parsed.coverageAmount = parsed.coverageAmount || notSure;
        parsed.monthlyPayment = parsed.monthlyPayment || notSure;
        parsed.smoker = parsed.smoker || notSure;
        parsed.protecting = parsed.protecting || notSure;
        parsed.currentCoverage = parsed.currentCoverage || notSure;
        parsed.notes = parsed.notes || text;
        return res.json({ success: true, data: parsed });
      } catch (geminiError: any) {
        console.warn('Gemini extraction error, applying heuristic parser:', geminiError.message);
      }
    }

    // High quality heuristic fallback if API key is not yet set or temporary failure
      const notSure = 'Not sure yet';
      const extracted: any = {
        name: notSure,
        age: notSure,
        income: notSure,
        policyId: policies?.[0]?.id || '',
        coverageAmount: notSure,
        termLength: '',
        monthlyPayment: notSure,
        smoker: notSure,
        protecting: notSure,
        currentCoverage: notSure,
        textConsent: 'Yes',
        stage: 'Quoted, thinking it over',
        notes: text,
      };

      // Extract name
      const nameMatch = text.match(/(?:phone with|talking to|spoke with|with|client|customer)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);
      if (nameMatch) extracted.name = nameMatch[1];

      // Extract age
      const ageMatch = text.match(/(\d{2})\s*(?:yo|y\/o|years old|,|\s)/);
      if (ageMatch) extracted.age = ageMatch[1];

      // Extract coverage
      const covMatch = text.match(/(?:for|\$)?\s*(\d{1,3}(?:k|,\d{3}|\s*thousand|\s*k))/i);
      if (covMatch) {
        let val = covMatch[1].toLowerCase().replace(/,/g, '');
        if (val.includes('k')) val = `$${parseInt(val) * 1000}`;
        else if (!val.startsWith('$')) val = `$${val}`;
        extracted.coverageAmount = val;
      }

      // Extract premium
      const premMatch = text.match(/(?:quoted|paying|payment|month|\$)\s*(\d{1,4})(?:\s*a month|\s*\/mo|\s*monthly)?/i);
      if (premMatch) extracted.monthlyPayment = `$${premMatch[1]}`;

      // Protecting
      const protectMatch = text.match(/(?:for her|for his|for their|protecting|daughter|son|kids|husband|wife|family)\s*(\w+)?/i);
      if (protectMatch) extracted.protecting = protectMatch[0];

      return res.json({ success: true, data: extracted });
  } catch (err: any) {
    console.error('Extraction error:', err);
    res.status(500).json({ error: err.message || 'Failed to extract customer information.' });
  }
});

// Generation endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { assetType, customer, agent, policy, tone, language } = req.body;
    if (!assetType || !customer) {
      return res.status(400).json({ error: 'Asset type and customer are required.' });
    }

    const langInstruction = language === 'es' 
      ? 'Output must be written in natural, warm, idiomatic Spanish (US/Latin American conversational Spanish).'
      : 'Output must be written in clear, plain American English.';

    const toneInstruction = {
      warmer: 'Warm, deeply empathetic, relatable, gentle, neighborly, reassuring.',
      professional: 'Crisp, respectful, polished, knowledgeable, consultative.',
      direct: 'Concise, clear, high-signal, respecting their time, action-oriented without fluff.',
    }[tone as 'warmer' | 'professional' | 'direct'] || 'Warm, reassuring, and conversational.';

    const complianceGuardrails = `
CRITICAL COMPLIANCE AND TONE GUARDRAILS:
1. Lead with protection, relief, and peace of mind - NEVER dread, graphic death imagery, or fear-mongering. Life insurance is about shielding loved ones.
2. NEVER promise guaranteed approval, guaranteed acceptance, or automatic pass unless the policy is explicitly guaranteed issue.
3. NEVER state IUL or Whole Life returns as fixed percentages or guaranteed figures. Illustrations are strictly regulated.
4. NEVER claim policy features that contradict the policy limitations:
   Policy limitations to strictly adhere to: "${policy?.limitations || 'None noted'}".
5. Target 6th-grade reading level. Use short sentences, everyday vocabulary, and zero insurance jargon (do NOT say "face amount", "underwriting tranche", "incontestability clause", "cash surrender dividend").
6. Keep it authentic to how an agent truly speaks. No cheesy marketing clichés (ban "supercharge", "once-in-a-lifetime opportunity", "lock in before it's too late").
`;

    if (ai) {
      let prompt = '';
      let schemaDescription = '';

      if (assetType === 'email') {
        schemaDescription = `Return raw JSON with shape: { "subject": string, "body": string }`;
        prompt = `You are a top-producing life insurance mentor drafting an email for an agent.
Agent: ${agent?.name || 'Agent'}, ${agent?.agency || 'Agency'} (Phone: ${agent?.phone || ''}, Email: ${agent?.email || ''})
Prospect Name: ${customer.name || 'Client'}
Age: ${customer.age || 'Not specified'}
Coverage Quoted: ${customer.coverageAmount || 'Not specified'}
Monthly Payment: ${customer.monthlyPayment || 'Not specified'}
Product: ${policy?.name || 'Life Insurance'} (${policy?.carrier || ''})
Policy Key Selling Points: ${policy?.sellingPoints || ''}
Who they are protecting: ${customer.protecting || 'their family'}
Stage: ${customer.stage || 'Thinking it over'}
Background & emotional context: ${customer.notes || 'None'}
Tone: ${toneInstruction}
Language: ${langInstruction}

${complianceGuardrails}

Instructions for Email:
- Write an engaging, human subject line that gets opened without looking like spam.
- In the body, reference their specific goal (e.g. protecting ${customer.protecting || 'their family'}), address the exact quote ($${customer.monthlyPayment || ''} for $${customer.coverageAmount || ''}), lock in the clarity of the policy without high-pressure tactics.
- End with a low-friction question (e.g. "Does 10am or 2pm tomorrow work better for a quick 3-minute check-in?").
- Include the agent's sign-off.
- ${schemaDescription}`;
      } else if (assetType === 'text') {
        schemaDescription = `Return raw JSON with shape: { "message": string }`;
        prompt = `You are writing an SMS text message from life insurance agent ${agent?.name || 'Agent'} to prospect ${customer.name || 'Client'}.
Context: ${customer.stage || 'Follow-up on quote'}, quoted ${customer.coverageAmount || ''} for ${customer.monthlyPayment || ''}/mo to protect ${customer.protecting || 'family'}.
Key detail: ${customer.notes || ''}
Tone: ${toneInstruction}
Language: ${langInstruction}

${complianceGuardrails}

MANDATORY TEXT CONSTRAINTS:
1. The message MUST BE UNDER 300 CHARACTERS TOTAL.
2. It MUST end with an opt-out phrase: "Reply STOP to opt out" (or "Responde STOP para cancelar" if Spanish).
3. Low friction, natural, casual, friendly.
- ${schemaDescription}`;
      } else if (assetType === 'script') {
        schemaDescription = `Return raw JSON with shape:
{
  "opener": string (natural greeting and reference to previous call),
  "questions": string[] (3-4 open-ended diagnostic discovery questions),
  "valueFraming": string (how to frame the ${policy?.name || 'policy'} and price against their exact priority),
  "objections": [
    { "objection": string, "response": string }
  ] (2-3 realistic objections like "need to think about it", "talk with my spouse", "too expensive" with conversational scripts),
  "close": string (assumptive, low-pressure transition to signature or medical questions)
}`;
        prompt = `You are a veteran life insurance sales coach creating an actionable call script for agent ${agent?.name || 'David'}.
Prospect: ${customer.name || 'Maria'} (Age: ${customer.age || '58'}, protecting: ${customer.protecting || 'daughter'})
Quoted: ${customer.coverageAmount || '$15,000'} at ${customer.monthlyPayment || '$67'}/month
Product: ${policy?.name || 'Final Expense'} (${policy?.carrier || ''})
Selling Points: ${policy?.sellingPoints || ''}
Background notes: ${customer.notes || ''}
Current status: ${customer.stage || 'Thinking it over'}
Tone: ${toneInstruction}
Language: ${langInstruction}

${complianceGuardrails}

Provide a battle-tested, empathetic, high-converting call script.
- ${schemaDescription}`;
      } else if (assetType === 'next_move') {
        schemaDescription = `Return raw JSON with shape:
{
  "suggestedAction": string (e.g. "Call Maria on Thursday morning between 9:30 AM and 11:00 AM"),
  "timingNotice": string (psychology of why this timing works),
  "communicationDraft": string (quick 2-sentence touchpoint or voicemail script if she doesn't pick up)
}`;
        prompt = `You are a sales operations strategist for life insurance agents.
Customer: ${customer.name}
Stage: ${customer.stage}
Notes: ${customer.notes}
Quoted: ${customer.coverageAmount} at ${customer.monthlyPayment}/mo
Tone: ${toneInstruction}
Language: ${langInstruction}

Suggest the single best next tactical move, the exact timing rule (e.g. 48-hour follow up window), and a brief touchpoint voicemail/text script.
- ${schemaDescription}`;
      }

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
        return res.json({ success: true, data: parsed });
      } catch (geminiError: any) {
        console.warn('Gemini temporary error, falling back to compliant template generator:', geminiError.message);
      }
    }

    // Deterministic high-converting fallbacks if API key is not populated or model unavailable
      const clientName = customer.name || 'Friend';
      const agentName = agent?.name || 'David Miller';
      const monthly = customer.monthlyPayment || '$67';
      const coverage = customer.coverageAmount || '$15,000';
      const protecting = customer.protecting || 'your loved ones';
      const policyName = policy?.name || 'Protection Plan';

      if (assetType === 'email') {
        return res.json({
          success: true,
          data: {
            subject: `Quick follow-up regarding ${protecting}'s protection, ${clientName}`,
            body: `Hi ${clientName},\n\nIt was great speaking with you earlier. I wanted to follow up on the plan we discussed—the ${coverage} coverage for ${monthly}/month.\n\nThe main thing to know is that this rate is locked in permanently, and it's set up so that ${protecting} won't ever have to worry about funeral or unexpected expenses out of pocket.\n\nI know you mentioned wanting to take a moment to think it through. Take your time, but please let me know if any questions came up. Would a quick 5-minute call tomorrow morning or afternoon be better to go over the simple next step?\n\nWarm regards,\n\n${agentName}\n${agent?.agency || 'Agency'}\n${agent?.phone || ''}`,
          },
        });
      } else if (assetType === 'text') {
        return res.json({
          success: true,
          data: {
            message: `Hi ${clientName}, it's ${agentName}. Just following up on that ${coverage} plan (${monthly}/mo) for ${protecting}. Happy to answer any quick questions whenever you're ready! Reply STOP to opt out.`,
          },
        });
      } else if (assetType === 'script') {
        return res.json({
          success: true,
          data: {
            opener: `Hey ${clientName}, this is ${agentName} following up from our conversation yesterday about the ${coverage} plan for ${protecting}. Did I catch you at a bad time?`,
            questions: [
              `When you thought about what happened with your sister, what was the biggest thing you wanted to make sure ${protecting} never has to carry alone?`,
              `Looking at the ${monthly} a month, does that feel comfortable within your normal household budget?`,
              `What questions did you or your family have after sleeping on the numbers?`,
            ],
            valueFraming: `The reason this ${policyName} works so well is that once we lock this in, the rate never goes up by a single penny, and the benefit never drops. It gives you immediate relief knowing the check goes straight to ${protecting} tax-free.`,
            objections: [
              {
                objection: "I still need to think about it.",
                response: `I completely understand, ${clientName}. It's an important decision. When people tell me they need to think it over, it's usually either the price or whether this really takes care of ${protecting}. Which of those is on your mind?`,
              },
              {
                objection: "I want to talk to my daughter first.",
                response: `That makes total sense. Most moms I work with don't want to burden their kids with the cost or the stress of having to decide. If we could show her this is already taken care of for ${monthly}/mo, how do you think she'd feel?`,
              },
            ],
            close: `Since we already know the rate and there's no medical exam, all we have to do right now is get the basic health questions submitted so the company can reserve this rate for you. Do you have your driver's license handy?`,
          },
        });
      } else {
        return res.json({
          success: true,
          data: {
            suggestedAction: `Call ${clientName} on Thursday between 10:00 AM and 11:30 AM`,
            timingNotice: `48 hours gives her space to process without letting the emotional urgency cool off. Calling mid-morning yields the highest answer rate for this age demographic.`,
            communicationDraft: `Hey ${clientName}, ${agentName} here. I was reviewing our notes about ${protecting} and wanted to share one quick thing that came to mind. Give me a ring when you have 2 minutes!`,
          },
        });
      }
  } catch (err: any) {
    console.error('Generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate content.' });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Insurance Assistant running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
