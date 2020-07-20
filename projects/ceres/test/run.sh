#!/usr/bin/env bash

# Create the model in Sagemaker
account=$(aws sts get-caller-identity --query Account --output text)

if [ $? -ne 0 ]
then
    exit 255
fi

REGION=$(aws configure get region)
REGION=${region:-us-east-1}
ACCOUNT_REPOSITORY="${account}.dkr.ecr.${REGION}.amazonaws.com"
IMAGE="${ACCOUNT_REPOSITORY}/python3:latest"

MODEL_NAME="ceres-model"
 
# See the following document for more on SageMaker Roles:
# https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-roles.html
ROLE_ARN="arn:aws:iam::${account}:role/service-role/AmazonSageMaker-ExecutionRole-20190805T172704"

echo 'Creating model...'
aws sagemaker create-model \
   --model-name $MODEL_NAME \
   --primary-container Image=$IMAGE,Environment='{bucket=23people-model,prefix=python,model=googlesheet}' \
   --execution-role-arn $ROLE_ARN

# You need to change the timestamp value with the output of deploy-model.sh
ENDPOINT_CONFIG_NAME="$MODEL_NAME-config"
INITIAL_INSTANCE_COUNT=1
INSTANCE_TYPE="ml.t2.medium"

echo 'Creating enpoint config...'
# It creates endpoint configuration.
aws sagemaker create-endpoint-config \
   --endpoint-config-name $ENDPOINT_CONFIG_NAME \
   --production-variants VariantName=CERES,ModelName=$MODEL_NAME,InitialInstanceCount=$INITIAL_INSTANCE_COUNT,InstanceType=$INSTANCE_TYPE

echo 'Creating enpoint...'
ENDPOINT_NAME="$MODEL_NAME-endpoint"
# Create the endpoint
aws sagemaker create-endpoint \
   --endpoint-name $ENDPOINT_NAME \
   --endpoint-config-name $ENDPOINT_CONFIG_NAME

echo 'Waiting...'
aws sagemaker wait endpoint-in-service --endpoint-name $ENDPOINT_NAME

echo 'Invoking enpoint...'
# Invoke the endpoint
aws sagemaker-runtime invoke-endpoint \
   --endpoint-name $ENDPOINT_NAME \
   --content-type=application/json \
   --body fileb://./inputs/request.json \
   response.json

cat response.json

echo 'Restoring...'
aws sagemaker delete-endpoint --endpoint-name $ENDPOINT_NAME
aws sagemaker wait endpoint-deleted --endpoint-name $ENDPOINT_NAME
aws sagemaker delete-endpoint-config --endpoint-config-name $ENDPOINT_CONFIG_NAME
aws sagemaker delete-model --model-name $MODEL_NAME