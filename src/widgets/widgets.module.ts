import { Module } from '@nestjs/common';
import { WidgetsController } from './widgets.controller';
import { HttpModule } from '@nestjs/axios';
import { CartModule } from '../carrito/cart.module';

@Module({
  imports: [
    HttpModule, 
    CartModule 
  ],
  controllers: [
    WidgetsController
  ],
  providers: [
  ],
})
export class WidgetsModule { }
