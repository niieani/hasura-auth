import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  ContainerTypes,
  ValidatedRequest,
  ValidatedRequestSchema,
} from 'express-joi-validation';

import { emailClient } from '@/email';
import { getUserByEmail, isValidRedirectTo } from '@/helpers';
import { gqlSdk } from '@/utils/gqlSDK';
import { generateTicketExpiresAt } from '@/utils/ticket';
import { ENV } from '@/utils/env';

type BodyType = {
  email: string;
  options?: {
    redirectTo?: string;
  };
};

interface Schema extends ValidatedRequestSchema {
  [ContainerTypes.Body]: BodyType;
}

export const userPasswordResetHandler = async (
  req: ValidatedRequest<Schema>,
  res: Response
): Promise<unknown> => {
  const { email, options } = req.body;

  // check if redirectTo is valid
  const redirectTo = options?.redirectTo ?? ENV.AUTH_CLIENT_URL;
  if (!isValidRedirectTo({ redirectTo })) {
    return res.boom.badRequest(`'redirectTo' is not allowed`);
  }

  const user = await getUserByEmail(email);

  if (!user || user.disabled) {
    return res.boom.badRequest('No user with such email exists');
  }

  const ticket = `passwordReset:${uuidv4()}`;
  const ticketExpiresAt = generateTicketExpiresAt(60 * 60); // 1 hour

  await gqlSdk.updateUser({
    id: user.id,
    user: {
      ticket,
      ticketExpiresAt,
    },
  });

  const template = 'password-reset';
  await emailClient.send({
    template,
    locals: {
      ticket,
      redirectTo,
      locale: user.locale,
      displayName: user.displayName,
      serverUrl: ENV.AUTH_SERVER_URL,
      clientUrl: ENV.AUTH_CLIENT_URL,
    },
    message: {
      to: email,
      headers: {
        'x-ticket': {
          prepared: true,
          value: ticket as string,
        },
        'x-redirect-to': {
          prepared: true,
          value: redirectTo,
        },
        'x-email-template': {
          prepared: true,
          value: template,
        },
      },
    },
  });

  return res.send('OK');
};
