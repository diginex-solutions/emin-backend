#!/usr/bin/env bash
set -e
if [ "dev2" = "$1" ]; then
  kubectl config use-context DevelopmentCluster
  NAMESPACE=trust-dev
  HELM_RELEASE_NAME=trust-backend-dev
  APP_ENV="development"
  SERVICE_HOST="trust-backend.dev2.diginex.fun"
  INGRESS_GATEWAY="ingressgateway-dev2"
  K8S_CONFIG_FILE=~/.kube/new_dev.config
elif [ "qa2" = "$1" ]; then
  kubectl config use-context DevelopmentCluster
  NAMESPACE=trust-qa
  HELM_RELEASE_NAME=trust-backend-qa
  APP_ENV="qa2"
  SERVICE_HOST="trust-backend.qa2.diginex.fun"
  INGRESS_GATEWAY="ingressgateway-qa2"
  K8S_CONFIG_FILE=~/.kube/new_dev.config
fi
CI_REGISTRY_IMAGE="registry.gitlab.com/diginexhk/trust/diginex-trust-be"

timestamp=$(date +%s)
if [ -n "$2" ]; then
  TAG="$2-$timestamp"
  echo "$TAG"
else
  TAG="test-$timestamp"
  echo "$TAG"
fi

docker build  ./ -f Dockerfile -t trust-be:$TAG
echo "-------------"
docker tag trust-be:$TAG $CI_REGISTRY_IMAGE:$TAG
echo $CI_REGISTRY_IMAGE:$TAG
docker push $CI_REGISTRY_IMAGE:$TAG

docker run --rm \
  -v $(pwd):/workspace \
  -v $K8S_CONFIG_FILE:/root/.kube/config:ro \
  -v $PWD/helm:/helm \
  -e IMAGE_REPOSITORY=$CI_REGISTRY_IMAGE \
  -e CI_REGISTRY_IMAGE=$CI_REGISTRY_IMAGE \
  -e IMAGE_TAG=$CI_COMMIT_SHA \
  -e NAMESPACE=$NAMESPACE \
  -e HELM_RELEASE_NAME=$HELM_RELEASE_NAME \
  -e APP_ENV=$APP_ENV \
  -e SERVICE_HOST=$SERVICE_HOST \
  -e INGRESS_GATEWAY=$INGRESS_GATEWAY \
  -e IMAGE_REPOSITORY_PASSWORD=$GITLAB_PERSONAL_ACCESS_TOKEN \
  -e IMAGE_REPOSITORY_USERNAME="marco.cheung@diginex" \
  diginex/ca:helm-3.2.0-gomplate sh -c \
    "helm repo add harbor https://diginex.github.io/monochart/ && helm repo add stable https://kubernetes-charts.storage.googleapis.com/ \
      && cd charts/trust-be \
      && helm dependency build && cd .. && helm package ./trust-be \
      && oras login -u \$IMAGE_REPOSITORY_USERNAME -p \$IMAGE_REPOSITORY_PASSWORD registry.gitlab.com \
      && oras push \$CI_REGISTRY_IMAGE:trust-be-0.1.0.tgz ./*.tgz "
echo "=============="
docker run --rm \
  -v $K8S_CONFIG_FILE:/root/.kube/config:ro \
  -v $PWD/helm:/helm \
  -e IMAGE_REPOSITORY=$CI_REGISTRY_IMAGE \
  -e CI_REGISTRY_IMAGE=$CI_REGISTRY_IMAGE \
  -e IMAGE_TAG=$CI_COMMIT_SHA \
  -e NAMESPACE=$NAMESPACE \
  -e HELM_RELEASE_NAME=$HELM_RELEASE_NAME \
  -e APP_ENV=$APP_ENV \
  -e SERVICE_HOST=$SERVICE_HOST \
  -e INGRESS_GATEWAY=$INGRESS_GATEWAY \
  -e IMAGE_REPOSITORY_PASSWORD=$GITLAB_PERSONAL_ACCESS_TOKEN \
  -e IMAGE_REPOSITORY_USERNAME="marco.cheung@diginex" \
  diginex/ca:helm-3.2.0-gomplate sh -c \
    "helm repo add harbor https://diginex.github.io/monochart/ && helm repo add stable https://kubernetes-charts.storage.googleapis.com/ \
      && oras login -u \$IMAGE_REPOSITORY_USERNAME -p \$IMAGE_REPOSITORY_PASSWORD registry.gitlab.com \
      && oras pull \$CI_REGISTRY_IMAGE:trust-be-0.1.0.tgz \
      && tar -zxf trust-be-0.1.0.tgz \
      && cd trust-be \
      && ls -alh \
      && cat values.deploy.yaml.gotmpl \
      && export IMAGE_REPOSITORY=\$IMAGE_REPOSITORY IMAGE_TAG=$TAG NAMESPACE=\$NAMESPACE HELM_RELEASE_NAME=\$HELM_RELEASE_NAME APP_ENV=\$APP_ENV SERVICE_HOST=\$SERVICE_HOST INGRESS_GATEWAY=\$INGRESS_GATEWAY && gomplate -f values.deploy.yaml.gotmpl > values.yaml \
      && cat values.yaml \
      && helm upgrade \$HELM_RELEASE_NAME . --namespace \$NAMESPACE --install"
