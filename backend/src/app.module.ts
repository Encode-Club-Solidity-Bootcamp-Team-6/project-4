import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      // any configuration we might go here
      isGlobal: true, // makes ConfigModule global
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
