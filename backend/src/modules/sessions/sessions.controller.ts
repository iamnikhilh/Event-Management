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

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('events/:eventId/sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @Roles('admin', 'organizer')
  @ResponseMessage('Session created successfully')
  create(@Param('eventId') eventId: string, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(eventId, dto);
  }

  @Get()
  @Roles('admin', 'organizer', 'attendee')
  @ResponseMessage('Sessions retrieved successfully')
  findAll(@Param('eventId') eventId: string) {
    return this.sessionsService.findAllByEvent(eventId);
  }

  @Get(':id')
  @Roles('admin', 'organizer', 'attendee')
  @ResponseMessage('Session retrieved successfully')
  findOne(@Param('eventId') eventId: string, @Param('id') id: string) {
    return this.sessionsService.findOne(eventId, id);
  }

  @Patch(':id')
  @Roles('admin', 'organizer')
  @ResponseMessage('Session updated successfully')
  update(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.sessionsService.update(eventId, id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'organizer')
  @ResponseMessage('Session deleted successfully')
  remove(@Param('eventId') eventId: string, @Param('id') id: string) {
    return this.sessionsService.remove(eventId, id);
  }
}
