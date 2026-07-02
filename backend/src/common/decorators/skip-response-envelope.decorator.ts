import { SetMetadata } from '@nestjs/common';

import { SKIP_RESPONSE_ENVELOPE_KEY } from '../constants/metadata.constants';

export const SkipResponseEnvelope = (): MethodDecorator & ClassDecorator =>
  SetMetadata(SKIP_RESPONSE_ENVELOPE_KEY, true);
