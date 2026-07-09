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
import { TicketTypesService } from './ticket-types.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';

@ApiTags('ticket-types')
@ApiBearerAuth()
@Controller('events/:eventId/ticket-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketTypesController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  @Post()
  @Roles('admin', 'organizer')
  @ResponseMessage('Ticket type created successfully')
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateTicketTypeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketTypesService.create(eventId, dto, user);
  }

  @Get()
  @Roles('admin', 'organizer', 'attendee')
  @ResponseMessage('Ticket types retrieved successfully')
  findAll(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketTypesService.findAllByEvent(eventId, user);
  }

  @Patch(':id')
  @Roles('admin', 'organizer')
  @ResponseMessage('Ticket type updated successfully')
  update(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTicketTypeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketTypesService.update(eventId, id, dto, user);
  }

  @Delete(':id')
  @Roles('admin', 'organizer')
  @ResponseMessage('Ticket type deleted successfully')
  remove(
    @Param('eventId') eventId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketTypesService.remove(eventId, id, user);
  }
}
