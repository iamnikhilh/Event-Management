import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Res,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { SkipResponseEnvelope } from '../../common/decorators/skip-response-envelope.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AttendeesService } from './attendees.service';
import { RegisterAttendeeDto } from './dto/register-attendee.dto';
import { CheckInDto } from './dto/check-in.dto';
import { ListAttendeesDto } from './dto/list-attendees.dto';
import { UpdateAttendeeDto } from './dto/update-attendee.dto';

@ApiTags('attendees')
@Controller('events/:eventId')
export class AttendeesController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Post('register')
  @Public()
  @ResponseMessage('Registration successful')
  register(
    @Param('eventId') eventId: string,
    @Body() dto: RegisterAttendeeDto,
    @CurrentUser('sub') userId?: string,
  ) {
    return this.attendeesService.register(eventId, userId || null, dto);
  }

  @Get('attendees')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizer')
  @ResponseMessage('Attendees retrieved successfully')
  findAll(
    @Param('eventId') eventId: string,
    @Query() query: ListAttendeesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendeesService.findAllByEvent(eventId, query, user);
  }

  @Get('attendees/export')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizer')
  @SkipResponseEnvelope()
  @HttpCode(200)
  async exportCsv(
    @Param('eventId') eventId: string,
    @Res() res: Response,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const csv = await this.attendeesService.exportCsv(eventId, user);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="attendees-${eventId}.csv"`,
    });
    res.send(csv);
  }

  @Get('attendees/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizer')
  @ResponseMessage('Attendee retrieved successfully')
  findOne(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendeesService.findOne(id, eventId, user);
  }

  @Patch('attendees/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizer')
  @ResponseMessage('Attendee updated successfully')
  update(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAttendeeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendeesService.update(id, eventId, dto, user);
  }

  @Delete('attendees/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizer')
  @ResponseMessage('Attendee deleted successfully')
  remove(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendeesService.remove(id, eventId, user);
  }

  @Post('check-in')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizer')
  @ResponseMessage('Check-in successful')
  checkIn(
    @Param('eventId') eventId: string,
    @Body() dto: CheckInDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendeesService.checkIn(dto.qrCode, eventId, user);
  }
}
