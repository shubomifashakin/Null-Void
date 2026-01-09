import { SetMetadata } from '@nestjs/common';
import { Roles as PrismaRoles } from 'generated/prisma/enums';

export const ROLE_KEY = 'roles';
export const Roles = (...roles: PrismaRoles[]) => SetMetadata(ROLE_KEY, roles);
