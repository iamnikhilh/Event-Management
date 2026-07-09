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
import { SpeakersService } from './speakers.service';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';

@ApiTags('speakers')
@ApiBearerAuth()
@Controller('speakers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  @Post()
  @Roles('admin', 'organizer')
  @ResponseMessage('Speaker created successfully')
  create(
    @Body() dto: CreateSpeakerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.speakersService.create(dto, user);
  }

  @Get()
  @Roles('admin', 'organizer')
  @ResponseMessage('Speakers retrieved successfully')
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.speakersService.findAll(user);
  }

  @Get(':id')
  @Roles('admin', 'organizer')
  @ResponseMessage('Speaker retrieved successfully')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.speakersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('admin', 'organizer')
  @ResponseMessage('Speaker updated successfully')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSpeakerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.speakersService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('admin', 'organizer')
  @ResponseMessage('Speaker deleted successfully')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.speakersService.remove(id, user);
  }
}
