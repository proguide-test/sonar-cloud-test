#!/bin/sh

npm config set registry https://verdaccio.proguidemc.com

folder="$(dirname "$0")"
cd $folder

string=$(ncu)
reqsubstr=" match "

PACKAGE_NAME=$(cat package.json \
    | grep name \
    | head -1 \
    | awk -F: '{ print $2 }' \
    | sed 's/[",]//g')

if [ -z "${string##*$reqsubstr*}" ] ;then    
    echo "****** $PACKAGE_NAME No requiere nueva version ******"
else
    ncu -u
    npm i
fi
