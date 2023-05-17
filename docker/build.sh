#!/bin/bash

docker build --no-cache --platform linux/amd64 -t bjhale/sitespeedio-elasticsearch:amd64 .
docker push bjhale/sitespeedio-elasticsearch:amd64
docker build --no-cache --platform linux/arm64 -t bjhale/sitespeedio-elasticsearch:arm64 .
docker push bjhale/sitespeedio-elasticsearch:arm64

docker manifest create bjhale/sitespeedio-elasticsearch:latest \
   --amend bjhale/sitespeedio-elasticsearch:amd64 \
   --amend bjhale/sitespeedio-elasticsearch:arm64

docker manifest push --purge bjhale/sitespeedio-elasticsearch:latest