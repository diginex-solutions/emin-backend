#!/bin/sh

set -x
set -e

docker pull $2 || true
docker pull $3 || true
cd $CI_PROJECT_DIR
docker build . -f $1 -t $3 --cache-from $3 --cache-from $2 $4
docker push $3

[ "$CI_COMMIT_REF_SLUG" == "master" ] && docker tag $3 $2 && docker push $2 || true
