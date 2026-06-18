import { ClientMemoryEngine, ClientProfile, Interest } from './memory/ClientMemoryEngine.js';
import { NegotiationEngine } from './negotiation/NegotiationEngine.js';
import { PersonalityEngine } from './personality/PersonalityEngine.js';

export interface TelegramMessage {
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
}

export class SalesCopilot {

  static async handleIncomingMessage(msg: TelegramMessage): Promise<{
    status: string;
    suggestedReply?: string;
    delayMs?: number;
    requiresApproval: boolean;
  }> {
    
    // 1. Load Client Memory
    let profile = await ClientMemoryEngine.loadProfile(msg.userId);
    if (!profile) {
      profile = {
        userId: msg.userId,
        username: msg.username,
        topInterests: [],
        trustScore: 0.2, // Base trust
        tone: 'short',
        lastInteraction: new Date(),
        status: 'cold',
        dealHistory: []
      };
    }

    if (!profile.dealHistory) profile.dealHistory = [];

    // 2. Negotiation Engine (Analyze Intent, Hesitation, Fakes)
    const analysis = await NegotiationEngine.analyzeMessage(msg.text);
    
    if (analysis.objectionType) {
       profile.dealHistory.push(`[${new Date().toISOString()}] Objection detected: ${analysis.objectionType}. AI countered with: ${analysis.counterStrategy}`);
    }
    
    // 3. Update Memory based on analysis
    let action: 'reply' | 'ask_delivery' | 'hesitate' | 'ignore' = 'reply';
    if (analysis.hesitation) action = 'hesitate';
    if (msg.text.includes('доставка')) action = 'ask_delivery';
    if (analysis.fakeBuyer) action = 'ignore';

    const daysSince = (new Date().getTime() - new Date(profile.lastInteraction).getTime()) / (1000 * 3600 * 24);
    profile.trustScore = ClientMemoryEngine.calculateTrustScore(profile.trustScore, action, daysSince);
    profile.lastInteraction = new Date();

    // Naive tag extraction for MVP
    const tags = msg.text.split(' ').filter(w => w.length > 5);
    profile.topInterests = ClientMemoryEngine.updateInterests(profile.topInterests, tags);

    if (analysis.fakeBuyer) {
      profile.status = 'timewaster';
    } else if (analysis.intentScore > 0.7) {
      profile.status = 'hot';
    }

    // Save profile state asynchronously so we don't block
    ClientMemoryEngine.saveProfile(profile).catch((e: any) => {
      if (e.code !== 'ECONNREFUSED' && !e.message?.includes('ECONNREFUSED')) {
        console.error(e);
      }
    });

    // 4. Action Safety Layer
    if (profile.status === 'timewaster') {
      return { status: 'ignored', requiresApproval: false };
    }

    // 5. Generate Response (Mocked LLM call here, usually you call OpenAI/Gemini)
    let aiRawResponse = 'Здравствуйте, данный товар доступен для заказа! Будете брать?';
    if (analysis.counterStrategy) {
      aiRawResponse = analysis.counterStrategy;
    } else if (analysis.hesitation) {
      aiRawResponse = 'Конечно, если у вас есть вопросы, обращайтесь.';
    }

    // 6. Post-Processing & Personality Engine
    const validated = await PersonalityEngine.aiStyleValidator(aiRawResponse);
    let finalReply = validated.fixedText;

    if (analysis.counterStrategy) {
      finalReply = analysis.counterStrategy; // Maintain exact wording for strategy
    } else if (analysis.hesitation) {
      finalReply = 'без проблем, надумаешь — пиши';
    } else if (action === 'ask_delivery') {
      finalReply = 'отправляем сдэком. куда едет?';
    }

    // 7. Sales Timing Engine
    const delay = NegotiationEngine.calculateTiming(5 /* mock 5s reply speed */, analysis.intentScore);

    // 8. Human Approval Flow Routing
    // High risk actions (discounts, payment details, controversial) require human check
    const isRisky = finalReply.includes('скидка') || finalReply.includes('оплатить') || analysis.intentScore > 0.8;

    return {
      status: 'success',
      suggestedReply: finalReply,
      delayMs: delay,
      requiresApproval: isRisky
    };
  }
}
