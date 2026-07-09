import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SponsorsService } from './sponsors.service';
import { CreateSponsorDto } from './dto/create-sponsor.dto';
import { UpdateSponsorDto } from './dto/update-sponsor.dto';

@ApiTags('sponsors')
@ApiBearerAuth()
@Controller('events/:eventId/sponsors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  @Post()
  @Roles('admin', 'organizer')
  @ResponseMessage('Sponsor created successfully')
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateSponsorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sponsorsService.create(eventId, dto, user);
  }

  @Get()
  @Roles('admin', 'organizer', 'attendee')
  @ResponseMessage('Sponsors retrieved successfully')
  findAll(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sponsorsService.findAllByEvent(eventId, user);
  }

  @Get(':id')
  @Roles('admin', 'organizer', 'attendee')
  @ResponseMessage('Sponsor retrieved successfully')
  findOne(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sponsorsService.findOne(eventId, id, user);
  }

  @Patch(':id')
  @Roles('admin', 'organizer')
  @ResponseMessage('Sponsor updated successfully')
  update(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSponsorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sponsorsService.update(eventId, id, dto, user);
  }

  @Delete(':id')
  @Roles('admin', 'organizer')
  @ResponseMessage('Sponsor deleted successfully')
  remove(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sponsorsService.remove(eventId, id, user);
  }
}
