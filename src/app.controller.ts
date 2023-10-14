import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/mail-parser')
  getParseMail(@Query('url') queryParams: string) {
    return this.appService.parseEmail(queryParams);
  }
}
