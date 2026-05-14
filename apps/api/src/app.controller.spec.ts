import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the API status payload', () => {
      expect(appController.getStatus()).toEqual({
        service: 'food-waste-api',
        status: 'ok',
        message:
          'Food Waste Management API foundation is running and ready for the next implementation phases.',
      });
    });
  });
});
