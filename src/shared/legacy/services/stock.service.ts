import { Injectable } from '@nestjs/common';
import { StockConsultaService } from './stockconsulta.service';
import { StockInterplantaService } from './stockinterplanta.service';
import { StockReservaService } from './stockreserva.service';

@Injectable()
export class StockService {
  constructor(
    public stockConsultaService: StockConsultaService,
    public stockReservaService: StockReservaService,
    public stockInterplantaService: StockInterplantaService,    
  ){}
}
