import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);


const ZONES = [
  'Dharampeth', 'Laxmi Nagar', 'Hanuman Nagar', 'Dhantoli',
  'Nehru Nagar', 'Gandhibagh', 'Satranjipura', 'Lakadganj',
  'Ashi Nagar', 'Mangalwari'
];

const WARDS = [
  { wardNumber: 1, wardName: 'Dharampeth', zone: 'Dharampeth', population: 32000, areaSqKm: 4.2 },
  { wardNumber: 2, wardName: 'Ramdaspeth', zone: 'Dharampeth', population: 28500, areaSqKm: 3.8 },
  { wardNumber: 3, wardName: 'Bajaj Nagar', zone: 'Dharampeth', population: 41000, areaSqKm: 5.1 },
  { wardNumber: 4, wardName: 'Laxmi Nagar', zone: 'Laxmi Nagar', population: 55000, areaSqKm: 6.3 },
  { wardNumber: 5, wardName: 'Nandanvan', zone: 'Laxmi Nagar', population: 38000, areaSqKm: 4.7 },
  { wardNumber: 6, wardName: 'Amravati Road', zone: 'Laxmi Nagar', population: 62000, areaSqKm: 7.2 },
  { wardNumber: 7, wardName: 'Hanuman Nagar', zone: 'Hanuman Nagar', population: 48000, areaSqKm: 5.6 },
  { wardNumber: 8, wardName: 'Pratap Nagar', zone: 'Hanuman Nagar', population: 35000, areaSqKm: 4.1 },
  { wardNumber: 9, wardName: 'Dhantoli', zone: 'Dhantoli', population: 44000, areaSqKm: 4.9 },
  { wardNumber: 10, wardName: 'Shivaji Nagar', zone: 'Dhantoli', population: 39000, areaSqKm: 4.3 },
  { wardNumber: 11, wardName: 'Nehru Nagar', zone: 'Nehru Nagar', population: 51000, areaSqKm: 5.8 },
  { wardNumber: 12, wardName: 'Trimurti Nagar', zone: 'Nehru Nagar', population: 47000, areaSqKm: 5.2 },
  { wardNumber: 13, wardName: 'Gandhibagh', zone: 'Gandhibagh', population: 68000, areaSqKm: 7.8 },
  { wardNumber: 14, wardName: 'Mahal', zone: 'Gandhibagh', population: 72000, areaSqKm: 8.1 },
  { wardNumber: 15, wardName: 'Itwari', zone: 'Gandhibagh', population: 65000, areaSqKm: 6.9 },
  { wardNumber: 16, wardName: 'Satranjipura', zone: 'Satranjipura', population: 43000, areaSqKm: 5.0 },
  { wardNumber: 17, wardName: 'Kamptee Road', zone: 'Satranjipura', population: 38000, areaSqKm: 4.5 },
  { wardNumber: 18, wardName: 'Lakadganj', zone: 'Lakadganj', population: 52000, areaSqKm: 6.1 },
  { wardNumber: 19, wardName: 'Bhandara Road', zone: 'Lakadganj', population: 41000, areaSqKm: 4.8 },
  { wardNumber: 20, wardName: 'Wathoda', zone: 'Ashi Nagar', population: 34000, areaSqKm: 3.9 },
  { wardNumber: 21, wardName: 'Ashi Nagar', zone: 'Ashi Nagar', population: 29000, areaSqKm: 3.4 },
  { wardNumber: 22, wardName: 'Mangalwari', zone: 'Mangalwari', population: 57000, areaSqKm: 6.5 },
  { wardNumber: 23, wardName: 'Sitabuldi', zone: 'Mangalwari', population: 63000, areaSqKm: 7.1 },
];

