
import {basicpost,basicget,basicput,basicdelete, FunctionTestApp}  from "@proguidemc/http-module";

export interface TestEndpoint {
  name: string,
  function: (done: any) => void,
}

export const features = (onApp: FunctionTestApp): TestEndpoint[] => {
  return [

    {
        name: "/POST /login",
        function: (done) => {
          
          basicpost(onApp, done, "/login", {});
        }
      },
    {
        name: "/GET /company",
        function: (done) => {
          
          basicget(onApp, done, "/company", {});
        }
      },
    {
        name: "/POST /case",
        function: (done) => {
          
          basicpost(onApp, done, "/case", {});
        }
      },
    {
        name: "/PUT /case",
        function: (done) => {
          
          basicput(onApp, done, "/case", {});
        }
      },
    {
        name: "/DELETE /case/{processKey}/{id}",
        function: (done) => {
          const _fid: string = "none";
      const _fprocessKey: string = "none";
      
          basicdelete(onApp, done, "/case/"+_fprocessKey+"/"+_fid+"", {});
        }
      },
    {
        name: "/GET /",
        function: (done) => {
          
          basicget(onApp, done, "/", {});
        }
      },
    {
        name: "/GET /test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/test-jest", {});
        }
      },
    {
        name: "/GET /upload/{folder}/{name}",
        function: (done) => {
          const _ffolder: string = "none";
      const _fname: string = "none";
      const _fdownload: boolean = false;
      
          basicget(onApp, done, "/upload/"+_ffolder+"/"+_fname+"?download="+_fdownload+"", {});
        }
      },
    {
        name: "/GET /anio",
        function: (done) => {
          const _fcount: number = 0;
      const _freverse: boolean = false;
      
          basicget(onApp, done, "/anio?count="+_fcount+"&reverse="+_freverse+"", {});
        }
      },
    {
        name: "/GET /template-test/{email}",
        function: (done) => {
          const _femail: string = "none";
      
          basicget(onApp, done, "/template-test/"+_femail+"", {});
        }
      },
    {
        name: "/GET /load-xlsx-data/{name}",
        function: (done) => {
          const _fname: string = "none";
      const _fnextid: boolean = false;
      
          basicget(onApp, done, "/load-xlsx-data/"+_fname+"?nextid="+_fnextid+"", {});
        }
      },
    {
        name: "/GET /generate-csv/{name}",
        function: (done) => {
          const _fname: string = "none";
      
          basicget(onApp, done, "/generate-csv/"+_fname+"", {});
        }
      },
    {
        name: "/GET /authentication/{type}/{id}",
        function: (done) => {
          const _fid: string = "none";
      const _ftype: string = "none";
      
          basicget(onApp, done, "/authentication/"+_ftype+"/"+_fid+"", {});
        }
      },
    {
        name: "/GET /auth/{type}/{id}/{keytoken}",
        function: (done) => {
          const _fid: string = "none";
      const _ftype: string = "none";
      const _fkeytoken: string = "none";
      
          basicget(onApp, done, "/auth/"+_ftype+"/"+_fid+"/"+_fkeytoken+"", {});
        }
      },
    {
        name: "/GET /marca",
        function: (done) => {
          
          basicget(onApp, done, "/marca", {});
        }
      },
    {
        name: "/GET /marca/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/marca/"+_fid+"", {});
        }
      },
    {
        name: "/GET /grupo",
        function: (done) => {
          
          basicget(onApp, done, "/grupo", {});
        }
      },
    {
        name: "/GET /grupo/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/grupo/"+_fid+"", {});
        }
      },
    {
        name: "/GET /canal",
        function: (done) => {
          
          basicget(onApp, done, "/canal", {});
        }
      },
    {
        name: "/GET /canal/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/canal/"+_fid+"", {});
        }
      },
    {
        name: "/GET /categoria",
        function: (done) => {
          
          basicget(onApp, done, "/categoria", {});
        }
      },
    {
        name: "/GET /categoria/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/categoria/"+_fid+"", {});
        }
      },
    {
        name: "/GET /tipomaterial",
        function: (done) => {
          
          basicget(onApp, done, "/tipomaterial", {});
        }
      },
    {
        name: "/GET /tipomaterial/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/tipomaterial/"+_fid+"", {});
        }
      },
    {
        name: "/GET /tipoprecio",
        function: (done) => {
          
          basicget(onApp, done, "/tipoprecio", {});
        }
      },
    {
        name: "/GET /idioma",
        function: (done) => {
          
          basicget(onApp, done, "/idioma", {});
        }
      },
    {
        name: "/GET /pais",
        function: (done) => {
          
          basicget(onApp, done, "/pais", {});
        }
      },
    {
        name: "/GET /pais/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/pais/"+_fid+"", {});
        }
      },
    {
        name: "/GET /ubicacion",
        function: (done) => {
          
          basicget(onApp, done, "/ubicacion", {});
        }
      },
    {
        name: "/GET /materialidad",
        function: (done) => {
          
          basicget(onApp, done, "/materialidad", {});
        }
      },
    {
        name: "/GET /materialidad/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/materialidad/"+_fid+"", {});
        }
      },
    {
        name: "/GET /almacen",
        function: (done) => {
          const _fcentroid: string = "none";
      
          basicget(onApp, done, "/almacen?centroid="+_fcentroid+"", {});
        }
      },
    {
        name: "/GET /almacen/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/almacen/"+_fid+"", {});
        }
      },
    {
        name: "/GET /campania",
        function: (done) => {
          
          basicget(onApp, done, "/campania", {});
        }
      },
    {
        name: "/GET /plan",
        function: (done) => {
          
          basicget(onApp, done, "/plan", {});
        }
      },
    {
        name: "/GET /plan/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/plan/"+_fid+"", {});
        }
      },
    {
        name: "/GET /centrocosto",
        function: (done) => {
          
          basicget(onApp, done, "/centrocosto", {});
        }
      },
    {
        name: "/GET /cuenta",
        function: (done) => {
          
          basicget(onApp, done, "/cuenta", {});
        }
      },
    {
        name: "/GET /estrategia",
        function: (done) => {
          
          basicget(onApp, done, "/estrategia", {});
        }
      },
    {
        name: "/GET /estrategia/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/estrategia/"+_fid+"", {});
        }
      },
    {
        name: "/GET /region",
        function: (done) => {
          const _fregionid: string = "none";
      
          basicget(onApp, done, "/region?regionid="+_fregionid+"", {});
        }
      },
    {
        name: "/GET /region/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/region/"+_fid+"", {});
        }
      },
    {
        name: "/GET /estadodistribucion",
        function: (done) => {
          
          basicget(onApp, done, "/estadodistribucion", {});
        }
      },
    {
        name: "/GET /estadodistribucion/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/estadodistribucion/"+_fid+"", {});
        }
      },
    {
        name: "/GET /centrodistribucion",
        function: (done) => {
          const _fregionid: string = "none";
      
          basicget(onApp, done, "/centrodistribucion?regionid="+_fregionid+"", {});
        }
      },
    {
        name: "/GET /centrodistribucion/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/centrodistribucion/"+_fid+"", {});
        }
      },
    {
        name: "/GET /distribuidor",
        function: (done) => {
          const _fregionid: string = "none";
      
          basicget(onApp, done, "/distribuidor?regionid="+_fregionid+"", {});
        }
      },
    {
        name: "/GET /distribuidor/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/distribuidor/"+_fid+"", {});
        }
      },
    {
        name: "/POST /puntodeventa",
        function: (done) => {
          
          basicpost(onApp, done, "/puntodeventa", {});
        }
      },
    {
        name: "/PUT /puntodeventa",
        function: (done) => {
          
          basicput(onApp, done, "/puntodeventa", {});
        }
      },
    {
        name: "/GET /puntodeventa",
        function: (done) => {
          const _fregionid: string = "none";
      
          basicget(onApp, done, "/puntodeventa?regionid="+_fregionid+"", {});
        }
      },
    {
        name: "/DELETE /puntodeventa/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicdelete(onApp, done, "/puntodeventa/"+_fid+"", {});
        }
      },
    {
        name: "/GET /puntodeventa/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/puntodeventa/"+_fid+"", {});
        }
      },
    {
        name: "/GET /supervisor",
        function: (done) => {
          
          basicget(onApp, done, "/supervisor", {});
        }
      },
    {
        name: "/GET /supervisor/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/supervisor/"+_fid+"", {});
        }
      },
    {
        name: "/GET /vendedor",
        function: (done) => {
          
          basicget(onApp, done, "/vendedor", {});
        }
      },
    {
        name: "/GET /vendedor/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/vendedor/"+_fid+"", {});
        }
      },
    {
        name: "/GET /sociedad",
        function: (done) => {
          const _fcombo: boolean = false;
      
          basicget(onApp, done, "/sociedad?combo="+_fcombo+"", {});
        }
      },
    {
        name: "/GET /sociedad/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/sociedad/"+_fid+"", {});
        }
      },
    {
        name: "/GET /ordenentregamotivo",
        function: (done) => {
          
          basicget(onApp, done, "/ordenentregamotivo", {});
        }
      },
    {
        name: "/GET /ordenentregamotivo/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/ordenentregamotivo/"+_fid+"", {});
        }
      },
    {
        name: "/GET /deposito",
        function: (done) => {
          const _fregionid: string = "none";
      
          basicget(onApp, done, "/deposito?regionid="+_fregionid+"", {});
        }
      },
    {
        name: "/GET /deposito/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/deposito/"+_fid+"", {});
        }
      },
    {
        name: "/POST /negocio",
        function: (done) => {
          
          basicpost(onApp, done, "/negocio", {});
        }
      },
    {
        name: "/PUT /negocio",
        function: (done) => {
          
          basicput(onApp, done, "/negocio", {});
        }
      },
    {
        name: "/GET /negocio",
        function: (done) => {
          
          basicget(onApp, done, "/negocio", {});
        }
      },
    {
        name: "/DELETE /negocio/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicdelete(onApp, done, "/negocio/"+_fid+"", {});
        }
      },
    {
        name: "/GET /negocio/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/negocio/"+_fid+"", {});
        }
      },
    {
        name: "/GET /cart/test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/cart/test-jest", {});
        }
      },
    {
        name: "/POST /cart",
        function: (done) => {
          
          basicpost(onApp, done, "/cart", {});
        }
      },
    {
        name: "/GET /cart",
        function: (done) => {
          const _ftype: string = "none";
      
          basicget(onApp, done, "/cart?type="+_ftype+"", {});
        }
      },
    {
        name: "/GET /cart/states",
        function: (done) => {
          const _fall: boolean = false;
      const _ftype: string = "none";
      
          basicget(onApp, done, "/cart/states?all="+_fall+"&type="+_ftype+"", {});
        }
      },
    {
        name: "/GET /cart/fases",
        function: (done) => {
          
          basicget(onApp, done, "/cart/fases", {});
        }
      },
    {
        name: "/GET /cart/quotation/{cartid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fproductid: string = "none";
      
          basicget(onApp, done, "/cart/quotation/"+_fcartid+"?productid="+_fproductid+"", {});
        }
      },
    {
        name: "/POST /cart/sendquotation/product/{cartid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fproductid: string = "none";
      const _fonlysave: boolean = false;
      
          basicpost(onApp, done, "/cart/sendquotation/product/"+_fcartid+"?productid="+_fproductid+"&onlysave="+_fonlysave+"", {});
        }
      },
    {
        name: "/POST /cart/requestquotation/{cartid}/products/{supplierid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fsupplierid: string = "none";
      
          basicpost(onApp, done, "/cart/requestquotation/"+_fcartid+"/products/"+_fsupplierid+"", {});
        }
      },
    {
        name: "/POST /cart/sendprices/{cartid}/{supplierid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fsupplierid: string = "none";
      
          basicpost(onApp, done, "/cart/sendprices/"+_fcartid+"/"+_fsupplierid+"", {});
        }
      },
    {
        name: "/POST /cart/proposewinningsupplier/{cartid}/products/{productid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fproductid: string = "none";
      
          basicpost(onApp, done, "/cart/proposewinningsupplier/"+_fcartid+"/products/"+_fproductid+"", {});
        }
      },
    {
        name: "/POST /cart/send-propose-winners/{cartid}",
        function: (done) => {
          const _fcartid: string = "none";
      
          basicpost(onApp, done, "/cart/send-propose-winners/"+_fcartid+"", {});
        }
      },
    {
        name: "/GET /cart/{cartid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _ffull: boolean = false;
      const _fcompras: boolean = false;
      
          basicget(onApp, done, "/cart/"+_fcartid+"?full="+_ffull+"&compras="+_fcompras+"", {});
        }
      },
    {
        name: "/PUT /cart/users/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicput(onApp, done, "/cart/users/"+_fid+"", {});
        }
      },
    {
        name: "/GET /cart/users/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/cart/users/"+_fid+"", {});
        }
      },
    {
        name: "/POST /cart/products/{cartid}/{productid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fproductid: string = "none";
      
          basicpost(onApp, done, "/cart/products/"+_fcartid+"/"+_fproductid+"", {});
        }
      },
    {
        name: "/GET /cart/products/{id}",
        function: (done) => {
          const _fid: string = "none";
      const _ffull: boolean = false;
      
          basicget(onApp, done, "/cart/products/"+_fid+"?full="+_ffull+"", {});
        }
      },
    {
        name: "/POST /cart/info-distribution/{cartid}/{regionid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fregionid: string = "none";
      
          basicpost(onApp, done, "/cart/info-distribution/"+_fcartid+"/"+_fregionid+"", {});
        }
      },
    {
        name: "/GET /cart/info-distribution/{cartid}/{regionid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fregionid: string = "none";
      
          basicget(onApp, done, "/cart/info-distribution/"+_fcartid+"/"+_fregionid+"", {});
        }
      },
    {
        name: "/GET /cart/info-distribution/{cartid}/{regionid}/product/{productid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fregionid: string = "none";
      const _fproductid: string = "none";
      
          basicget(onApp, done, "/cart/info-distribution/"+_fcartid+"/"+_fregionid+"/product/"+_fproductid+"", {});
        }
      },
    {
        name: "/POST /cart/save-distribution/{cartid}/products/{productid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fproductid: string = "none";
      
          basicpost(onApp, done, "/cart/save-distribution/"+_fcartid+"/products/"+_fproductid+"", {});
        }
      },
    {
        name: "/POST /cart/send-proposals/{cartid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _ftarget: string = "none";
      
          basicpost(onApp, done, "/cart/send-proposals/"+_fcartid+"?target="+_ftarget+"", {});
        }
      },
    {
        name: "/PUT /cart/count-distribution/{cartid}/products/{productid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fproductid: string = "none";
      
          basicput(onApp, done, "/cart/count-distribution/"+_fcartid+"/products/"+_fproductid+"", {});
        }
      },
    {
        name: "/POST /cart/update-distribution/{cartid}/products/{productid}/region/{regionid}/destinations",
        function: (done) => {
          const _fcartid: string = "none";
      const _fproductid: string = "none";
      const _fregionid: string = "none";
      const _ffinalized: boolean = false;
      
          basicpost(onApp, done, "/cart/update-distribution/"+_fcartid+"/products/"+_fproductid+"/region/"+_fregionid+"/destinations?finalized="+_ffinalized+"", {});
        }
      },
    {
        name: "/GET /cart/update-distribution/{cartid}/products/{productid}/region/{regionid}/destinations",
        function: (done) => {
          const _fcartid: string = "none";
      const _fproductid: string = "none";
      const _fregionid: string = "none";
      const _fincluderegioninfo: boolean = false;
      
          basicget(onApp, done, "/cart/update-distribution/"+_fcartid+"/products/"+_fproductid+"/region/"+_fregionid+"/destinations?includeregioninfo="+_fincluderegioninfo+"", {});
        }
      },
    {
        name: "/POST /cart/status-distribution/{cartid}/products/{productid}/region/{regionid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fproductid: string = "none";
      const _fregionid: string = "none";
      
          basicpost(onApp, done, "/cart/status-distribution/"+_fcartid+"/products/"+_fproductid+"/region/"+_fregionid+"", {});
        }
      },
    {
        name: "/POST /cart/arts-distribution/{cartid}/{productid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fproductid: string = "none";
      
          basicpost(onApp, done, "/cart/arts-distribution/"+_fcartid+"/"+_fproductid+"", {});
        }
      },
    {
        name: "/GET /cart/arts-distribution/{cartid}/{productid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fproductid: string = "none";
      
          basicget(onApp, done, "/cart/arts-distribution/"+_fcartid+"/"+_fproductid+"", {});
        }
      },
    {
        name: "/POST /cart/arts-files/{cartid}/{productid}",
        function: (done) => {
          const _fmaxsize: number = 0;
      
          basicpost(onApp, done, "/cart/arts-files/{cartid}/{productid}?maxsize="+_fmaxsize+"", {});
        }
      },
    {
        name: "/DELETE /cart/delete-distribution/{cartid}/{productid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fproductid: string = "none";
      
          basicdelete(onApp, done, "/cart/delete-distribution/"+_fcartid+"/"+_fproductid+"", {});
        }
      },
    {
        name: "/GET /cart/regions/{regionid}",
        function: (done) => {
          const _fregionid: string = "none";
      
          basicget(onApp, done, "/cart/regions/"+_fregionid+"", {});
        }
      },
    {
        name: "/POST /cart/finalizequotation/{cartid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fproductid: string = "none";
      const _fonlysave: boolean = false;
      
          basicpost(onApp, done, "/cart/finalizequotation/"+_fcartid+"?productid="+_fproductid+"&onlysave="+_fonlysave+"", {});
        }
      },
    {
        name: "/POST /cart/delete-product/{cartid}/products/{productid}",
        function: (done) => {
          const _fcartid: string = "none";
      const _fproductid: string = "none";
      
          basicpost(onApp, done, "/cart/delete-product/"+_fcartid+"/products/"+_fproductid+"", {});
        }
      },
    {
        name: "/GET /product/test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/product/test-jest", {});
        }
      },
    {
        name: "/GET /product/download/{caseId}/{userName}",
        function: (done) => {
          const _fcaseId: string = "none";
      const _fuserName: string = "none";
      
          basicget(onApp, done, "/product/download/"+_fcaseId+"/"+_fuserName+"", {});
        }
      },
    {
        name: "/POST /product",
        function: (done) => {
          
          basicpost(onApp, done, "/product", {});
        }
      },
    {
        name: "/GET /product",
        function: (done) => {
          const _ffull: boolean = false;
      
          basicget(onApp, done, "/product?full="+_ffull+"", {});
        }
      },
    {
        name: "/GET /product/{id}",
        function: (done) => {
          const _fid: string = "none";
      const _ffull: boolean = false;
      const _ffromsap: boolean = false;
      
          basicget(onApp, done, "/product/"+_fid+"?full="+_ffull+"&fromsap="+_ffromsap+"", {});
        }
      },
    {
        name: "/POST /product/images",
        function: (done) => {
          const _fmaxsize: number = 0;
      const _fwithname: string = "none";
      const _fwithinfo: string = "none";
      
          basicpost(onApp, done, "/product/images?maxsize="+_fmaxsize+"&withname="+_fwithname+"&withinfo="+_fwithinfo+"", {});
        }
      },
    {
        name: "/GET /legacy/test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/legacy/test-jest", {});
        }
      },
    {
        name: "/GET /legacy/wsdl/{type}",
        function: (done) => {
          const _furl: string = "none";
      const _ftype: string = "none";
      
          basicget(onApp, done, "/legacy/wsdl/"+_ftype+"?url="+_furl+"", {});
        }
      },
    {
        name: "/POST /legacy/proxy/{type}",
        function: (done) => {
          const _ftype: string = "none";
      const _funregistered: boolean = false;
      
          basicpost(onApp, done, "/legacy/proxy/"+_ftype+"?unregistered="+_funregistered+"", {});
        }
      },
    {
        name: "/POST /legacy/test/{type}",
        function: (done) => {
          const _ftype: string = "none";
      
          basicpost(onApp, done, "/legacy/test/"+_ftype+"", {});
        }
      },
    {
        name: "/GET /stock-mov/test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/stock-mov/test-jest", {});
        }
      },
    {
        name: "/POST /stock-mov",
        function: (done) => {
          
          basicpost(onApp, done, "/stock-mov", {});
        }
      },
    {
        name: "/GET /stock-mov",
        function: (done) => {
          const _ffrom: string = "none";
      const _fto: string = "none";
      const _fid: string = "none";
      
          basicget(onApp, done, "/stock-mov?from="+_ffrom+"&to="+_fto+"&id="+_fid+"", {});
        }
      },
    {
        name: "/GET /lugar/estados",
        function: (done) => {
          
          basicget(onApp, done, "/lugar/estados", {});
        }
      },
    {
        name: "/GET /lugar/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/lugar/"+_fid+"", {});
        }
      },
    {
        name: "/GET /tipoarchivo",
        function: (done) => {
          
          basicget(onApp, done, "/tipoarchivo", {});
        }
      },
    {
        name: "/GET /tipoarchivo/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/tipoarchivo/"+_fid+"", {});
        }
      },
    {
        name: "/GET /dimension/test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/dimension/test-jest", {});
        }
      },
    {
        name: "/GET /dimension",
        function: (done) => {
          const _ftype: string = "none";
      const _fname: boolean = false;
      
          basicget(onApp, done, "/dimension?type="+_ftype+"&name="+_fname+"", {});
        }
      },
    {
        name: "/GET /dimension/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/dimension/"+_fid+"", {});
        }
      },
    {
        name: "/GET /centro",
        function: (done) => {
          const _fcombo: boolean = false;
      const _fsociedadid: string = "none";
      
          basicget(onApp, done, "/centro?combo="+_fcombo+"&sociedadid="+_fsociedadid+"", {});
        }
      },
    {
        name: "/GET /centro/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/centro/"+_fid+"", {});
        }
      },
    {
        name: "/GET /proveedor",
        function: (done) => {
          
          basicget(onApp, done, "/proveedor", {});
        }
      },
    {
        name: "/GET /proveedor/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/proveedor/"+_fid+"", {});
        }
      },
    {
        name: "/GET /widgets/test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/widgets/test-jest", {});
        }
      },
    {
        name: "/GET /widgets/{type}",
        function: (done) => {
          const _ftype: string = "none";
      
          basicget(onApp, done, "/widgets/"+_ftype+"", {});
        }
      },
    {
        name: "/GET /planillaarmado/test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/planillaarmado/test-jest", {});
        }
      },
    {
        name: "/GET /planillaarmado/estados",
        function: (done) => {
          
          basicget(onApp, done, "/planillaarmado/estados", {});
        }
      },
    {
        name: "/GET /planillaarmado/usuarios",
        function: (done) => {
          
          basicget(onApp, done, "/planillaarmado/usuarios", {});
        }
      },
    {
        name: "/POST /planillaarmado",
        function: (done) => {
          
          basicpost(onApp, done, "/planillaarmado", {});
        }
      },
    {
        name: "/PUT /planillaarmado",
        function: (done) => {
          
          basicput(onApp, done, "/planillaarmado", {});
        }
      },
    {
        name: "/GET /planillaarmado",
        function: (done) => {
          const _ffull: boolean = false;
      
          basicget(onApp, done, "/planillaarmado?full="+_ffull+"", {});
        }
      },
    {
        name: "/DELETE /planillaarmado/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicdelete(onApp, done, "/planillaarmado/"+_fid+"", {});
        }
      },
    {
        name: "/GET /planillaarmado/{id}",
        function: (done) => {
          const _fid: string = "none";
      const _fexcludeemptys: boolean = false;
      const _ffull: boolean = false;
      const _fincludestock: boolean = false;
      
          basicget(onApp, done, "/planillaarmado/"+_fid+"?excludeemptys="+_fexcludeemptys+"&full="+_ffull+"&includestock="+_fincludestock+"", {});
        }
      },
    {
        name: "/POST /planillaarmado/paletizar/{type}/{idplanilla}",
        function: (done) => {
          const _fchep: boolean = false;
      const _fidplanilla: string = "none";
      const _ftype: string = "none";
      
          basicpost(onApp, done, "/planillaarmado/paletizar/"+_ftype+"/"+_fidplanilla+"?chep="+_fchep+"", {});
        }
      },
    {
        name: "/GET /planillaarmado/print/{id}",
        function: (done) => {
          const _fid: string = "none";
      const _fdownload: boolean = false;
      
          basicget(onApp, done, "/planillaarmado/print/"+_fid+"?download="+_fdownload+"", {});
        }
      },
    {
        name: "/POST /planillaarmado/finalizarpalletizado/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicpost(onApp, done, "/planillaarmado/finalizarpalletizado/"+_fid+"", {});
        }
      },
    {
        name: "/POST /planillaarmado/anular/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicpost(onApp, done, "/planillaarmado/anular/"+_fid+"", {});
        }
      },
    {
        name: "/GET /ordentransporte/test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/ordentransporte/test-jest", {});
        }
      },
    {
        name: "/GET /ordentransporte",
        function: (done) => {
          const _fonlyPenAndGen: boolean = false;
      
          basicget(onApp, done, "/ordentransporte?onlyPenAndGen="+_fonlyPenAndGen+"", {});
        }
      },
    {
        name: "/GET /ordentransporte/priorities",
        function: (done) => {
          
          basicget(onApp, done, "/ordentransporte/priorities", {});
        }
      },
    {
        name: "/GET /ordentransporte/pending",
        function: (done) => {
          
          basicget(onApp, done, "/ordentransporte/pending", {});
        }
      },
    {
        name: "/GET /ordentransporte/plans",
        function: (done) => {
          
          basicget(onApp, done, "/ordentransporte/plans", {});
        }
      },
    {
        name: "/GET /ordentransporte/products",
        function: (done) => {
          const _fnotin: string = "none";
      const _ftruckasid: boolean = false;
      const _fcount: boolean = false;
      
          basicget(onApp, done, "/ordentransporte/products?notin="+_fnotin+"&truckasid="+_ftruckasid+"&count="+_fcount+"", {});
        }
      },
    {
        name: "/GET /ordentransporte/targets",
        function: (done) => {
          const _frecibede: string = "none";
      
          basicget(onApp, done, "/ordentransporte/targets?recibede="+_frecibede+"", {});
        }
      },
    {
        name: "/POST /ordentransporte/create/{state}",
        function: (done) => {
          const _fstate: string = "none";
      
          basicpost(onApp, done, "/ordentransporte/create/"+_fstate+"", {});
        }
      },
    {
        name: "/GET /ordentransporte/sources",
        function: (done) => {
          
          basicget(onApp, done, "/ordentransporte/sources", {});
        }
      },
    {
        name: "/GET /ordentransporte/states",
        function: (done) => {
          
          basicget(onApp, done, "/ordentransporte/states", {});
        }
      },
    {
        name: "/GET /ordentransporte/{id}",
        function: (done) => {
          const _fid: string = "none";
      const _fincludestock: boolean = false;
      const _fincludetruck: boolean = false;
      
          basicget(onApp, done, "/ordentransporte/"+_fid+"?includestock="+_fincludestock+"&includetruck="+_fincludetruck+"", {});
        }
      },
    {
        name: "/POST /ordentransporte/anull/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicpost(onApp, done, "/ordentransporte/anull/"+_fid+"", {});
        }
      },
    {
        name: "/POST /ordentransporte/closewithpendings/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicpost(onApp, done, "/ordentransporte/closewithpendings/"+_fid+"", {});
        }
      },
    {
        name: "/POST /ordentransporte/update/add/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicpost(onApp, done, "/ordentransporte/update/add/"+_fid+"", {});
        }
      },
    {
        name: "/POST /ordentransporte/update/modify/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicpost(onApp, done, "/ordentransporte/update/modify/"+_fid+"", {});
        }
      },
    {
        name: "/GET /pallet/test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/pallet/test-jest", {});
        }
      },
    {
        name: "/GET /pallet/print/{id}",
        function: (done) => {
          const _fid: string = "none";
      const _fdownload: boolean = false;
      
          basicget(onApp, done, "/pallet/print/"+_fid+"?download="+_fdownload+"", {});
        }
      },
    {
        name: "/GET /pallet/estados",
        function: (done) => {
          
          basicget(onApp, done, "/pallet/estados", {});
        }
      },
    {
        name: "/GET /pallet",
        function: (done) => {
          const _fonlyunassigned: boolean = false;
      const _fcount: boolean = false;
      
          basicget(onApp, done, "/pallet?onlyunassigned="+_fonlyunassigned+"&count="+_fcount+"", {});
        }
      },
    {
        name: "/DELETE /pallet/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicdelete(onApp, done, "/pallet/"+_fid+"", {});
        }
      },
    {
        name: "/GET /pallet/{id}",
        function: (done) => {
          const _fid: string = "none";
      const _fincludestock: boolean = false;
      
          basicget(onApp, done, "/pallet/"+_fid+"?includestock="+_fincludestock+"", {});
        }
      },
    {
        name: "/PUT /pallet/update/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicput(onApp, done, "/pallet/update/"+_fid+"", {});
        }
      },
    {
        name: "/PUT /pallet/anular",
        function: (done) => {
          
          basicput(onApp, done, "/pallet/anular", {});
        }
      },
    {
        name: "/PUT /pallet/add-products/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicput(onApp, done, "/pallet/add-products/"+_fid+"", {});
        }
      },
    {
        name: "/GET /pallet/ordenestransporte/{id}",
        function: (done) => {
          const _fid: string = "none";
      const _fcount: boolean = false;
      
          basicget(onApp, done, "/pallet/ordenestransporte/"+_fid+"?count="+_fcount+"", {});
        }
      },
    {
        name: "/GET /vehiculo/test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/vehiculo/test-jest", {});
        }
      },
    {
        name: "/POST /vehiculo",
        function: (done) => {
          
          basicpost(onApp, done, "/vehiculo", {});
        }
      },
    {
        name: "/PUT /vehiculo",
        function: (done) => {
          
          basicput(onApp, done, "/vehiculo", {});
        }
      },
    {
        name: "/GET /vehiculo",
        function: (done) => {
          const _ftipovehiculo: string = "none";
      
          basicget(onApp, done, "/vehiculo?tipovehiculo="+_ftipovehiculo+"", {});
        }
      },
    {
        name: "/DELETE /vehiculo/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicdelete(onApp, done, "/vehiculo/"+_fid+"", {});
        }
      },
    {
        name: "/GET /vehiculo/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/vehiculo/"+_fid+"", {});
        }
      },
    {
        name: "/GET /operadorlogico",
        function: (done) => {
          
          basicget(onApp, done, "/operadorlogico", {});
        }
      },
    {
        name: "/GET /operadorlogico/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/operadorlogico/"+_fid+"", {});
        }
      },
    {
        name: "/GET /chofer/test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/chofer/test-jest", {});
        }
      },
    {
        name: "/POST /chofer/images",
        function: (done) => {
          const _fmaxsize: number = 0;
      const _fwithname: string = "none";
      const _fwithinfo: string = "none";
      
          basicpost(onApp, done, "/chofer/images?maxsize="+_fmaxsize+"&withname="+_fwithname+"&withinfo="+_fwithinfo+"", {});
        }
      },
    {
        name: "/POST /chofer",
        function: (done) => {
          
          basicpost(onApp, done, "/chofer", {});
        }
      },
    {
        name: "/PUT /chofer",
        function: (done) => {
          
          basicput(onApp, done, "/chofer", {});
        }
      },
    {
        name: "/GET /chofer",
        function: (done) => {
          
          basicget(onApp, done, "/chofer", {});
        }
      },
    {
        name: "/DELETE /chofer/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicdelete(onApp, done, "/chofer/"+_fid+"", {});
        }
      },
    {
        name: "/GET /chofer/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/chofer/"+_fid+"", {});
        }
      },
    {
        name: "/GET /planilladespacho/test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/planilladespacho/test-jest", {});
        }
      },
    {
        name: "/GET /planilladespacho/estados",
        function: (done) => {
          const _fdispatch: boolean = false;
      
          basicget(onApp, done, "/planilladespacho/estados?dispatch="+_fdispatch+"", {});
        }
      },
    {
        name: "/POST /planilladespacho",
        function: (done) => {
          
          basicpost(onApp, done, "/planilladespacho", {});
        }
      },
    {
        name: "/PUT /planilladespacho",
        function: (done) => {
          
          basicput(onApp, done, "/planilladespacho", {});
        }
      },
    {
        name: "/GET /planilladespacho",
        function: (done) => {
          const _ffull: boolean = false;
      const _fdispatch: boolean = false;
      
          basicget(onApp, done, "/planilladespacho?full="+_ffull+"&dispatch="+_fdispatch+"", {});
        }
      },
    {
        name: "/DELETE /planilladespacho/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicdelete(onApp, done, "/planilladespacho/"+_fid+"", {});
        }
      },
    {
        name: "/GET /planilladespacho/{id}",
        function: (done) => {
          const _fid: string = "none";
      const _ffull: boolean = false;
      
          basicget(onApp, done, "/planilladespacho/"+_fid+"?full="+_ffull+"", {});
        }
      },
    {
        name: "/GET /planilladespacho/print/{id}",
        function: (done) => {
          const _fid: string = "none";
      const _fdownload: boolean = false;
      
          basicget(onApp, done, "/planilladespacho/print/"+_fid+"?download="+_fdownload+"", {});
        }
      },
    {
        name: "/POST /planilladespacho/dispatch/{id}",
        function: (done) => {
          const _fsave: boolean = false;
      const _fid: string = "none";
      
          basicpost(onApp, done, "/planilladespacho/dispatch/"+_fid+"?save="+_fsave+"", {});
        }
      },
    {
        name: "/POST /planilladespacho/anular/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicpost(onApp, done, "/planilladespacho/anular/"+_fid+"", {});
        }
      },
    {
        name: "/PUT /planilladespacho/add-pallets/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicput(onApp, done, "/planilladespacho/add-pallets/"+_fid+"", {});
        }
      },
    {
        name: "/GET /planillarecepcion/test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/planillarecepcion/test-jest", {});
        }
      },
    {
        name: "/GET /planillarecepcion/estados",
        function: (done) => {
          
          basicget(onApp, done, "/planillarecepcion/estados", {});
        }
      },
    {
        name: "/GET /planillarecepcion",
        function: (done) => {
          
          basicget(onApp, done, "/planillarecepcion", {});
        }
      },
    {
        name: "/GET /planillarecepcion/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicget(onApp, done, "/planillarecepcion/"+_fid+"", {});
        }
      },
    {
        name: "/PUT /planillarecepcion/pallet-product/{id}/{status}",
        function: (done) => {
          const _fstatus: string = "none";
      const _fid: string = "none";
      
          basicput(onApp, done, "/planillarecepcion/pallet-product/"+_fid+"/"+_fstatus+"", {});
        }
      },
    {
        name: "/GET /planillarecepcion/print/{id}",
        function: (done) => {
          const _fid: string = "none";
      const _fdownload: boolean = false;
      
          basicget(onApp, done, "/planillarecepcion/print/"+_fid+"?download="+_fdownload+"", {});
        }
      },
    {
        name: "/POST /planillarecepcion/reception/{id}",
        function: (done) => {
          const _fid: string = "none";
      
          basicpost(onApp, done, "/planillarecepcion/reception/"+_fid+"", {});
        }
      },
    {
        name: "/GET /liquidacion/test-jest",
        function: (done) => {
          
          basicget(onApp, done, "/liquidacion/test-jest", {});
        }
      },
    {
        name: "/GET /liquidacion/planillasaliquidar",
        function: (done) => {
          const _ffrom: string = "none";
      const _fto: string = "none";
      
          basicget(onApp, done, "/liquidacion/planillasaliquidar?from="+_ffrom+"&to="+_fto+"", {});
        }
      },
    {
        name: "/POST /liquidacion",
        function: (done) => {
          
          basicpost(onApp, done, "/liquidacion", {});
        }
      },
    {
        name: "/GET /liquidacion",
        function: (done) => {
          const _ffull: boolean = false;
      const _ffrom: string = "none";
      const _fto: string = "none";
      const _fid: string = "none";
      
          basicget(onApp, done, "/liquidacion?full="+_ffull+"&from="+_ffrom+"&to="+_fto+"&id="+_fid+"", {});
        }
      },
    {
        name: "/GET /liquidacion/{id}",
        function: (done) => {
          const _fid: string = "none";
      const _ffull: boolean = false;
      
          basicget(onApp, done, "/liquidacion/"+_fid+"?full="+_ffull+"", {});
        }
      },

  ];
}
  