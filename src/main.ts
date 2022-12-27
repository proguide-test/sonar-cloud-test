import { AppModule } from './app.module';
import { ApiCreation } from '@proguidemc/http-module';
import { testIsRunning } from './shared/utils/utils';

ApiCreation(AppModule, __dirname, {excludeTestFeatures: testIsRunning()});