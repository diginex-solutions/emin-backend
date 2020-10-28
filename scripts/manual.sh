#!/usr/bin/env bash
HARBOR_PASSWORD=$HARBOR_PASSWORD
HARBOR_LOGIN=$HARBOR_LOGIN
IMAGE_REPOSITORY="harbor.dev.diginex.fun/diginex/trust-be"


if [ "production" = "$1" ]; then
  kubectl config use-context aksclusterdf4d75f1
  NAMESPACE=trust-prod
  HELM_RELEASE_NAME=trust-be-prod
  APP_ENV="production"
  SERVICE_HOST="trust-api.diginex.com"
  INGRESS_GATEWAY="ingressgateway-aks-diginex-app"
  K8S_CONFIG_FILE=~/.kube/aks2.config
elif [ "production-emin-app" = "$1" ]; then
  kubectl config use-context aksclusterdf4d75f1
  NAMESPACE="trust-prod-emin-app"
  HELM_RELEASE_NAME="trust-be-prod-emin-app"
  APP_ENV="productionEminApp"
  SERVICE_HOST="emin-api.aks.diginex.app"
  INGRESS_GATEWAY="ingressgateway-aks-diginex-app"
  K8S_CONFIG_FILE=~/.kube/aks2.config
elif [ "production-emin" = "$1" ]; then
  kubectl config use-context aksclusterdf4d75f1
  NAMESPACE=trust-prod-emin
  HELM_RELEASE_NAME=trust-be-prod-emin
  APP_ENV="productionEmin"
  SERVICE_HOST="coca-cola-emin-api.aks.diginex.app"
  INGRESS_GATEWAY="ingressgateway-aks-diginex-app"
  K8S_CONFIG_FILE=~/.kube/aks2.config
elif [ "development" = "$1" ]; then
  kubectl config use-context devasia.diginex.fun
  NAMESPACE="trust-dev"
  HELM_RELEASE_NAME="pumped-rabbit"
  APP_ENV="development"
  SERVICE_HOST="trust-backend.dev.diginex.fun"
  INGRESS_GATEWAY="ingressgateway-test"
  K8S_CONFIG_FILE=~/.kube/config
elif [ "qa" = "$1" ]; then
  kubectl config use-context devasia.diginex.fun
  NAMESPACE="trust-qa"
  HELM_RELEASE_NAME="trust-qa"
  APP_ENV="qa"
  SERVICE_HOST="trust-backend.qa.diginex.fun"
  INGRESS_GATEWAY="ingressgateway-qa"
  K8S_CONFIG_FILE=~/.kube/config
fi;

timestamp=$(date +%s)
if [ -n "$2" ]; then
  TAG="$2-$timestamp"
  echo "$TAG"
else
  TAG="test-$timestamp"
  echo "$TAG"
fi

BASEDIR=$(dirname "$0")
echo "$BASEDIR/.."

docker build  ./ -f Dockerfile -t trust-be:$TAG
docker login -u $HARBOR_LOGIN -p $HARBOR_PASSWORD harbor.dev.diginex.fun/diginex/trust-be
docker tag trust-be:$TAG  harbor.dev.diginex.fun/diginex/trust-be:$TAG
docker push harbor.dev.diginex.fun/diginex/trust-be:$TAG

docker run --rm -v $(pwd):/workspace -e DOCKER_REGISTRY=harbor.dev.diginex.fun/diginex/trust-be -e DOCKER_TAG=$TAG -e CI_PROJECT_NAME=$CI_PROJECT_NAME diginex/ca sh -c "helm repo add source-repo https://charts.cloudposse.com/incubator && cd charts/trust-be && helm dependency build && cd .. && helm package ./trust-be"
docker run --rm -v $(pwd):/workspace -e HARBOR_LOGIN=$HARBOR_LOGIN -e HARBOR_PASSWORD=$HARBOR_PASSWORD diginex/ca sh -c "helm repo add harbor https://harbor.dev.diginex.fun/chartrepo/diginex --username=$HARBOR_LOGIN --password=$HARBOR_PASSWORD && cd charts && helm push *.tgz harbor"


docker run --rm \
  -v $K8S_CONFIG_FILE:/root/.kube/config:ro \
  -e IMAGE_REPOSITORY=$IMAGE_REPOSITORY \
  -e IMAGE_TAG=$TAG \
  -e INGRESS_GATEWAY=$INGRESS_GATEWAY \
  -e NAMESPACE=$NAMESPACE \
  -e HELM_RELEASE_NAME=$HELM_RELEASE_NAME \
  -e APP_ENV=$APP_ENV \
  -e SERVICE_HOST=$SERVICE_HOST \
  -e HARBOR_PASSWORD=$HARBOR_PASSWORD \
  -e HARBOR_LOGIN=$HARBOR_LOGIN \
  diginex/ca sh -c \
    "helm init --client-only \
      && helm repo add harbor https://harbor.dev.diginex.fun/chartrepo/diginex --username $HARBOR_LOGIN --password $HARBOR_PASSWORD \
      && helm repo update \
      && helm fetch harbor/trust-be --untar \
      && cd trust-be \
      && gomplate -t _helpers.tpl -f values.deploy.yaml.gotmpl > values.yaml \
      && cat values.yaml \
      && helm upgrade -i --namespace \$NAMESPACE \$HELM_RELEASE_NAME . -f values.yaml"

