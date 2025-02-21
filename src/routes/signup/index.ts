import { Router } from 'express';
import { createValidator } from 'express-joi-validation';

import { asyncWrapper as aw } from '@/helpers';
import { signUpEmailPasswordHandler } from './email-password';
import { signUpEmailPasswordSchema } from '@/validation';

const router = Router();

router.post(
  '/signup/email-password',
  createValidator().body(signUpEmailPasswordSchema),
  aw(signUpEmailPasswordHandler)
);

// WARNING: alias route for `/signin/magic-link`
// router.post(
//   '/signup/magic-link',
//   createValidator().body(signInMagicLinkSchema),
//   aw(signInMagicLinkHandler)
// );

const signUpRouter = router;
export { signUpRouter };
