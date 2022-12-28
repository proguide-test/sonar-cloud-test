import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, MainModule, HttpErrorFilter, DBName } from '@proguidemc/http-module';
import { HttpModule } from '@nestjs/axios';


@Module({
  imports: [    
    HttpModule,
    ConfigModule.setDatabase(DBName.ShoppingManager)
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpErrorFilter,
    }],
})

export class AppModule extends MainModule {}
