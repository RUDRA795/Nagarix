import { prisma } from '@/lib/prisma';

export interface FallbackResult {
  text: string;
  source: 'offline-sqlite';
  intent: string;
}

// Detect language from text
function detectLanguage(text: string): 'marathi' | 'hindi' | 'hinglish' | 'english' {
  const devanagariRegex = /[\u0900-\u097F]/;
  const isDevanagari = devanagariRegex.test(text);

  if (isDevanagari) {
    // Check for characteristic Marathi words
    const marathiWords = ['आहे', 'नाही', 'काय', 'कधी', 'कुठे', 'तक्रार', 'रस्ता', 'कचरा', 'वॉर्ड', 'पाणी', 'झाले', 'करा'];
    const hasMarathi = marathiWords.some(w => text.includes(w));
    return hasMarathi ? 'marathi' : 'hindi';
  }

  const hinglishWords = ['kya', 'hai', 'kitne', 'bhai', 'kaise', 'batao', 'konsa', 'mein', 'karo', 'dikhao', 'sadak', 'pani', 'kachra'];
  const lower = text.toLowerCase();
  const hasHinglish = hinglishWords.some(w => lower.split(/\s+/).includes(w));

  return hasHinglish ? 'hinglish' : 'english';
}

export async function processOfflineFallback(message: string): Promise<FallbackResult> {
  const lower = message.toLowerCase();
  const lang = detectLanguage(message);

  // 1. Ticket lookup (e.g., NX-2026-000001)
  const ticketMatch = message.match(/NX-\d{4}-\d{6}/i);
  if (ticketMatch) {
    const ticketId = ticketMatch[0].toUpperCase();
    const issue = await prisma.civicIssue.findUnique({
      where: { ticketId },
      include: { timeline: { orderBy: { createdAt: 'desc' }, take: 2 } },
    });

    if (!issue) {
      if (lang === 'marathi') return { text: `⚠️ तिकीट ${ticketId} सापडले नाही. कृपया क्रमांक तपासा. (ऑफलाइन मोड)`, source: 'offline-sqlite', intent: 'ticket_not_found' };
      if (lang === 'hindi' || lang === 'hinglish') return { text: `⚠️ टिकट ID ${ticketId} नहीं मिला। कृपया सही टिकट नंबर चेक करें। (Offline Mode)`, source: 'offline-sqlite', intent: 'ticket_not_found' };
      return { text: `⚠️ No record found for Ticket ID **${ticketId}**. Please verify the number. *(Offline SQLite Mode)*`, source: 'offline-sqlite', intent: 'ticket_not_found' };
    }

    const latestTimeline = issue.timeline[0]?.note || 'In system';
    if (lang === 'marathi') {
      return {
        text: `📌 **तक्रार ${issue.ticketId} तपशील (ऑफलाइन मोड)**:\n• **शीर्षक**: ${issue.title}\n• **स्थिती**: ${issue.status}\n• **श्रेणी**: ${issue.category}\n• **वॉर्ड**: ${issue.wardNumber || issue.zone || 'नागपूर'}\n• **अद्यतन**: ${latestTimeline}`,
        source: 'offline-sqlite',
        intent: 'ticket_lookup',
      };
    }
    if (lang === 'hindi' || lang === 'hinglish') {
      return {
        text: `📌 **शिकायत ${issue.ticketId} की जानकारी (Offline Mode)**:\n• **Title**: ${issue.title}\n• **Status**: ${issue.status}\n• **Category**: ${issue.category}\n• **Ward/Zone**: ${issue.wardNumber || issue.zone || 'Nagpur'}\n• **Latest Update**: ${latestTimeline}`,
        source: 'offline-sqlite',
        intent: 'ticket_lookup',
      };
    }
    return {
      text: `📌 **Complaint Details for ${issue.ticketId}** *(Offline SQLite Mode)*:\n• **Title**: ${issue.title}\n• **Status**: **${issue.status}**\n• **Severity**: ${issue.severity}\n• **Category**: ${issue.category}\n• **Location**: ${issue.locality || issue.wardName || issue.zone || 'Nagpur'}\n• **Department**: ${issue.department || 'NMC'}\n• **Latest Update**: ${latestTimeline}`,
      source: 'offline-sqlite',
      intent: 'ticket_lookup',
    };
  }

  // 2. Ward Statistics (e.g. Ward 12, ward no 5, वॉर्ड 12)
  const wardMatch = message.match(/(?:ward|prabhag|वॉर्ड|वार्ड)\s*(?:no\.?|number|क्र\.?)?\s*(\d{1,3})/i) ||
                    message.match(/(\d{1,3})\s*(?:ward|prabhag|वॉर्ड|वार्ड)/i);

  if (wardMatch) {
    const wardNumber = parseInt(wardMatch[1], 10);
    const [ward, count, byStatus, criticalCount] = await Promise.all([
      prisma.ward.findUnique({ where: { wardNumber } }),
      prisma.civicIssue.count({ where: { wardNumber } }),
      prisma.civicIssue.groupBy({ by: ['status'], where: { wardNumber }, _count: true }),
      prisma.civicIssue.count({ where: { wardNumber, severity: 'Critical' } }),
    ]);

    const active = byStatus.filter(s => ['Reported', 'AI_Verified', 'Assigned', 'In_Progress'].includes(s.status))
      .reduce((acc, curr) => acc + curr._count, 0);

    const resolved = byStatus.filter(s => ['Resolved', 'Citizen_Verified'].includes(s.status))
      .reduce((acc, curr) => acc + curr._count, 0);

    if (lang === 'marathi') {
      return {
        text: `📊 **वॉर्ड क्र. ${wardNumber} (${ward?.wardName || 'नागपूर'}) आकडेवारी (ऑफलाइन मोड)**:\n• **एकूण तक्रारी**: ${count}\n• **सक्रिय तक्रारी**: ${active}\n• **निवारण झालेल्या**: ${resolved}\n• **अति-तातडीच्या (Critical)**: ${criticalCount}\n\n*माहिती स्थानिक डेटाबेसमधून मिळवली आहे.*`,
        source: 'offline-sqlite',
        intent: 'ward_stats',
      };
    }
    if (lang === 'hindi' || lang === 'hinglish') {
      return {
        text: `📊 **Ward No. ${wardNumber} (${ward?.wardName || 'Nagpur'}) की स्थिति (Offline Mode)**:\n• **Total Complaints**: ${count}\n• **Active Issues**: ${active}\n• **Resolved**: ${resolved}\n• **Critical/Urgent**: ${criticalCount}\n\n*यह डेटा स्थानीय SQLite डेटाबेस से लिया गया है।*`,
        source: 'offline-sqlite',
        intent: 'ward_stats',
      };
    }
    return {
      text: `📊 **Ward ${wardNumber} (${ward?.wardName || 'Nagpur'}) Statistics** *(Offline SQLite Mode)*:\n• **Total Recorded Issues**: ${count}\n• **Currently Active**: ${active}\n• **Resolved**: ${resolved}\n• **Critical Severity**: ${criticalCount}\n\n*Queried directly from local Nagpur SQLite database.*`,
      source: 'offline-sqlite',
      intent: 'ward_stats',
    };
  }

  // 3. Critical issues / Priority recommendations
  if (lower.includes('critical') || lower.includes('priority') || lower.includes('sla') || lower.includes('urgent') || lower.includes('तातडी') || lower.includes('जरूरी')) {
    const criticalList = await prisma.civicIssue.findMany({
      where: { severity: 'Critical', status: { notIn: ['Resolved', 'Citizen_Verified'] } },
      take: 4,
      orderBy: { createdAt: 'asc' },
    });

    const itemsText = criticalList.map(c => `• **${c.ticketId}**: ${c.title} (${c.zone || 'Nagpur'}, ${c.category})`).join('\n');

    if (lang === 'marathi') {
      return {
        text: `🚨 **नागपुरातील अति-तातडीच्या (Critical) तक्रारी (ऑफलाइन मोड)**:\n${itemsText || 'सध्या कोणतीही प्रलंबित क्रिटिकल तक्रार नाही.'}\n\n*स्थानिक ऑफलाइन डेटाबेसमधून माहिती.*`,
        source: 'offline-sqlite',
        intent: 'critical_issues',
      };
    }
    if (lang === 'hindi' || lang === 'hinglish') {
      return {
        text: `🚨 **Nagpur की सबसे Urgent/Critical शिकायतें (Offline Mode)**:\n${itemsText || 'फिलहाल कोई पेंडिंग क्रिटिकल इशू नहीं है।'}\n\n*यह डेटाबेस से सीधे लिया गया है।*`,
        source: 'offline-sqlite',
        intent: 'critical_issues',
      };
    }
    return {
      text: `🚨 **Top Priority / Critical Civic Issues in Nagpur** *(Offline SQLite Mode)*:\n${itemsText || 'No active critical issues found.'}\n\n*Retrieved from local database records.*`,
      source: 'offline-sqlite',
      intent: 'critical_issues',
    };
  }

  // 4. Default City Overview / Status
  const [total, byStatus, slaBreaches] = await Promise.all([
    prisma.civicIssue.count(),
    prisma.civicIssue.groupBy({ by: ['status'], _count: true }),
    prisma.civicIssue.count({ where: { slaBreach: true } }),
  ]);

  const activeCount = byStatus.filter(s => ['Reported', 'AI_Verified', 'Assigned', 'In_Progress'].includes(s.status))
    .reduce((acc, curr) => acc + curr._count, 0);
  const resolvedCount = byStatus.filter(s => ['Resolved', 'Citizen_Verified'].includes(s.status))
    .reduce((acc, curr) => acc + curr._count, 0);

  if (lang === 'marathi') {
    return {
      text: `🏙️ **नागपूर शहर नागरी स्थिती (ऑफलाइन मोड)**:\n• **एकूण नोंदी**: ${total}\n• **सक्रिय तक्रारी**: ${activeCount}\n• **निवारण झालेल्या**: ${resolvedCount}\n• **SLA उल्लंघन**: ${slaBreaches}\n\n*स्थानिक डेटाबेसमधून थेट प्राप्त.*`,
      source: 'offline-sqlite',
      intent: 'city_overview',
    };
  }
  if (lang === 'hindi' || lang === 'hinglish') {
    return {
      text: `🏙️ **Nagpur City Civic Overview (Offline Mode)**:\n• **कुल शिकायतें**: ${total}\n• **Active Complaints**: ${activeCount}\n• **Resolved**: ${resolvedCount}\n• **SLA Breaches**: ${slaBreaches}\n\n*यह जानकारी लोकल SQLite डेटाबेस से उपलब्ध कराई गई है।*`,
      source: 'offline-sqlite',
      intent: 'city_overview',
    };
  }
  return {
    text: `🏙️ **Nagpur Civic Intelligence Overview** *(Offline SQLite Mode)*:\n• **Total Issues Logged**: ${total}\n• **Active Unresolved**: ${activeCount}\n• **Successfully Resolved**: ${resolvedCount}\n• **SLA Breaches**: ${slaBreaches}\n\n*Queried from local database while Gemini is offline.*`,
    source: 'offline-sqlite',
    intent: 'city_overview',
  };
}
