import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      service: 'food-waste-api',
      status: 'ok',
      message:
        'Food Waste Management API foundation is running and ready for the next implementation phases.',
    };
  }
}
