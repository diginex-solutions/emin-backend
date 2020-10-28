#!/bin/sh

set -e
set -x

docker pull diginex/ca

cd $CI_PROJECT_DIR

if [ "production" = "$1" ]; then
   echo $PROD_KUBE_CONFIG | base64 -d > kube_config.yaml
   NAMESPACE=$PROD_K8S_NAMESPACE
   HELM_RELEASE_NAME=$PROD_HELM_RELEASE_NAME
   APP_ENV="production"
   SERVICE_HOST="trust-api.diginex.com"
   INGRESS_GATEWAY="ingressgateway-aks-diginex-app"
elif [ "production-emin" = "$1" ]; then
   echo $PROD_KUBE_CONFIG | base64 -d > kube_config.yaml
   NAMESPACE=trust-prod-emin
   HELM_RELEASE_NAME=trust-be-prod-emin
   APP_ENV="productionEmin"
   SERVICE_HOST="coca-cola-emin-api.aks.diginex.app"
   INGRESS_GATEWAY="ingressgateway-aks-diginex-app"
elif [ "production-emin-app" = "$1" ]; then
   echo $PROD_KUBE_CONFIG | base64 -d > kube_config.yaml
   NAMESPACE=trust-prod-emin-app
   HELM_RELEASE_NAME=trust-be-prod-emin-app
   APP_ENV="productionEminApp"
   SERVICE_HOST="emin-api.aks.diginex.app"
   INGRESS_GATEWAY="ingressgateway-aks-diginex-app"
elif [ "production-trust-mobile" = "$1" ]; then
   echo $PROD_DIGINEX_APP_KUBE_CONFIG | base64 -d > kube_config.yaml
   NAMESPACE=trust-prod-trust-mobile
   HELM_RELEASE_NAME=trust-be-prod-trust-mobile
   APP_ENV="productionTrustMobile"
   SERVICE_HOST="trust-mobile-api.diginex.app"
   INGRESS_GATEWAY="ingressgateway-diginex-app"
elif [ "production-wbi-app" = "$1" ]; then
   echo $PROD_DIGINEX_APP_KUBE_CONFIG | base64 -d > kube_config.yaml
   NAMESPACE=trust-prod-wbi-app
   HELM_RELEASE_NAME=trust-be-prod-wbi-app
   APP_ENV="productionWbiApp"
   SERVICE_HOST="trust-wbi-api.diginex.app"
   INGRESS_GATEWAY="ingressgateway-diginex-app"
elif [ "development" = "$1" ]; then
   echo $DEV_KUBE_CONFIG | base64 -d > kube_config.yaml
   NAMESPACE=$DEV_K8S_NAMESPACE
   HELM_RELEASE_NAME=$DEV_HELM_RELEASE_NAME
   APP_ENV="development"
   SERVICE_HOST="trust-backend.dev.diginex.fun"
   INGRESS_GATEWAY="ingressgateway-test"
elif [ "qa" = "$1" ]; then
   echo $DEV_KUBE_CONFIG | base64 -d > kube_config.yaml
   NAMESPACE=$QA_K8S_NAMESPACE
   HELM_RELEASE_NAME=$QA_HELM_RELEASE_NAME
   APP_ENV="qa"
   SERVICE_HOST="trust-backend.qa.diginex.fun"
   INGRESS_GATEWAY="ingressgateway-qa"
fi;

docker run --rm \
  -v $PWD/kube_config.yaml:/root/.kube/config:ro \
  -v $PWD/helm:/helm \
  -e IMAGE_REPOSITORY=$HARBOR_REGISTRY \
  -e IMAGE_TAG=$CI_COMMIT_SHA \
  -e INGRESS_GATEWAY=$INGRESS_GATEWAY \
  -e NAMESPACE=$NAMESPACE \
  -e HELM_RELEASE_NAME=$HELM_RELEASE_NAME \
  -e APP_ENV=$APP_ENV \
  -e SERVICE_HOST=$SERVICE_HOST \
  diginex/ca sh -c \
    "helm init --client-only \
      && helm repo add harbor https://harbor.dev.diginex.fun/chartrepo/diginex --username $HARBOR_LOGIN --password $HARBOR_PASSWORD \
      && helm repo update \
      && helm fetch harbor/trust-be --untar \
      && cd trust-be \
      && gomplate -t _helpers.tpl -f values.deploy.yaml.gotmpl > values.yaml \
      && cat values.yaml \
      && helm upgrade -i --namespace \$NAMESPACE \$HELM_RELEASE_NAME . -f values.yaml"
