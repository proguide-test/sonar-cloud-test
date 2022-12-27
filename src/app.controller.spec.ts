
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { CartModule } from './carrito/cart.module';
import { CartController } from './carrito/cart.controller';
import { PalletModule } from './pallet/pallet.module';
import { PalletController } from './pallet/pallet.controller';
import { VehiculoController } from './shared/vehiculo/vehiculo.controller';
import { VehiculoModule } from './shared/vehiculo/vehiculo.module';
import { PlanillaDespachoController } from './planilladespacho/planilladespacho.controller';
import { PlanillaDespachoService } from './planilladespacho/planilladespacho.service';
import { UserConfigService } from './shared/userconfig/userconfig.service';
import { ChoferService } from './shared/chofer/chofer.service';
import { OperadorLogicoService } from './shared/operadorlogico/operadorlogico.service';
import { PlanillaDespachoEstadoService } from './planilladespacho/planilladespachoestado.service';
import { PlanillaRecepcionService } from './planillarecepcion/planillarecepcion.service';
import { LugarService } from './shared/lugar/lugar.service';
import { NotificationModule } from '@proguidemc/notification-module';
import { PlanillaRecepcionEstadoService } from './planillarecepcion/planillarecepcionestado.service';
import { NotificationConfigService } from './shared/notification-config/notification-config.service';
import { StockInterplantaService } from './shared/legacy/services/stockinterplanta.service';
import { LugarTipoService } from './shared/lugar/lugartipo.service';
import { StockMovService } from './stockmov/stockmov.service';
import { StockMovTipoService } from './stockmov/stockmovtipo.service';
import { features } from '../test/features';

describe('App Controller', () => {
  let app: INestApplication;  
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
        imports: [AppModule, HttpModule, CartModule, PalletModule, VehiculoModule, NotificationModule],
        controllers: [AppController, CartController, PalletController, VehiculoController, PlanillaDespachoController],
        providers: [AppService, 
            PlanillaDespachoService, 
            UserConfigService, 
            ChoferService,
            OperadorLogicoService,
            PlanillaDespachoEstadoService,
            PlanillaRecepcionService,
            PlanillaRecepcionEstadoService,
            LugarService,
            NotificationConfigService,
            StockInterplantaService,
            LugarTipoService,
            StockMovService,
            StockMovTipoService,
        ],
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
  