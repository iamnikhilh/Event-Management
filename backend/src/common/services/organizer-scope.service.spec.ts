import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';

import { OrganizerScopeService } from './organizer-scope.service';
import { DATABASE_CONNECTION } from '../../database/database.constants';
import { UserRoleValues } from '../../database/schema';
import { AuthenticatedUser } from '../../modules/auth/interfaces/authenticated-user.interface';

const ORGANIZER_A_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ORGANIZER_B_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const EVENT_A_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

const organizerA: AuthenticatedUser = {
  sub: ORGANIZER_A_ID,
  email: 'a@example.com',
  role: UserRoleValues.ORGANIZER,
  firstName: 'Alice',
  lastName: 'Organizer',
};

const organizerB: AuthenticatedUser = {
  sub: ORGANIZER_B_ID,
  email: 'b@example.com',
  role: UserRoleValues.ORGANIZER,
  firstName: 'Bob',
  lastName: 'Organizer',
};

describe('OrganizerScopeService', () => {
  let service: OrganizerScopeService;
  let mockDb: {
    select: jest.Mock;
    from: jest.Mock;
    where: jest.Mock;
    limit: jest.Mock;
  };

  beforeEach(async () => {
    const chain = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };
    mockDb = {
      select: jest.fn().mockReturnValue(chain),
      from: chain.from,
      where: chain.where,
      limit: chain.limit,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizerScopeService,
        { provide: DATABASE_CONNECTION, useValue: mockDb },
      ],
    }).compile();

    service = module.get(OrganizerScopeService);
  });

  it('returns organizer filter for organizers', () => {
    const filter = service.organizerFilter(organizerA, {
      name: 'organizer_id',
    } as never);
    expect(filter).toBeDefined();
  });

  it('returns undefined organizer filter for admins', () => {
    const admin: AuthenticatedUser = { ...organizerA, role: UserRoleValues.ADMIN };
    const filter = service.organizerFilter(admin, { name: 'organizer_id' } as never);
    expect(filter).toBeUndefined();
  });

  it('throws NotFoundException (not Forbidden) for cross-organizer ownership', () => {
    expect(() =>
      service.assertOrganizerOwnership(organizerB, ORGANIZER_A_ID, 'Event'),
    ).toThrow(NotFoundException);
  });

  it('getScopedEvent applies organizerId in query for organizers', async () => {
    mockDb.limit.mockResolvedValueOnce([
      {
        id: EVENT_A_ID,
        organizerId: ORGANIZER_A_ID,
        isPublic: false,
        status: 'draft',
      },
    ]);

    const event = await service.getScopedEvent(EVENT_A_ID, organizerA);
    expect(event.organizerId).toBe(ORGANIZER_A_ID);
    expect(mockDb.where).toHaveBeenCalled();
  });

  it('getScopedEvent returns 404 when organizer does not own event', async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    await expect(
      service.getScopedEvent(EVENT_A_ID, organizerB),
    ).rejects.toThrow(NotFoundException);
  });
});