const CATEGORIES = [
  { category: 'Road/Pothole', department: 'Road Maintenance Department' },
  { category: 'Garbage', department: 'NMC Solid Waste Management' },
  { category: 'Drainage', department: 'Drainage Department' },
  { category: 'Water Supply', department: 'NMC Water Works' },
  { category: 'Waterlogging', department: 'Drainage Department' },
  { category: 'Streetlight', department: 'Electrical Department' },
  { category: 'Traffic Signal', department: 'Traffic Department' },
  { category: 'Tree/Green', department: 'Garden Department' },
  { category: 'Public Toilet', department: 'NMC Sanitation' },
  { category: 'Other', department: 'General Administration' },
];

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Reported', 'AI_Verified', 'Assigned', 'In_Progress', 'Resolved', 'Citizen_Verified'];

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTicketId(index: number): string {
  return `NX-2026-${String(index).padStart(6, '0')}`;
}

const ISSUE_TEMPLATES = [
  { category: 'Road/Pothole', titles: [
    'Large pothole causing accidents near school',
    'Road surface completely damaged near market',
    'Pothole causing traffic disruption on main road',
    'Deep pothole flooded after rain near residential area',
    'Multiple potholes on arterial road',
  ]},
  { category: 'Garbage', titles: [
    'Garbage dump not cleared for over a week',
    'Overflowing bins near residential colony',
    'Illegal garbage dumping near drainage nala',
    'Waste collection missed for 5 days in locality',
    'Construction debris blocking footpath',
  ]},
  { category: 'Drainage', titles: [
    'Blocked drain causing overflow into homes',
    'Drain overflowing onto road near market',
    'Drainage pipe broken, sewage on street',
    'Choked drain causing foul smell in locality',
    'Open drainage channel creating safety hazard',
  ]},
  { category: 'Water Supply', titles: [
    'No water supply for 3 days in ward',
    'Low water pressure issue in residential area',
    'Leaking water pipeline wasting supply',
    'Contaminated water complaint from residents',
    'Water supply irregular — only 1 hour per day',
  ]},
  { category: 'Waterlogging', titles: [
    'Severe waterlogging after rain blocking traffic',
    'Waterlogging near school compound',
    'Road flooded due to poor drainage',
    'Stagnant water breeding mosquitoes in colony',
    'Waterlogging making footpath unusable',
  ]},
  { category: 'Streetlight', titles: [
    'Street lights not working for 2 weeks',
    'Dark stretch creating safety concern for women',
    'Damaged pole with live wire — urgent',
    'Multiple lights out on main road',
    'Streetlight flickering dangerously near junction',
  ]},
  { category: 'Traffic Signal', titles: [
    'Traffic signal not functioning at busy junction',
    'Signal timing causing major jam during peak hours',
    'Signal lights broken — police manual control needed',
  ]},
  { category: 'Tree/Green', titles: [
    'Fallen tree blocking road after storm',
    'Overgrown branches encroaching on power lines',
    'Dead tree posing risk to passersby',
  ]},
  { category: 'Public Toilet', titles: [
    'Public toilet in poor condition and unhygienic',
    'No water in community toilet block',
    'Toilet facility near bus stop locked/inaccessible',
  ]},
  { category: 'Other', titles: [
    'Encroachment on footpath by vendors',
    'Stray animals creating nuisance near school',
    'Noise pollution from illegal construction at night',
    'Illegal banner/hoarding on government land',
  ]},
];

// Nagpur coordinate clusters per zone
const ZONE_COORDS: Record<string, {lat: number, lng: number}> = {
  'Dharampeth':   { lat: 21.1385, lng: 79.0730 },
  'Laxmi Nagar':  { lat: 21.1467, lng: 79.1050 },
  'Hanuman Nagar':{ lat: 21.1238, lng: 79.0942 },
  'Dhantoli':     { lat: 21.1280, lng: 79.0820 },
  'Nehru Nagar':  { lat: 21.1560, lng: 79.0975 },
  'Gandhibagh':   { lat: 21.1460, lng: 79.0820 },
  'Satranjipura': { lat: 21.1620, lng: 79.0680 },
  'Lakadganj':    { lat: 21.1340, lng: 79.1180 },
  'Ashi Nagar':   { lat: 21.1150, lng: 79.1060 },
  'Mangalwari':   { lat: 21.1520, lng: 79.0910 },
};

