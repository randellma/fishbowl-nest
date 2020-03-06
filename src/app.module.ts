import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameData } from './data/Game.data';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, GameData],
})
export class AppModule { }
