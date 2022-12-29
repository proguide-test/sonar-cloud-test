
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import request from "supertest";

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
    it("login", (done) => {
      request(app.getHttpServer())
      .post("/login")
      .send({
        username: "mborgo",
        password: "mborgo"
      })
      .end((err, response) => {
        if (response.status >= 400) {
          return done({message: response.text});
        }

        if (err) {
          return done(err);
        }

        done();        
      });
    })
  });

})
  