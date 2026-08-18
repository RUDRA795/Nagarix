// Utility functions for NagariX

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'Critical': return 'severity-critical';
    case 'High': return 'severity-high';
    case 'Medium': return 'severity-medium';
    case 'Low': return 'severity-low';
    default: return 'severity-medium';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Reported': return 'status-reported';
    case 'AI_Verified': return 'status-ai-verified';
    case 'Assigned': return 'status-assigned';
    case 'In_Progress': return 'status-in-progress';
    case 'Resolved': return 'status-resolved';
    case 'Citizen_Verified': return 'status-citizen-verified';
    default: return 'status-reported';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'AI_Verified': return 'AI Verified';
    case 'In_Progress': return 'In Progress';
    case 'Citizen_Verified': return 'Citizen Verified';
    default: return status;
  }
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'Road/Pothole': return '🛣️';
    case 'Garbage': return '🗑️';
    case 'Drainage': return '🚰';
    case 'Water Supply': return '💧';
    case 'Waterlogging': return '🌊';
    case 'Streetlight': return '💡';
    case 'Traffic Signal': return '🚦';
    case 'Tree/Green': return '🌳';
    case 'Public Toilet': return '🚻';
    default: return '📋';
  }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const NAGPUR_CENTER = { lat: 21.1458, lng: 79.0882 };

export const CATEGORY_LIST = [
  'Road/Pothole',
  'Garbage',
  'Drainage',
  'Water Supply',
  'Waterlogging',
  'Streetlight',
  'Traffic Signal',
  'Tree/Green',
  'Public Toilet',
  'Other',
];

export const SEVERITY_LIST = ['Low', 'Medium', 'High', 'Critical'];

export const STATUS_LIST = [
  'Reported',
  'AI_Verified',
  'Assigned',
  'In_Progress',
  'Resolved',
  'Citizen_Verified',
];

export const NAGPUR_ZONES = [
  'Dharampeth',
  'Laxmi Nagar',
  'Hanuman Nagar',
  'Dhantoli',
  'Nehru Nagar',
  'Gandhibagh',
  'Satranjipura',
  'Lakadganj',
  'Ashi Nagar',
  'Mangalwari',
];
