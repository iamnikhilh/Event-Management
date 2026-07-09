export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "organizer" | "attendee" | string;
}

export type EventStatus = "draft" | "upcoming" | "active" | "completed" | "cancelled";

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description?: string;
  categoryId?: string;
  category?: { id: string; name: string };
  venue?: string;
  eventDate: string;
  capacity?: number;
  bannerImage?: string | null;
  isPublic: boolean;
  status: EventStatus;
  createdAt?: string;
}

export interface Speaker {
  id: string;
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  photoUrl?: string;
}

export interface Session {
  id: string;
  title: string;
  description?: string;
  track?: string;
  startTime: string;
  endTime: string;
  speakers?: Speaker[];
  speakerIds?: string[];
}

export type SponsorTier = "platinum" | "gold" | "silver" | "bronze";

export interface Sponsor {
  id: string;
  name: string;
  tier: SponsorTier | string;
  logoUrl?: string;
  website?: string;
}

export interface TicketType {
  id: string;
  name: string;
  price: string;
  quantity: number;
  quantitySold: number;
}

export type AttendeeStatus = "registered" | "checked_in" | "cancelled" | "waitlisted";

export interface Attendee {
  id: string;
  fullName: string;
  email: string;
  status: AttendeeStatus | string;
  qrCode?: string;
  checkedIn?: boolean;
  checkedInAt?: string | null;
  registeredAt?: string;
  ticketTypeId?: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt?: string;
}

export interface EventAnalytics {
  totalRegistered: number;
  totalCheckedIn: number;
  checkInRate: number;
  waitlistCount: number;
  registrationsOverTime: { date: string; count: number }[];
  ticketBreakdown: { ticketTypeName: string; quantitySold: number; quantity: number }[];
}

export interface OverviewAnalytics {
  eventsByStatus: Record<EventStatus, number>;
  top5Events: { eventId: string; title: string; attendance: number }[];
}
