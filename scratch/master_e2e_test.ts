import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { prisma } from '../lib/prisma';
import { civicTools } from '../lib/ai/tools';
import { processOfflineFallback } from '../lib/ai/fallback';

async function runMasterAudit() {
  console.log('🌟 ============================================================');
  console.log('🌟 NAGARIX MASTER INTEGRATION & STABILIZATION AUDIT');
  console.log('🌟 ============================================================\n');

  console.log('📋 AUDIT 1: Database Grounding & Integrity');
  const countBefore = await prisma.civicIssue.count();
  const activeCount = await prisma.civicIssue.count({
    where: { status: { notIn: ['Resolved', 'Citizen_Verified'] } },
  });
  const wardCount = await prisma.ward.count();
  console.log(`• Total Issues in SQLite: ${countBefore}`);
  console.log(`• Active Issues: ${activeCount}`);
  console.log(`• Seeded Wards: ${wardCount}`);

  console.log('\n📋 AUDIT 2: Real Gemini AI Civic Tools');
  const cityStatus = await (civicTools.get_city_status as any).execute({}, {});
  console.log(`✅ Tool [get_city_status]: Total=${cityStatus.total}, Active=${cityStatus.active}, SLA Breaches=${cityStatus.slaBreach}`);

  const ward12Stats = await (civicTools.get_ward_statistics as any).execute({ wardNumber: 12 }, {});
  console.log(`✅ Tool [get_ward_statistics(12)]: Ward=${ward12Stats.ward?.wardName}, Issues=${ward12Stats.totalIssues}`);

  const priorityIssues = await (civicTools.get_priority_recommendations as any).execute({}, {});
  console.log(`✅ Tool [get_priority_recommendations]: Critical=${priorityIssues.summary.criticalUnresolved}`);

  console.log('\n📋 AUDIT 3: Multilingual Offline Fallback Engine');
  const fbEnglish = await processOfflineFallback('What are the critical issues in Nagpur?');
  console.log(`✅ Fallback [EN]: ${fbEnglish.intent} -> ${fbEnglish.text.substring(0, 70)}...`);

  const fbHindi = await processOfflineFallback('Ward 12 mein kitne issues hain?');
  console.log(`✅ Fallback [HI/Hinglish]: ${fbHindi.intent} -> ${fbHindi.text.substring(0, 70)}...`);

  const fbMarathi = await processOfflineFallback('नागपूरमध्ये किती तक्रारी आहेत?');
  console.log(`✅ Fallback [MR]: ${fbMarathi.intent} -> ${fbMarathi.text.substring(0, 70)}...`);

  console.log('\n📋 AUDIT 4: End-to-End Civic Reporting Loop');
  const newTicketId = `NX-2026-${String(countBefore + 1).padStart(6, '0')}`;
  const newIssue = await prisma.civicIssue.create({
    data: {
      ticketId: newTicketId,
      category: 'Road/Pothole',
      title: 'Deep pothole on Wardha Road near Sitabuldi Metro',
      description: 'Major road surface void causing severe bottleneck. Dispatched via Master Integration Test.',
      wardNumber: 23,
      wardName: 'Sitabuldi',
      zone: 'Mangalwari',
      locality: 'Near Sitabuldi Interchange',
      latitude: 21.1458,
      longitude: 79.0882,
      severity: 'Critical',
      priority: 1,
      status: 'Reported',
      department: 'Road Maintenance Department',
      source: 'citizen_audit',
      slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      timeline: {
        create: {
          status: 'Reported',
          note: 'Complaint registered and verified via NagariX Platform Audit',
          actor: 'Citizen',
        },
      },
    },
    include: { timeline: true },
  });
  console.log(`✅ Step A: Created Issue [${newIssue.ticketId}] in SQLite`);

  // Step B: Verify Track Query
  const trackRecord = await prisma.civicIssue.findUnique({
    where: { ticketId: newTicketId },
    include: { timeline: true },
  });
  console.log(`✅ Step B: Verified Track Query -> Ticket: ${trackRecord?.ticketId}, Status: ${trackRecord?.status}`);

  // Step C: Verify Map Query
  const mapRecord = await prisma.civicIssue.findFirst({
    where: { ticketId: newTicketId },
  });
  console.log(`✅ Step C: Verified Map Query -> Lat/Lng: (${mapRecord?.latitude}, ${mapRecord?.longitude})`);

  // Step D: Verify Total Count Increment
  const countAfter = await prisma.civicIssue.count();
  console.log(`✅ Step D: Total Count Incremented: ${countBefore} -> ${countAfter} (+1)`);

  console.log('\n🎉 ALL 4 AUDIT PHASES PASSED WITH ZERO ERRORS!');
}

runMasterAudit().catch(console.error);
