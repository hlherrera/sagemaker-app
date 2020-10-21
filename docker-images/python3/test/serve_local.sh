#!/bin/sh

image=${1:-python3}

#
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=AKIAZSJ7JVBU3BAQQIHD
export AWS_SECRET_ACCESS_KEY=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

export BUCKET=23people-model
export APP_CLIENT=23p
export MODEL=googlesheet
export MODEL_PREFIX=ceres
export MODEL_MAIN=googlesheet

#export BUCKET=23people-model
#export APP_CLIENT=23p
#export MODEL=tf-model
#export MODEL_PREFIX=tf
#export MODEL_MAIN=inference

#tables
export CHAMELEON_APP_LOGS_TABLE=chameleon-clients-logs-dev
# MongoDB
export MONGO_DB_PROTOCOL=mongodb
export MONGO_DB_URL=ec2-34-201-33-103.compute-1.amazonaws.com
export MONGO_DB_USER=kmeleon
export MONGO_DB_PASS=ch4m3l30n_dev
export MONGO_DB_NAME=chameleon_monitor_dev

#busevent
export EVENT_BUS_NAME=modelDeploy-dev
export EVENT_BUS_SOURCE=chameleon.modelDeployment
export EVENT_BUS_TYPE="Model Error"


docker run \
-e AWS_DEFAULT_REGION -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY \
-e CHAMELEON_APP_LOGS_TABLE \
-e MONGO_DB_PROTOCOL -e MONGO_DB_URL -e MONGO_DB_USER -e MONGO_DB_PASS -e MONGO_DB_NAME \
-e EVENT_BUS_NAME -e EVENT_BUS_SOURCE -e EVENT_BUS_TYPE \
-e BUCKET -e APP_CLIENT -e MODEL -e MODEL_PREFIX -e MODEL_MAIN  \
-v $(pwd)/:/opt/ml -p 8080:8080 --rm ${image} serve
