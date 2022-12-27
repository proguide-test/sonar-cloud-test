import { Controller, Get, UseGuards, HttpStatus, Res, Req, Param, Post, Body, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductService } from './producto.service';
import { ApiException, HttpRequest, HttpResponse } from '@proguidemc/http-module';
import { Product } from './model/producto.model'
import { ArrayComplexList, ArrayList, basicNormalizeItems, convertImages, errorFn, hasCustomPermission, testIsRunning, uploadFile } from '../shared/utils/utils';

@ApiTags("Materiales")
@Controller('product')
export class ProductController {
    constructor(private productService: ProductService) { 
        productService.synchronize();
    }

    @UseGuards(AuthGuard('jwt'))  
    @Get('test-jest')
    async testJest(
        @Res() res: HttpResponse,
        @Req() req: HttpRequest, 
    ) {
        const run = async () => {
            basicNormalizeItems([{image: '{app}/test.png', codigosap: 'test', name: 'test'}], true);
            testIsRunning();
            hasCustomPermission(req.user, 'planillas de despacho', 'include-all');
            
            const array = new ArrayComplexList();
            array.push('test', 'test');
            array.get();
            array.getItems('test');
            array.count();
            array.countItems('test');

            const array1 = new ArrayList();
            array1.push('test');
            array1.get();
            array1.count();
            array1.concat(array1);
            
            const producto = await this.productService.insertProduct({
                codigosap: 'test',
            }, req.user.userId).catch(errorFn);

            convertImages('test/image.png', true)
            convertImages('test/image.png', false)
                        
            if (producto) {
                this.productService.synchronize(0, [{
                    codigosap: 'test',
                    name: 'test',
                    codigotruck: 'test',
                    centros: '',
                    tipomaterial: 'test',
                    cantidadumb: 0,
                    grupo: 'test',
                    gruponombre: 'test',
                    marca: 'test',
                    marcanombre: 'test',
                    negocio: '',
                    sabortruck: '',
                    saborpla: '',
                    liqmadre: '',
                    marcavar: '',
                    marcavarnombre: '',
                    unidadumb: '', 
                  },{
                    codigosap: 'test1',
                    name: 'test',
                    codigotruck: 'test',
                    centros: '',
                    tipomaterial: 'Z008',
                    cantidadumb: 0,
                    grupo: '082302',
                    gruponombre: 'INTERIOR FURNITURE',
                    marca: '0000',
                    marcanombre: 'NO VALUE',
                    negocio: '',
                    sabortruck: '',
                    saborpla: '',
                    liqmadre: '',
                    marcavar: '',
                    marcavarnombre: '',
                    unidadumb: '', 
                  }]);
                await this.productService.updateProduct(producto, req.user.userId).catch(errorFn);
                await this.productService.defineNomenclador(producto);
                await this.productService.generateExcel('none', req.user.username, res, producto);
            } else {
                res.send(req.user);
            }
        }

        await run();

    }

    @Get('/download/:caseId/:userName')
    async downloadPDF(
        @Res() res: HttpResponse,
        @Param("caseId") caseId: string,
        @Param("userName") userName: string
    ) {    
        await this.productService.generateExcel(caseId, userName, res);        
    }

    @UseGuards(AuthGuard('jwt'))    
    @Get('')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener lista de productos.', operationId: 'lista-product' })
    async GetProducts(
        @Query('full') full: boolean,
        @Res() res: HttpResponse,
    ) {
        const products = full ? await this.productService.findAllConvert({}) :  await this.productService.findAll({});
        res.send(products.map(item => {
            item.imagenes = convertImages(item.imagenes, false);                
            return item;
        }));        
    }

    @UseGuards(AuthGuard('jwt'))    
    @Post('')
    @ApiResponse({ status: HttpStatus.CREATED})
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    async register(
        @Body() body: Product,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest
    ) {
        if (Object.keys(body).length <= 1) return res.status(500).send({message: 'Invalid Request'});

        if (body?.imagenes) {
            body.imagenes = convertImages(body.imagenes, true);            
        }
        
        if (body.id) {
            this.productService.updateProduct(body, req.user?.userId)
            .then(resp => {
                res.send(resp);
            })
            .catch(err => {
                res.status(500).send(err);
            })
        } else {
            this.productService.insertProduct(body, req.user?.userId)
            .then(resp => {
                res.send(resp);
            })
            .catch(err => {
                res.status(err.status ? err.status : 500).send(err.res);
            })
        }
    }

    @UseGuards(AuthGuard('jwt'))    
    @Get(':id')
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, type: ApiException })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, type: ApiException })
    @ApiOperation({ summary: 'Obtener producto por id.', operationId: 'product' })
    async GetProduct(
        @Param("id") id: string,
        @Query('full') full: boolean,
        @Query('fromsap') fromsap: boolean,
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        const product = await this.productService.findOneConvert(id, req.user?.username, full, undefined, fromsap);
        if (product?.imagenes) {
            product.imagenes = convertImages(product.imagenes, false);
        }
        if (product) return res.status(HttpStatus.OK).send(product);        
        res.status(HttpStatus.NOT_FOUND).send({message: 'No se encontro el material'});
    }

    @UseGuards(AuthGuard('jwt'))    
    @Post('images')
    async uploadImages(        
        @Query("maxsize") size: number,
        @Query("withname") withname: string,        
        @Query("withinfo") withinfo: string,        
        @Res() res: HttpResponse,
        @Req() req: HttpRequest,
    ) {
        uploadFile(req, res, "productos", size, {withname, withinfo});           
    }

}
