import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('events/:eventId')
  @Roles('admin', 'organizer')
  @ResponseMessage('Event analytics retrieved successfully')
  getEventAnalytics(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.analyticsService.getEventAnalytics(eventId, user);
  }

  @Get('overview')
  @Roles('admin', 'organizer')
  @ResponseMessage('Overview analytics retrieved successfully')
  getOverviewAnalytics(@CurrentUser() user: AuthenticatedUser) {
    return this.analyticsService.getOverviewAnalytics(user);
  }
}
