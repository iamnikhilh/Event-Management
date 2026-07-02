import { SetMetadata } from '@nestjs/common';

import { RESPONSE_MESSAGE_KEY } from '../constants/metadata.constants';

export const ResponseMessage = (
  message: string,
): MethodDecorator & ClassDecorator =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);
