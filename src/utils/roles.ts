import { Response } from 'express';

import { ENV } from './env';

type IsRolesValidParams = {
  defaultRole: string;
  allowedRoles: string[];
  res: Response;
};

export const isRolesValid = async ({
  defaultRole,
  allowedRoles,
  res,
}: IsRolesValidParams): Promise<boolean> => {
  if (!allowedRoles.includes(defaultRole)) {
    res.boom.badRequest('Default role must be part of allowed roles');
    return false;
  }

  // check if allowedRoles is a subset of allowed user roles
  if (
    !allowedRoles.every((role: string) => {
      return ENV.AUTH_ALLOWED_USER_ROLES.includes(role);
    })
  ) {
    res.boom.badRequest('Allowed roles must be a subset of allowedRoles');
    return false;
  }

  return true;
};
