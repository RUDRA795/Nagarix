import { prisma } from '@/lib/prisma';

export interface SlaIssueDetail {
  ticketId: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  department: string | null;
  zone: string | null;
  wardNumber: number | null;
  wardName: string | null;
  createdAt: string;
  slaDeadline: string | null;
  hoursRemaining: number;
  riskStatus: 'Safe' | 'Watch' | 'At Risk' | 'Breached';
}

export interface SlaOverview {
  totalMonitored: number;
  safeCount: number;
  watchCount: number;
  atRiskCount: number;
  breachedCount: number;
  complianceRate: number;
  issues: SlaIssueDetail[];
}

export function computeSlaRisk(createdAt: Date, deadline: Date | null, status: string, slaBreach: boolean): {
  hoursRemaining: number;
  riskStatus: 'Safe' | 'Watch' | 'At Risk' | 'Breached';
} {
  const isResolved = ['Resolved', 'Citizen_Verified'].includes(status);
  if (isResolved) {
    return { hoursRemaining: 0, riskStatus: 'Safe' };
  }

  const now = new Date();
  if (!deadline) {
    return { hoursRemaining: 48, riskStatus: 'Safe' };
  }

  const totalWindowHours = (deadline.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  const remainingHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (slaBreach || remainingHours <= 0) {
    return { hoursRemaining: Math.round(remainingHours), riskStatus: 'Breached' };
  }

  const ratio = totalWindowHours > 0 ? remainingHours / totalWindowHours : 0;

  if (remainingHours <= 6 || ratio < 0.2) {
    return { hoursRemaining: Math.round(remainingHours * 10) / 10, riskStatus: 'At Risk' };
  }
  if (ratio <= 0.5) {
    return { hoursRemaining: Math.round(remainingHours * 10) / 10, riskStatus: 'Watch' };
  }
  return { hoursRemaining: Math.round(remainingHours * 10) / 10, riskStatus: 'Safe' };
}

export async function getSlaOverview(): Promise<SlaOverview> {
  const issues = await prisma.civicIssue.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      ticketId: true,
      title: true,
      category: true,
      severity: true,
      status: true,
      department: true,
      zone: true,
      wardNumber: true,
      wardName: true,
      createdAt: true,
      slaDeadline: true,
      slaBreach: true,
    },
  });

  let safeCount = 0;
  let watchCount = 0;
  let atRiskCount = 0;
  let breachedCount = 0;

  const analyzedIssues: SlaIssueDetail[] = issues.map(issue => {
    const { hoursRemaining, riskStatus } = computeSlaRisk(
      issue.createdAt,
      issue.slaDeadline,
      issue.status,
      issue.slaBreach
    );

    if (riskStatus === 'Safe') safeCount++;
    else if (riskStatus === 'Watch') watchCount++;
    else if (riskStatus === 'At Risk') atRiskCount++;
    else if (riskStatus === 'Breached') breachedCount++;

    return {
      ticketId: issue.ticketId,
      title: issue.title,
      category: issue.category,
      severity: issue.severity,
      status: issue.status,
      department: issue.department,
      zone: issue.zone,
      wardNumber: issue.wardNumber,
      wardName: issue.wardName,
      createdAt: issue.createdAt.toISOString(),
      slaDeadline: issue.slaDeadline ? issue.slaDeadline.toISOString() : null,
      hoursRemaining,
      riskStatus,
    };
  });

  const activeTotal = analyzedIssues.filter(i => !['Resolved', 'Citizen_Verified'].includes(i.status)).length;
  const complianceRate = activeTotal > 0
    ? Math.round(((activeTotal - breachedCount) / activeTotal) * 100)
    : 100;

  return {
    totalMonitored: issues.length,
    safeCount,
    watchCount,
    atRiskCount,
    breachedCount,
    complianceRate: Math.max(0, complianceRate),
    issues: analyzedIssues,
  };
}
