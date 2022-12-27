#!/bin/sh

folder="$(dirname "$0")"
cd $folder

mkdir temp

cd temp

export VERSION=$(curl --silent "https://api.github.com/repos/aquasecurity/trivy/releases/latest" | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/')
wget https://github.com/aquasecurity/trivy/releases/download/v${VERSION}/trivy_${VERSION}_Linux-64bit.tar.gz
tar zxvf trivy_${VERSION}_Linux-64bit.tar.gz 
echo "---Trivy Version---"
./trivy -v

./trivy --debug image $1
./trivy image --exit-code 0 --severity LOW,MEDIUM $1
./trivy image --exit-code 1 --severity HIGH,CRITICAL $1

rm -r ../temp