async function main() {
  console.log('🌱 Seeding NagariX demo database...');

  // Clear existing data
  await prisma.issueTimeline.deleteMany();
  await prisma.civicIssue.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();

  // Seed wards
  for (const ward of WARDS) {
    await prisma.ward.create({ data: ward });
  }
  console.log(`✅ Seeded ${WARDS.length} wards`);

  // Seed civic issues
  let issueCount = 0;
  for (let i = 1; i <= 60; i++) {
    const templateGroup = pick(ISSUE_TEMPLATES);
    const catEntry = CATEGORIES.find(c => c.category === templateGroup.category)!;
    const ward = pick(WARDS);
    const zoneCoord = ZONE_COORDS[ward.zone];
    const severity = pick(SEVERITIES);
    const statusIndex = randomInt(0, STATUSES.length - 1);
    const status = STATUSES[statusIndex];
    const createdDaysAgo = randomInt(1, 60);
    const createdAt = daysAgo(createdDaysAgo);
    const updatedAt = daysAgo(Math.max(0, createdDaysAgo - randomInt(1, 5)));

    const priorityMap: Record<string, number> = { Low: 4, Medium: 3, High: 2, Critical: 1 };
    const priority = priorityMap[severity] || 3;

    const slaHours = severity === 'Critical' ? 24 : severity === 'High' ? 48 : severity === 'Medium' ? 72 : 168;
    const slaDeadline = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000);
    const slaBreach = status !== 'Resolved' && status !== 'Citizen_Verified' && new Date() > slaDeadline;

    const resolvedAt = (status === 'Resolved' || status === 'Citizen_Verified')
      ? daysAgo(Math.max(0, createdDaysAgo - randomInt(2, 10)))
      : null;

    const lat = zoneCoord.lat + randomBetween(-0.015, 0.015);
    const lng = zoneCoord.lng + randomBetween(-0.015, 0.015);

    const title = pick(templateGroup.titles);

    const issue = await prisma.civicIssue.create({
      data: {
        ticketId: generateTicketId(i),
        category: catEntry.category,
        title,
        description: `Reported by resident: ${title}. This requires immediate attention from ${catEntry.department}. Issue located near ${ward.wardName}, ${ward.zone} zone, Ward No. ${ward.wardNumber}.`,
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6)),
        wardNumber: ward.wardNumber,
        wardName: ward.wardName,
        zone: ward.zone,
        locality: ward.wardName,
        severity,
        priority,
        status,
        department: catEntry.department,
        source: 'demo',
        slaDeadline,
        slaBreach,
        resolvedAt,
        resolutionNote: resolvedAt ? `Issue resolved by ${catEntry.department} team. Work completed and verified.` : null,
        createdAt,
        updatedAt,
      },
    });

    // Create timeline entries
    const timelineEntries = [{ status: 'Reported', note: 'Issue reported by citizen', actor: 'Citizen', createdAt }];
    if (statusIndex >= 1) timelineEntries.push({ status: 'AI_Verified', note: 'AI classification completed. Issue verified and categorized.', actor: 'NagariX AI', createdAt: daysAgo(createdDaysAgo - 1) });
    if (statusIndex >= 2) timelineEntries.push({ status: 'Assigned', note: `Assigned to ${catEntry.department}`, actor: 'System', createdAt: daysAgo(createdDaysAgo - 2) });
    if (statusIndex >= 3) timelineEntries.push({ status: 'In_Progress', note: 'Field team dispatched to location', actor: catEntry.department, createdAt: daysAgo(createdDaysAgo - 3) });
    if (statusIndex >= 4) timelineEntries.push({ status: 'Resolved', note: 'Issue resolved. Work completed.', actor: catEntry.department, createdAt: daysAgo(Math.max(0, createdDaysAgo - 5)) });
    if (statusIndex >= 5) timelineEntries.push({ status: 'Citizen_Verified', note: 'Resolution verified by citizen', actor: 'Citizen', createdAt: daysAgo(Math.max(0, createdDaysAgo - 7)) });

    for (const entry of timelineEntries) {
      await prisma.issueTimeline.create({
        data: { issueId: issue.id, ...entry },
      });
    }

    issueCount++;
  }

  console.log(`✅ Seeded ${issueCount} civic issues with timelines`);
  console.log('🎉 NagariX demo database ready!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
