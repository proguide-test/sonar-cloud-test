FROM node:current-alpine as node

WORKDIR /usr/src/app

COPY package.json ./

RUN npm config set registry https://verdaccio.proguidemc.com

RUN npm install

COPY . .

ARG branch
ARG buildid

ENV BRANCHNAME ${branch}-${buildid}

RUN npm run build

RUN /bin/sh -c "apk add --no-cache bash"
RUN /bin/sh -c "apk add --no-cache xvfb-run"
RUN /bin/sh -c "apk add --no-cache libxrender"
RUN /bin/sh -c "apk add --no-cache openssl1.1-compat"

COPY --from=madnight/docker-alpine-wkhtmltopdf:0.12.5-alpine3.12 /bin/wkhtmltopdf /bin/wkhtmltopdf

EXPOSE 3000
ENTRYPOINT [ "npm"]

CMD ["run", "start:prod"]
