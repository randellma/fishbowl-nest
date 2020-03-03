import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

class AppServiceMock {
  createNewGame(any): string {
    return "gameId";
  }
}

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const AppServiceProvider = {
      provide: AppService,
      useClass: AppServiceMock,
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppServiceProvider],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  test('root returns a new game id', () => {
    expect(appController.get()).toBe('gameId');
  });
});
