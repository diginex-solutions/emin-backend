#!/usr/bin/env bash
kubectl config use-context devasia.diginex.fun
k8senv='trust-dev'
dumpToDir='coca-jan14-bak-m1'
localMongoUri='mongodb://localhost:27017/diginex-trust?authSource=admin'
remoteMongoUri='mongodb://root:xxxxxxxxxxxxxx@localhost:27018/diginex-trust?authSource=admin'

# Dump local
mkdir -p $dumpToDir
mongodump --uri=$localMongoUri -o $dumpToDir

# port forward
mongopod=$(kubectl get pods -n $k8senv -l app=mongodb --no-headers=true |awk '{print $1}')
kubectl -n $k8senv port-forward $mongopod 27018:27017 &

sleep 2s
# Delete all records
mongo $remoteMongoUri  --eval "printjson(db.dropDatabase())" &&
mongorestore --uri=$remoteMongoUri -d diginex-trust $dumpToDir/diginex-trust
# Restore to remote at 27018

#Restore dev to remote at 27018
#mongorestore --uri=$remoteMongoUri -d diginex-trust nov27-dev/diginex-trust

#kill port-forward

# init the widgets for 5dbed577e671f651898c4d63
# mongo $localMongoUri --quiet --eval "print(db.templates.findOne({userId: ObjectId('5dbed577e671f651898c4d63')}, {_id: 1})._id.valueOf())"
# mongo $remoteMongoUri --quiet --eval "print(db.templates.findOne({userId: ObjectId('5dbed577e671f651898c4d63')}, {_id: 1})._id.valueOf())"

kill -9 $(lsof -t -i:27018)

exit
# do it manually
curl -X POST \
  https://coca-cola-emin-api.aks.diginex.app/admin/user_widget \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZGJlZDU3N2U2NzFmNjUxODk4YzRkNjMiLCJ1c2VyIjp7ImVtYWlsIjoibW1lbm9uQGNvY2EtY29sYS5jb20uYmgifSwiaWF0IjoxNTc0ODQ4NDMzLCJleHAiOjE1ODI2MjQ0MzN9.jAgBi1Y_EH0ygcnRd6tAdeAFmbJg1fqpXT9XuE5Ky_0' \
  -H 'Content-Type: application/json' \
  -d '{
    "templateId": "5dea2040a7c1c34c2409d225",
    "userId": "5dbed577e671f651898c4d63"
}'

curl 'https://trust-backend.dev.diginex.fun/settings' \
	-H 'authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZGJlZDU3N2U2NzFmNjUxODk4YzRkNjMiLCJ1c2VyIjp7ImVtYWlsIjoibW1lbm9uQGNvY2EtY29sYS5jb20uYmgifSwiaWF0IjoxNTc0ODQ4NDMzLCJleHAiOjE1ODI2MjQ0MzN9.jAgBi1Y_EH0ygcnRd6tAdeAFmbJg1fqpXT9XuE5Ky_0' \
	-H 'content-type: application/json;charset=UTF-8' \
	--data-binary '{"name":"SHOW_DASHBOARD","value":true}' \
	--compressed