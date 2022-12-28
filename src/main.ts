import { AppModule } from './app.module';
import { ApiCreation } from '@proguidemc/http-module';

ApiCreation(AppModule, __dirname, {excludeTestFeatures: true});