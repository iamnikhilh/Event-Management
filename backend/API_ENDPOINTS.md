# API Endpoints Reference

## Auth
**POST** `/auth/login`
```json
Request: { "email": "user@example.com", "password": "pass123" }
Response: { "success": true, "data": { "accessToken": "...", "refreshToken": "..." } }
```

**POST** `/auth/refresh`
```json
Request: { "refreshToken": "..." }
Response: { "success": true, "data": { "accessToken": "...", "refreshToken": "..." } }
```

**POST** `/auth/logout`
```json
Response: { "success": true, "data": { "message": "Logged out" } }
```

**GET** `/auth/me` (Auth required)
```json
Response: { "success": true, "data": { "id": "uuid", "email": "...", "firstName": "...", "role": "..." } }
```

---

## Events
**POST** `/events` (Admin/Organizer)
```json
Request: {
  "title": "Tech Conf 2026",
  "slug": "tech-conf-2026",
  "description": "...",
  "categoryId": "uuid",
  "venue": "Convention Center",
  "eventDate": "2026-09-15T09:00:00Z",
  "capacity": 500,
  "isPublic": true,
  "status": "upcoming"
}
Response: { "success": true, "data": { "id": "uuid", "title": "...", "slug": "...", ... } }
```

**GET** `/events` (with pagination)
```json
Query: ?page=1&limit=10&search=tech&status=upcoming
Response: {
  "success": true,
  "data": [{ "id": "uuid", "title": "...", "slug": "...", "isPublic": true, ... }],
  "meta": { "pagination": { "page": 1, "limit": 10, "totalItems": 42, "totalPages": 5 } }
}
```

**GET** `/events/:id`
```json
Response: { "success": true, "data": { "id": "uuid", "title": "...", ... } }
```

**PATCH** `/events/:id` (Admin/Organizer)
```json
Request: { "title": "Updated Title", "isPublic": false, ... }
Response: { "success": true, "data": { "id": "uuid", ... } }
```

**DELETE** `/events/:id`
```json
Response: { "success": true, "data": { "message": "Event deleted" } }
```

---

## Speakers
**POST** `/speakers` (Admin/Organizer)
```json
Request: {
  "name": "Jane Smith",
  "title": "CTO",
  "company": "Tech Corp",
  "bio": "...",
  "photoUrl": "https://..."
}
Response: { "success": true, "data": { "id": "uuid", "name": "...", ... } }
```

**GET** `/speakers`
```json
Response: { "success": true, "data": [{ "id": "uuid", "name": "...", ... }] }
```

**GET** `/speakers/:id`
```json
Response: { "success": true, "data": { "id": "uuid", ... } }
```

**PATCH** `/speakers/:id` (Admin/Organizer)
```json
Request: { "title": "VP Engineering", ... }
Response: { "success": true, "data": { "id": "uuid", ... } }
```

**DELETE** `/speakers/:id`
```json
Response: { "success": true, "data": { "message": "Speaker deleted" } }
```

---

## Sessions
**POST** `/events/:eventId/sessions` (Admin/Organizer)
```json
Request: {
  "title": "Keynote: Future of AI",
  "description": "...",
  "track": "Main",
  "startTime": "2026-09-15T09:00:00Z",
  "endTime": "2026-09-15T10:00:00Z",
  "speakerIds": ["speaker-uuid-1", "speaker-uuid-2"]
}
Response: { "success": true, "data": { "id": "uuid", "title": "...", "speakers": [...] } }
```

**GET** `/events/:eventId/sessions`
```json
Response: {
  "success": true,
  "data": [{
    "id": "uuid",
    "title": "...",
    "startTime": "...",
    "speakers": [{ "id": "uuid", "name": "..." }]
  }]
}
```

**GET** `/events/:eventId/sessions/:id`
```json
Response: { "success": true, "data": { "id": "uuid", "title": "...", "speakers": [...] } }
```

**PATCH** `/events/:eventId/sessions/:id` (Admin/Organizer)
```json
Request: { "title": "Updated Title", "speakerIds": [...] }
Response: { "success": true, "data": { "id": "uuid", ... } }
```

**DELETE** `/events/:eventId/sessions/:id`
```json
Response: { "success": true, "data": { "message": "Session deleted" } }
```

---

## Sponsors
**POST** `/events/:eventId/sponsors` (Admin/Organizer)
```json
Request: {
  "name": "Gold Corp",
  "tier": "gold",
  "logoUrl": "https://...",
  "website": "https://..."
}
Response: { "success": true, "data": { "id": "uuid", "name": "...", "tier": "gold" } }
```

**GET** `/events/:eventId/sponsors` (sorted by tier)
```json
Response: { "success": true, "data": [{ "id": "uuid", "name": "...", "tier": "platinum" }, ...] }
```

**PATCH** `/events/:eventId/sponsors/:id`
```json
Request: { "tier": "platinum", ... }
Response: { "success": true, "data": { "id": "uuid", ... } }
```

**DELETE** `/events/:eventId/sponsors/:id`
```json
Response: { "success": true, "data": { "message": "Sponsor deleted" } }
```

---

## Ticket Types
**POST** `/events/:eventId/ticket-types` (Admin/Organizer)
```json
Request: {
  "name": "General Admission",
  "price": "99.99",
  "quantity": 100
}
Response: { "success": true, "data": { "id": "uuid", "name": "...", "price": "99.99", "quantitySold": 0 } }
```

