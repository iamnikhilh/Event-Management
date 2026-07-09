import { Global, Module } from '@nestjs/common';

import { OrganizerScopeService } from './services/organizer-scope.service';

@Global()
@Module({
  providers: [OrganizerScopeService],
  exports: [OrganizerScopeService],
})
export class CommonModule {}
