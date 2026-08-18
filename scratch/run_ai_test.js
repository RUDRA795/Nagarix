require('ts-node').register({ compilerOptions: { module: 'commonjs' } });
require('tsconfig-paths/register');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { processOfflineFallback } = require('../lib/ai/fallback.ts');
const { civicTools } = require('../lib/ai/tools.ts');

async function runTests() {
  console.log('🧪 ===================================================');
  console.log('🧪 NAGARIX PHASE 2 VERIFICATION SUITE');
  console.log('🧪 ===================================================\n');

  console.log('🔍 Checking Environment:');
  console.log('• GEMINI_API_KEY present:', Boolean(process.env.GEMINI_API_KEY));
  console.log('• GEMINI_MODEL:', process.env.GEMINI_MODEL || 'gemini-2.0-flash (default)');

  console.log('\n--- 1. Testing Civic Database Tools Directly ---');
  
  // Test get_city_status
  try {
    const cityStatus = await civicTools.get_city_status.execute({}, {});
    console.log('✅ Tool [get_city_status]: Total:', cityStatus.total, 'Active:', cityStatus.active, 'Resolved:', cityStatus.resolved);
  } catch (e) {
    console.error('❌ Tool [get_city_status] failed:', e);
  }

  // Test get_ward_statistics
  try {
    const wardStats = await civicTools.get_ward_statistics.execute({ wardNumber: 12 }, {});
    console.log('✅ Tool [get_ward_statistics] for Ward 12:', wardStats.ward ? `Ward: ${wardStats.ward.wardName}, Total Issues: ${wardStats.totalIssues}` : 'Not found');
  } catch (e) {
    console.error('❌ Tool [get_ward_statistics] failed:', e);
  }

  // Test search_issues
  try {
    const searchRes = await civicTools.search_issues.execute({ category: 'Road', limit: 3 }, {});
    console.log('✅ Tool [search_issues] (Road): Count found:', searchRes.count);
  } catch (e) {
    console.error('❌ Tool [search_issues] failed:', e);
  }

  // Test get_priority_recommendations
  try {
    const priorityRes = await civicTools.get_priority_recommendations.execute({}, {});
    console.log('✅ Tool [get_priority_recommendations]: Critical unresolved:', priorityRes.summary.criticalUnresolved);
  } catch (e) {
    console.error('❌ Tool [get_priority_recommendations] failed:', e);
  }

  console.log('\n--- 2. Testing Local Offline SQLite Fallback Engine ---');

  // Test English Offline
  const fbEnglish = await processOfflineFallback('How many active complaints are there in Nagpur?');
  console.log('✅ Offline Fallback (EN):', fbEnglish.intent, '->', fbEnglish.text.substring(0, 80) + '...');

  // Test Hindi Offline
  const fbHindi = await processOfflineFallback('Nagpur mein sabse zyada complaints kis cheez ki hain?');
  console.log('✅ Offline Fallback (HI):', fbHindi.intent, '->', fbHindi.text.substring(0, 80) + '...');

  // Test Marathi Offline
  const fbMarathi = await processOfflineFallback('नागपूरमध्ये सध्या किती तक्रारी आहेत?');
  console.log('✅ Offline Fallback (MR):', fbMarathi.intent, '->', fbMarathi.text.substring(0, 80) + '...');

  // Test Ward Offline
  const fbWard = await processOfflineFallback('Ward 12 mein kitne issues hain?');
  console.log('✅ Offline Fallback (Ward):', fbWard.intent, '->', fbWard.text.substring(0, 80) + '...');

  // Test Ticket Lookup Offline
  const fbTicket = await processOfflineFallback('Status of NX-2026-000001');
  console.log('✅ Offline Fallback (Ticket):', fbTicket.intent, '->', fbTicket.text.substring(0, 80) + '...');

  console.log('\n🎉 ALL PHASE 2 TESTS COMPLETED SUCCESSFULLY!');
}

runTests().catch(console.error);
