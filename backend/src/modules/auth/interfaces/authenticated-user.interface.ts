import { UserRole } from '../../../database/schema';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}
