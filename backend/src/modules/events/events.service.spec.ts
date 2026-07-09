import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { OrganizerScopeService } from '../../common/services/organizer-scope.service';
import { DATABASE_CONNECTION } from '../../database/database.constants';
import { UserRoleValues } from '../../database/schema';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { EventsService } from './events.service';

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

describe('EventsService organizer isolation', () => {
  let service: EventsService;
  let mockDb: Record<string, jest.Mock>;

  function buildSelectChain(result: unknown[]) {
    return {
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue(result),
      then: (resolve: (v: unknown) => void) => resolve(result),
    };
  }

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        OrganizerScopeService,
        { provide: DATABASE_CONNECTION, useValue: mockDb },
      ],
    }).compile();

    service = module.get(EventsService);
  });

  it('findOne returns 404 for organizer accessing another organizers event', async () => {
    mockDb.select.mockReturnValueOnce(buildSelectChain([]));

    await expect(service.findOne(EVENT_A_ID, organizerB)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('findOne returns event for owning organizer', async () => {
    const eventRow = {
      id: EVENT_A_ID,
      title: 'Event A',
      createdBy: { id: ORGANIZER_A_ID },
    };
    mockDb.select.mockReturnValueOnce(buildSelectChain([eventRow]));

    const result = await service.findOne(EVENT_A_ID, organizerA);
    expect(result.id).toBe(EVENT_A_ID);
  });

  it('remove returns 404 when organizer does not own event', async () => {
    mockDb.delete.mockReturnValueOnce({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      }),
    });

    await expect(service.remove(EVENT_A_ID, organizerB)).rejects.toThrow(
      NotFoundException,
    );
  });
});
