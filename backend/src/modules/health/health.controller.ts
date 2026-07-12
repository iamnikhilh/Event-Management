import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { SkipResponseEnvelope } from '../../common/decorators/skip-response-envelope.decorator';

@ApiTags('health')
@Controller('health')
@Public()
export class HealthController {
  @Get()
  @SkipResponseEnvelope()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