**GET** `/events/:eventId/ticket-types`
```json
Response: { "success": true, "data": [{ "id": "uuid", "name": "...", "quantity": 100, "quantitySold": 25 }] }
```

**PATCH** `/events/:eventId/ticket-types/:id`
```json
Request: { "price": "129.99", "quantity": 150 }
Response: { "success": true, "data": { "id": "uuid", ... } }
```

**DELETE** `/events/:eventId/ticket-types/:id` (409 if quantitySold > 0)
```json
Response: { "success": true, "data": { "message": "Ticket type deleted" } }
```

---

## Attendees / Registration
**POST** `/events/:eventId/register` (Public - No Auth)
```json
Request: {
  "fullName": "John Doe",
  "email": "john@example.com",
  "ticketTypeId": "uuid"
}
Response: {
  "success": true,
  "data": {
    "id": "uuid",
    "status": "registered",
    "qrCode": "abc123xyz",
    "registeredAt": "2026-07-06T..."
  }
}
```

**GET** `/events/:eventId/attendees` (Admin/Organizer, paginated)
```json
Query: ?page=1&limit=20&search=john&status=registered
Response: {
  "success": true,
  "data": [{ "id": "uuid", "fullName": "...", "email": "...", "status": "registered", ... }],
  "meta": { "pagination": { "page": 1, "limit": 20, "totalItems": 150, "totalPages": 8 } }
}
```

**GET** `/events/:eventId/attendees/:id`
```json
Response: { "success": true, "data": { "id": "uuid", "fullName": "...", "status": "...", ... } }
```

**PATCH** `/events/:eventId/attendees/:id`
```json
Request: { "status": "cancelled", "fullName": "Jane Doe" }
Response: { "success": true, "data": { "id": "uuid", ... } }
```

**DELETE** `/events/:eventId/attendees/:id`
```json
Response: { "success": true, "data": { "message": "Attendee deleted" } }
```

**POST** `/events/:eventId/check-in` (Admin/Organizer)
```json
Request: { "qrCode": "abc123xyz" }
Response: {
  "success": true,
  "data": { "id": "uuid", "checkedIn": true, "checkedInAt": "2026-07-06T..." }
}
```

**GET** `/events/:eventId/attendees/export` (CSV, Admin/Organizer)
```
Content-Type: text/csv
Full Name,Email,Status,QR Code,Checked In,Registered At
"John Doe","john@example.com","registered","abc123xyz","Yes","2026-07-06T..."
```

---

## Notifications
**GET** `/notifications` (Auth required, paginated)
```json
Query: ?page=1&limit=10&isRead=false
Response: {
  "success": true,
  "data": [{
    "id": "uuid",
    "type": "registration_confirmed",
    "title": "Registration Confirmed",
    "message": "...",
    "isRead": false
  }],
  "meta": { "pagination": { "page": 1, "limit": 10, "totalItems": 5, "totalPages": 1 } }
}
```

**PATCH** `/notifications/:id/read` (Auth required)
```json
Response: { "success": true, "data": { "message": "Notification marked as read" } }
```

**PATCH** `/notifications/read-all` (Auth required)
```json
Response: { "success": true, "data": { "message": "All notifications marked as read" } }
```

---

## Analytics
**GET** `/analytics/events/:eventId` (Admin/Organizer)
```json
Response: {
  "success": true,
  "data": {
    "totalRegistered": 150,
    "totalCheckedIn": 120,
    "checkInRate": 80.0,
    "waitlistCount": 10,
    "registrationsOverTime": [
      { "date": "2026-07-01", "count": 20 },
      { "date": "2026-07-02", "count": 35 }
    ],
    "ticketBreakdown": [
      { "ticketTypeName": "General", "quantitySold": 100, "quantity": 150 }
    ]
  }
}
```

**GET** `/analytics/overview` (Admin/Organizer)
```json
Response: {
  "success": true,
  "data": {
    "eventsByStatus": {
      "draft": 5,
      "upcoming": 12,
      "active": 3,
      "completed": 8,
      "cancelled": 1
    },
    "top5Events": [
      { "eventId": "uuid", "title": "Tech Conf", "attendance": 250 },
      { "eventId": "uuid", "title": "Music Festival", "attendance": 500 }
    ]
  }
}
```

---

## Public (No Auth)
**GET** `/public/events` (paginated)
```json
Query: ?page=1&limit=10&search=tech
Response: {
  "success": true,
  "data": [{
    "id": "uuid",
    "title": "Tech Conf",
    "slug": "tech-conf",
    "isPublic": true,
    "status": "upcoming"
  }],
  "meta": { "pagination": { "page": 1, "limit": 10, "totalItems": 25, "totalPages": 3 } }
}
```

**GET** `/public/events/:slug` (full event details)
```json
Response: {
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "slug": "tech-conf",
    "sessions": [{ "id": "uuid", "title": "...", "speakers": [...] }],
    "sponsors": [{ "id": "uuid", "name": "...", "tier": "gold" }],
    "ticketTypes": [{ "id": "uuid", "name": "...", "price": "99.99" }]
  }
}
```

---

## Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error",
  "errors": { "email": ["email must be an email"] },
  "path": "/api/v1/auth/login",
  "timestamp": "2026-07-06T18:33:53.000Z"
}
```

---

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., delete ticket type with sold tickets)
- `500` - Server Error
