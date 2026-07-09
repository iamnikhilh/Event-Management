import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../../common/constants/metadata.constants';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const mockContext = (isPublic: boolean): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      return undefined;
    });
  });

  it('allows public routes without a user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const user = guard.handleRequest(
      new UnauthorizedException(),
      false,
      undefined,
      mockContext(true),
    );

    expect(user).toBeUndefined();
  });

  it('returns user on public routes when token is valid', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const authenticated = { sub: 'user-id', email: 'a@example.com', role: 'organizer' };

    const user = guard.handleRequest(
      null,
      authenticated,
      undefined,
      mockContext(true),
    );

    expect(user).toEqual(authenticated);
  });

  it('throws on protected routes without a user', () => {
    expect(() =>
      guard.handleRequest(
        new UnauthorizedException(),
        false,
        undefined,
        mockContext(false),
      ),
    ).toThrow(UnauthorizedException);
  });
});
