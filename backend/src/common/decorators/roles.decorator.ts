import { SetMetadata } from '@nestjs/common';

import { ROLES_KEY } from '../constants/metadata.constants';
import { UserRole } from '../../database/schema';

export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
