
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { features } from '../test/features';

describe('App Controller', () => {
  let app: INestApplication;  
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
        imports: [AppModule, HttpModule],
        controllers: [AppController],
        providers: [AppService],
    })
        .compile();        
    app = moduleRef.createNestApplication();
    
    await app.init();
  });

  afterAll(async () => {
    
    await app.close();
  })

  describe('App Controller', () => {
    const items = features(() => {return app;});
    items.forEach(item => {
      const name = item.name
      .replace("/GET", "")
      .replace("/POST", "")
      .replace("/PUT", "")
      .replace("/DELETE", "")
      .trim();
      if (item.name.includes("test-jest") || (!name.startsWith("/product") && !name.startsWith("/cart"))) {
        it(item.name, item.function);
      }
    });
  });

})
  