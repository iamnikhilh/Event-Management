import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { PublicService } from './public.service';
import { ListPublicEventsDto } from './dto/list-public-events.dto';

@ApiTags('public')
@Controller('public/events')
@Public()
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get()
  @ResponseMessage('Public events retrieved successfully')
  findAll(@Query() query: ListPublicEventsDto) {
    return this.publicService.findAllPublicEvents(query);
  }

  @Get(':slug')
  @ResponseMessage('Event details retrieved successfully')
  findBySlug(@Param('slug') slug: string) {
    return this.publicService.findPublicEventBySlug(slug);
  }
}
