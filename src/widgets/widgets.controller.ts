import { Controller, Get, UseGuards, HttpStatus, Res, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HttpResponse, ApiException } from '@proguidemc/http-module';
import { CartService } from '../carrito/cart.service';

@ApiTags("Widgets")
@UseGuards(AuthGuard('jwt'))    
@Controller('widgets')
export class WidgetsController {
    constructor(private cartService: CartService) { }

    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,
    ) {
        await this.getWidget("devoluciones")
        await this.getWidget("fases")
        await this.getWidget("finalizados")
        await this.getWidget("rechazos")
        await this.getWidget("totales")
        await this.getWidget("presupuesto")
        res.send({status: "OK"});
    }

    @Get(':type')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener widget', operationId: 'widget' })
    async getWidget(
        @Param("type") type: 'totales' | 'finalizados' | 'fases' | 'devoluciones' | 'rechazos' | 'presupuesto' | '',
        @Res() res?: HttpResponse,
        
    ) {
        let info: any;

        switch (type) {
            case 'totales': 
                info = await this.cartService.getCarritosTotales()
                res?.status(200).send(info);
                break;
            case 'finalizados':
                info = [
                    {
                        color: '#365CDF',
                        value: 125,
                        caption: 'Finalizados',
                        props: [
                            {
                                name: 'caption',
                                value: 'FINALIZADOS'
                            },{
                                name: 'count',
                                value: '12,5%'
                            },{
                                name: 'type',
                                value: 'donut'
                            },{
                                name: 'legend',
                                value: 'none'
                            },
                            
                        ]
                    },{
                        color: '#E7E7E7',
                        value: 1000,
                        caption: 'No Finalizados',
                    }
                ];
                res?.status(200).send(info);
                break;
            case 'devoluciones':
                info = {
                    color: 'secondary',
                    count: '812',
                    caption: 'Devoluciones',
                };
                res?.status(200).send(info);
                break;
            case 'rechazos':
                info = {
                    alpha: 0.7,
                    color: 'secondary',
                    count: '495',
                    caption: 'Rechazos',
                }
                res?.status(200).send(info);
                break;
            case 'presupuesto':
                info = {
                    alpha: 0.3,
                    color: 'secondary',
                    count: '147.209',
                    prefix: 'USD',
                    caption: 'Presupuesto',
                    title: 'Presupuesto de carritos activos',
                };
                res?.status(200).send(info);
                break;
            case 'fases': 
                info = await this.cartService.getCarritosPorFase('header');
                res?.status(200).send(info);
                break;
            default: 
                res?.status(500).send({messahe: 'Invalid Request'});    
                break;
        }
        return info;
    }
}
