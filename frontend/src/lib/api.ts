import { api, type Envelope } from "@/lib/api-client";
import type {
  Attendee,
  EventAnalytics,
  EventItem,
  EventStatus,
  NotificationItem,
  OverviewAnalytics,
  Session,
  Speaker,
  Sponsor,
  TicketType,
} from "@/lib/types";

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
}

async function paginated<T>(
  path: string,
  query: Record<string, unknown>,
  options?: { auth?: boolean },
): Promise<Paginated<T>> {
  const res = await api<Envelope<T[]>>(path, {
    query: query as Record<string, string | number>,
    auth: options?.auth,
  });
  return {
    items: res.data ?? [],
    pagination:
      res.meta?.pagination ?? { page: 1, limit: 10, totalItems: res.data?.length ?? 0, totalPages: 1 },
  };
}

// Events
export const eventsApi = {
  list: (params: { page?: number; limit?: number; search?: string; status?: EventStatus | "" }) =>
    paginated<EventItem>("/events", { page: 1, limit: 10, ...params }),
  get: (id: string) => api<Envelope<EventItem>>(`/events/${id}`).then((r) => r.data),
  create: (body: Partial<EventItem>) =>
    api<Envelope<EventItem>>("/events", { method: "POST", body }).then((r) => r.data),
  update: (id: string, body: Partial<EventItem>) =>
    api<Envelope<EventItem>>(`/events/${id}`, { method: "PATCH", body }).then((r) => r.data),
  remove: (id: string) => api(`/events/${id}`, { method: "DELETE" }),
};

// Speakers
export const speakersApi = {
  list: () => api<Envelope<Speaker[]>>("/speakers").then((r) => r.data),
  get: (id: string) => api<Envelope<Speaker>>(`/speakers/${id}`).then((r) => r.data),
  create: (body: Partial<Speaker>) =>
    api<Envelope<Speaker>>("/speakers", { method: "POST", body }).then((r) => r.data),
  update: (id: string, body: Partial<Speaker>) =>
    api<Envelope<Speaker>>(`/speakers/${id}`, { method: "PATCH", body }).then((r) => r.data),
  remove: (id: string) => api(`/speakers/${id}`, { method: "DELETE" }),
};

// Sessions
export const sessionsApi = {
  list: (eventId: string) =>
    api<Envelope<Session[]>>(`/events/${eventId}/sessions`).then((r) => r.data),
  get: (eventId: string, id: string) =>
    api<Envelope<Session>>(`/events/${eventId}/sessions/${id}`).then((r) => r.data),
  create: (eventId: string, body: Partial<Session> & { speakerIds?: string[] }) =>
    api<Envelope<Session>>(`/events/${eventId}/sessions`, { method: "POST", body }).then(
      (r) => r.data,
    ),
  update: (eventId: string, id: string, body: Partial<Session> & { speakerIds?: string[] }) =>
    api<Envelope<Session>>(`/events/${eventId}/sessions/${id}`, { method: "PATCH", body }).then(
      (r) => r.data,
    ),
  remove: (eventId: string, id: string) =>
    api(`/events/${eventId}/sessions/${id}`, { method: "DELETE" }),
};

// Sponsors
export const sponsorsApi = {
  list: (eventId: string) =>
    api<Envelope<Sponsor[]>>(`/events/${eventId}/sponsors`).then((r) => r.data),
  create: (eventId: string, body: Partial<Sponsor>) =>
    api<Envelope<Sponsor>>(`/events/${eventId}/sponsors`, { method: "POST", body }).then(
      (r) => r.data,
    ),
  update: (eventId: string, id: string, body: Partial<Sponsor>) =>
    api<Envelope<Sponsor>>(`/events/${eventId}/sponsors/${id}`, { method: "PATCH", body }).then(
      (r) => r.data,
    ),
  remove: (eventId: string, id: string) =>
    api(`/events/${eventId}/sponsors/${id}`, { method: "DELETE" }),
};

// Ticket Types
export const ticketsApi = {
  list: (eventId: string) =>
    api<Envelope<TicketType[]>>(`/events/${eventId}/ticket-types`).then((r) => r.data),
  create: (eventId: string, body: Partial<TicketType>) =>
    api<Envelope<TicketType>>(`/events/${eventId}/ticket-types`, { method: "POST", body }).then(
      (r) => r.data,
    ),
  update: (eventId: string, id: string, body: Partial<TicketType>) =>
    api<Envelope<TicketType>>(`/events/${eventId}/ticket-types/${id}`, {
      method: "PATCH",
      body,
    }).then((r) => r.data),
  remove: (eventId: string, id: string) =>
    api(`/events/${eventId}/ticket-types/${id}`, { method: "DELETE" }),
};

// Attendees
export const attendeesApi = {
  list: (
    eventId: string,
    params: { page?: number; limit?: number; search?: string; status?: string },
  ) => paginated<Attendee>(`/events/${eventId}/attendees`, { page: 1, limit: 20, ...params }),
  get: (eventId: string, id: string) =>
    api<Envelope<Attendee>>(`/events/${eventId}/attendees/${id}`).then((r) => r.data),
  update: (eventId: string, id: string, body: Partial<Attendee>) =>
    api<Envelope<Attendee>>(`/events/${eventId}/attendees/${id}`, {
      method: "PATCH",
      body,
    }).then((r) => r.data),
  remove: (eventId: string, id: string) =>
    api(`/events/${eventId}/attendees/${id}`, { method: "DELETE" }),
  register: (
    eventId: string,
    body: { fullName: string; email: string; ticketTypeId: string },
  ) =>
    api<Envelope<Attendee>>(`/events/${eventId}/register`, {
      method: "POST",
      body,
      auth: false,
    }).then((r) => r.data),
  checkIn: (eventId: string, qrCode: string) =>
    api<Envelope<Attendee>>(`/events/${eventId}/check-in`, {
      method: "POST",
      body: { qrCode },
    }).then((r) => r.data),
  exportCsv: async (eventId: string) => {
    const res = await api<Response>(`/events/${eventId}/attendees/export`, { raw: true });
    return res.blob();
  },
};

// Notifications
export const notificationsApi = {
  list: (params: { page?: number; limit?: number; isRead?: boolean }) =>
    paginated<NotificationItem>("/notifications", { page: 1, limit: 10, ...params }),
  markRead: (id: string) => api(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => api(`/notifications/read-all`, { method: "PATCH" }),
};

// Analytics
export const analyticsApi = {
  event: (eventId: string) =>
    api<Envelope<EventAnalytics>>(`/analytics/events/${eventId}`).then((r) => r.data),
  overview: () => api<Envelope<OverviewAnalytics>>("/analytics/overview").then((r) => r.data),
};

// Uploads
export const uploadsApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api<Envelope<{ url: string; filename: string }>>("/uploads", {
      method: "POST",
      body: formData,
    }).then((r) => r.data);
  },
};

// Public
export const publicApi = {
  eventCount: () =>
    api<Envelope<number>>("/public/events/count", { auth: false }).then((r) => r.data),
  events: (params: { page?: number; limit?: number; search?: string }) =>
    paginated<EventItem>("/public/events", { page: 1, limit: 10, ...params }, { auth: false }),
  eventBySlug: (slug: string) =>
    api<
      Envelope<
        EventItem & {
          sessions: Session[];
          sponsors: Sponsor[];
          ticketTypes: TicketType[];
        }
      >
    >(`/public/events/${slug}`, { auth: false }).then((r) => r.data),
};
