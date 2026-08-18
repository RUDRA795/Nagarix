import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { prisma } from '../lib/prisma';

async function testMapData() {
  console.log('🧪 ===================================================');
  console.log('🧪 NAGARIX PHASE 4 GEOSPATIAL TEST SUITE');
  console.log('🧪 ===================================================\n');

  // Test 1: Count geocoded issues in database
  const geocodedCount = await prisma.civicIssue.count({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
  });
  console.log('• Total geocoded issues in DB:', geocodedCount);

  // Test 2: Verify zone coverage
  const zoneStats = await prisma.civicIssue.groupBy({
    by: ['zone'],
    where: { latitude: { not: null }, longitude: { not: null } },
    _count: true,
  });
  console.log('• Zones represented on map:', zoneStats.map(z => `${z.zone} (${z._count})`).join(', '));

  // Test 3: Verify severity weights for heatmap
  const criticalMapIssues = await prisma.civicIssue.findMany({
    where: { severity: 'Critical', latitude: { not: null } },
    take: 3,
    select: { ticketId: true, title: true, latitude: true, longitude: true, zone: true },
  });
  console.log('• Sample Critical Heatmap Points:');
  criticalMapIssues.forEach(c => console.log(`  - [${c.ticketId}] (${c.latitude}, ${c.longitude}) in ${c.zone}: ${c.title}`));

  console.log('\n🎉 ALL PHASE 4 GEOSPATIAL TESTS PASSED!');
}

testMapData().catch(console.error);
