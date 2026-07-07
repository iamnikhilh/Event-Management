import { Module } from '@nestjs/common';

import { AttendeesController } from './attendees.controller';
import { AttendeesService } from './attendees.service';
import { TicketTypesModule } from '../ticket-types/ticket-types.module';

@Module({
  imports: [TicketTypesModule],
  controllers: [AttendeesController],
  providers: [AttendeesService],
  exports: [AttendeesService],
})
export class AttendeesModule {}
