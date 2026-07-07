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
  create(@Body() dto: CreateSpeakerDto) {
    return this.speakersService.create(dto);
  }

  @Get()
  @Roles('admin', 'organizer', 'attendee')
  @ResponseMessage('Speakers retrieved successfully')
  findAll() {
    return this.speakersService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'organizer', 'attendee')
  @ResponseMessage('Speaker retrieved successfully')
  findOne(@Param('id') id: string) {
    return this.speakersService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'organizer')
  @ResponseMessage('Speaker updated successfully')
  update(@Param('id') id: string, @Body() dto: UpdateSpeakerDto) {
    return this.speakersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'organizer')
  @ResponseMessage('Speaker deleted successfully')
  remove(@Param('id') id: string) {
    return this.speakersService.remove(id);
  }
}
