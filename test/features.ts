
import {basicpost,basicget, FunctionTestApp}  from "@proguidemc/http-module";

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
        name: "/GET /",
        function: (done) => {
          
          basicget(onApp, done, "/", {});
        }
      },

  ];
}
  