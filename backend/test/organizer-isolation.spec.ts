import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { EventsController } from '../src/modules/events/events.controller';
import { EventsService } from '../src/modules/events/events.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import { UserRoleValues } from '../src/database/schema';
import { AuthenticatedUser } from '../src/modules/auth/interfaces/authenticated-user.interface';

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

describe('Organizer isolation (HTTP)', () => {
  let app: INestApplication;
  let eventsService: {
    list: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    create: jest.Mock;
    stats: jest.Mock;
    recent: jest.Mock;
  };

  beforeEach(async () => {
    eventsService = {
      list: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      stats: jest.fn(),
      recent: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: eventsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: {
          switchToHttp: () => { getRequest: () => { user?: AuthenticatedUser; headers: Record<string, string> } };
        }) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = req.headers['x-test-user']
            ? JSON.parse(req.headers['x-test-user'])
            : undefined;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(
      (
        req: { headers: Record<string, string>; user?: AuthenticatedUser },
        _res: unknown,
        next: () => void,
      ) => {
        if (req.headers['x-test-user']) {
          req.user = JSON.parse(req.headers['x-test-user']);
        }
        next();
      },
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  function asOrganizer(user: AuthenticatedUser) {
    return { 'x-test-user': JSON.stringify(user) };
  }

  beforeEach(() => {
    eventsService.list.mockImplementation((_query, user?: AuthenticatedUser) => {
      if (user?.role === UserRoleValues.ORGANIZER && user.sub !== ORGANIZER_A_ID) {
        return {
          data: [],
          meta: { pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } },
        };
      }
      if (user?.sub === ORGANIZER_A_ID) {
        return {
          data: [{ id: EVENT_A_ID, title: 'Event A' }],
          meta: { pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 } },
        };
      }
      return {
        data: [],
        meta: { pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 } },
      };
    });

    eventsService.findOne.mockImplementation((id: string, user?: AuthenticatedUser) => {
      if (id !== EVENT_A_ID) {
        throw new NotFoundException('Event not found');
      }
      if (user?.role === UserRoleValues.ORGANIZER && user.sub !== ORGANIZER_A_ID) {
        throw new NotFoundException('Event not found');
      }
      return { id: EVENT_A_ID, title: 'Event A' };
    });

    eventsService.update.mockImplementation((id: string, user: AuthenticatedUser) => {
      if (user.sub !== ORGANIZER_A_ID) {
        throw new NotFoundException('Event not found');
      }
      return { id, title: 'Updated' };
    });

    eventsService.remove.mockImplementation((_id: string, user: AuthenticatedUser) => {
      if (user.sub !== ORGANIZER_A_ID) {
        throw new NotFoundException('Event not found');
      }
      return { message: 'Event deleted' };
    });
  });

  it('Organizer B cannot list Organizer A events', async () => {
    const res = await request(app.getHttpServer())
      .get('/events')
      .set(asOrganizer(organizerB));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('Organizer A can list own events', async () => {
    const res = await request(app.getHttpServer())
      .get('/events')
      .set(asOrganizer(organizerA));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(EVENT_A_ID);
  });

  it('Organizer B gets 404 fetching Organizer A event by ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/events/${EVENT_A_ID}`)
      .set(asOrganizer(organizerB));

    expect(res.status).toBe(404);
  });

  it('Organizer B gets 404 updating Organizer A event', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/events/${EVENT_A_ID}`)
      .set(asOrganizer(organizerB))
      .send({ title: 'Hijacked' });

    expect(res.status).toBe(404);
  });

  it('Organizer B gets 404 deleting Organizer A event', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/events/${EVENT_A_ID}`)
      .set(asOrganizer(organizerB));

    expect(res.status).toBe(404);
  });

  it('Organizer A can fetch own event by ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/events/${EVENT_A_ID}`)
      .set(asOrganizer(organizerA));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(EVENT_A_ID);
  });
});
