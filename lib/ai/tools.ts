import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const civicTools = {
  get_city_status: tool({
    description: 'Get current overview statistics of all civic issues in Nagpur city. Returns total counts, status breakdown, category breakdown, and recent activity.',
    inputSchema: z.object({}),
    execute: async () => {
      const [total, byStatus, byCategory, bySeverity, recent, slaBreach] = await Promise.all([
        prisma.civicIssue.count(),
        prisma.civicIssue.groupBy({ by: ['status'], _count: true }),
        prisma.civicIssue.groupBy({ by: ['category'], _count: true }),
        prisma.civicIssue.groupBy({ by: ['severity'], _count: true }),
        prisma.civicIssue.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { ticketId: true, title: true, category: true, severity: true, status: true, zone: true, createdAt: true },
        }),
        prisma.civicIssue.count({ where: { slaBreach: true } }),
      ]);

      const statusMap: Record<string, number> = {};
      byStatus.forEach(s => { statusMap[s.status] = s._count; });

      return {
        source: 'demo',
        total,
        active: (statusMap['Reported'] || 0) + (statusMap['AI_Verified'] || 0) + (statusMap['Assigned'] || 0) + (statusMap['In_Progress'] || 0),
        resolved: (statusMap['Resolved'] || 0) + (statusMap['Citizen_Verified'] || 0),
        slaBreach,
        byStatus: statusMap,
        byCategory: Object.fromEntries(byCategory.map(c => [c.category, c._count])),
        bySeverity: Object.fromEntries(bySeverity.map(s => [s.severity, s._count])),
        recentIssues: recent,
      };
    },
  }),

  get_ward_statistics: tool({
    description: 'Get issue statistics for a specific Nagpur ward by ward number (1-156). Returns total issues, status breakdown, and most common categories.',
    inputSchema: z.object({
      wardNumber: z.number().min(1).max(156).describe('Ward number between 1 and 156'),
    }),
    execute: async ({ wardNumber }: { wardNumber: number }) => {
      const [ward, issues, byStatus, byCategory] = await Promise.all([
        prisma.ward.findUnique({ where: { wardNumber } }),
        prisma.civicIssue.count({ where: { wardNumber } }),
        prisma.civicIssue.groupBy({ by: ['status'], where: { wardNumber }, _count: true }),
        prisma.civicIssue.groupBy({ by: ['category'], where: { wardNumber }, _count: true }),
      ]);

      if (!ward) {
        return { error: `Ward ${wardNumber} not found in database`, wardNumber };
      }

      return {
        source: 'demo',
        ward,
        totalIssues: issues,
        byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
        topCategories: byCategory.sort((a, b) => b._count - a._count).slice(0, 5).map(c => ({ category: c.category, count: c._count })),
      };
    },
  }),

  search_issues: tool({
    description: 'Search civic issues by category, status, ward number, severity, zone, or keyword. Returns matching issues with details.',
    inputSchema: z.object({
      category: z.string().optional().describe('Issue category e.g. Road/Pothole, Garbage, Drainage, Water Supply, Streetlight'),
      status: z.string().optional().describe('Status: Reported, AI_Verified, Assigned, In_Progress, Resolved, Citizen_Verified'),
      wardNumber: z.number().optional().describe('Ward number 1-156'),
      zone: z.string().optional().describe('Zone name e.g. Dharampeth, Laxmi Nagar, Gandhibagh'),
      severity: z.string().optional().describe('Severity: Low, Medium, High, Critical'),
      keyword: z.string().optional().describe('Text to search in title or description'),
      limit: z.number().max(20).default(10).describe('Maximum results to return'),
    }),
    execute: async ({ category, status, wardNumber, zone, severity, keyword, limit }: {
      category?: string;
      status?: string;
      wardNumber?: number;
      zone?: string;
      severity?: string;
      keyword?: string;
      limit: number;
    }) => {
      const where: Record<string, unknown> = {};
      if (category) where.category = { contains: category };
      if (status) where.status = status;
      if (wardNumber) where.wardNumber = wardNumber;
      if (zone) where.zone = { contains: zone };
      if (severity) where.severity = severity;
      if (keyword) where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
        { locality: { contains: keyword } },
      ];

      const issues = await prisma.civicIssue.findMany({
        where,
        take: limit,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        select: {
          ticketId: true, title: true, category: true, severity: true,
          status: true, zone: true, wardNumber: true, wardName: true,
          locality: true, priority: true, slaBreach: true, createdAt: true,
        },
      });

      return { source: 'demo', count: issues.length, issues };
    },
  }),

  get_issue_details: tool({
    description: 'Get full details of a specific civic issue by its ticket ID (format: NX-2026-XXXXXX). Returns all fields including timeline.',
    inputSchema: z.object({
      ticketId: z.string().describe('Ticket ID in format NX-2026-XXXXXX'),
    }),
    execute: async ({ ticketId }: { ticketId: string }) => {
      const issue = await prisma.civicIssue.findUnique({
        where: { ticketId: ticketId.toUpperCase() },
        include: {
          timeline: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (!issue) {
        return { error: `No issue found with ticket ID ${ticketId}` };
      }

      return { source: 'demo', issue };
    },
  }),

  create_complaint: tool({
    description: 'Create a new civic complaint in the NagariX system. Returns the new ticket ID.',
    inputSchema: z.object({
      category: z.string().describe('Issue category'),
      description: z.string().min(10).describe('Detailed description of the civic issue'),
      wardNumber: z.number().optional().describe('Ward number if known'),
      locality: z.string().optional().describe('Locality or area name'),
      latitude: z.number().optional().describe('GPS latitude'),
      longitude: z.number().optional().describe('GPS longitude'),
      contactPhone: z.string().optional().describe('Contact phone number'),
      severity: z.string().optional().describe('Reported severity'),
    }),
    execute: async ({ category, description, wardNumber, locality, latitude, longitude, contactPhone, severity }: {
      category: string;
      description: string;
      wardNumber?: number;
      locality?: string;
      latitude?: number;
      longitude?: number;
      contactPhone?: string;
      severity?: string;
    }) => {
      const DEPT_MAP: Record<string, string> = {
        'Road/Pothole': 'Road Maintenance Department',
        'Garbage': 'NMC Solid Waste Management',
        'Drainage': 'Drainage Department',
        'Water Supply': 'NMC Water Works',
        'Waterlogging': 'Drainage Department',
        'Streetlight': 'Electrical Department',
        'Traffic Signal': 'Traffic Department',
        'Tree/Green': 'Garden Department',
        'Public Toilet': 'NMC Sanitation',
        'Other': 'General Administration',
      };

      let ward = null;
      if (wardNumber) {
        ward = await prisma.ward.findUnique({ where: { wardNumber } });
      }

      const count = await prisma.civicIssue.count();
      const ticketId = `NX-2026-${String(count + 1).padStart(6, '0')}`;

      const issueSeverity = severity || 'Medium';
      const priorityMap: Record<string, number> = { Low: 4, Medium: 3, High: 2, Critical: 1 };
      const priority = priorityMap[issueSeverity] || 3;
      const slaHours = issueSeverity === 'Critical' ? 24 : issueSeverity === 'High' ? 48 : issueSeverity === 'Medium' ? 72 : 168;
      const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

      const title = description.length > 80 ? description.substring(0, 77) + '...' : description;

      const issue = await prisma.civicIssue.create({
        data: {
          ticketId,
          category,
          title,
          description,
          wardNumber: ward?.wardNumber || wardNumber || null,
          wardName: ward?.wardName || null,
          zone: ward?.zone || null,
          locality: locality || null,
          latitude: latitude || null,
          longitude: longitude || null,
          severity: issueSeverity,
          priority,
          status: 'Reported',
          department: DEPT_MAP[category] || 'General Administration',
          contactPhone: contactPhone || null,
          slaDeadline,
          source: 'citizen',
          timeline: {
            create: {
              status: 'Reported',
              note: 'Issue reported via NagariX AI Assistant',
              actor: 'NagariX AI',
            },
          },
        },
      });

      return {
        success: true,
        ticketId: issue.ticketId,
        message: `Complaint registered successfully. Your ticket ID is ${issue.ticketId}. Department: ${issue.department}. Expected resolution: within ${slaHours} hours.`,
      };
    },
  }),

  get_priority_recommendations: tool({
    description: 'Get AI priority recommendations for which civic issues Nagpur should fix first, ranked by urgency score.',
    inputSchema: z.object({}),
    execute: async () => {
      const criticalIssues = await prisma.civicIssue.findMany({
        where: {
          status: { notIn: ['Resolved', 'Citizen_Verified'] },
        },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        take: 10,
        select: {
          ticketId: true, title: true, category: true, severity: true,
          zone: true, wardNumber: true, slaBreach: true, slaDeadline: true,
          createdAt: true, priority: true,
        },
      });

      const slaBreach = await prisma.civicIssue.count({
        where: { slaBreach: true, status: { notIn: ['Resolved', 'Citizen_Verified'] } },
      });

      const criticalCount = await prisma.civicIssue.count({
        where: { severity: 'Critical', status: { notIn: ['Resolved', 'Citizen_Verified'] } },
      });

      return {
        source: 'demo',
        summary: { slaBreach, criticalUnresolved: criticalCount },
        topPriorityIssues: criticalIssues,
        recommendationNote: 'Issues ranked by: severity (Critical > High > Medium > Low), then SLA breach status, then age.',
      };
    },
  }),

  get_analytics: tool({
    description: 'Get analytics data including resolution rates, category trends, zone performance, and department statistics.',
    inputSchema: z.object({
      metric: z.enum(['overview', 'trends', 'departments', 'zones']).optional().default('overview'),
      period: z.enum(['7d', '30d', '90d']).optional().default('30d'),
    }),
    execute: async ({ metric, period }: {
      metric: 'overview' | 'trends' | 'departments' | 'zones';
      period: '7d' | '30d' | '90d';
    }) => {
      const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [total, resolved, byCategory, byZone, byDept] = await Promise.all([
        prisma.civicIssue.count({ where: { createdAt: { gte: since } } }),
        prisma.civicIssue.count({ where: { createdAt: { gte: since }, status: { in: ['Resolved', 'Citizen_Verified'] } } }),
        prisma.civicIssue.groupBy({ by: ['category'], where: { createdAt: { gte: since } }, _count: true }),
        prisma.civicIssue.groupBy({ by: ['zone'], where: { createdAt: { gte: since } }, _count: true }),
        prisma.civicIssue.groupBy({ by: ['department'], where: { createdAt: { gte: since } }, _count: true }),
      ]);

      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      return {
        source: 'demo',
        period,
        totalIssues: total,
        resolved,
        resolutionRate: `${resolutionRate}%`,
        byCategory: byCategory.map(c => ({ category: c.category, count: c._count })).sort((a, b) => b.count - a.count),
        byZone: byZone.map(z => ({ zone: z.zone, count: z._count })).sort((a, b) => b.count - a.count),
        byDepartment: byDept.map(d => ({ department: d.department, count: d._count })).sort((a, b) => b.count - a.count),
      };
    },
  }),
};
