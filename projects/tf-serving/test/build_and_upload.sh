#!/usr/bin/env bash

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

MODEL_NAME="image-classification-tfs"
MODEL_DATA_URL="s3://23people-model/tensorflow/model.tar.gz"

echo 'Packing model...'
cd $PWD/projects/tf-serving

rm model.tar.gz
tar -czvf model.tar.gz 1 code

echo 'Uploading model...'
aws s3 cp "./model.tar.gz" $MODEL_DATA_URL

REGION="us-east-1"
TFS_VERSION="2.2.0"
PROCESSOR_TYPE="cpu"
IMAGE="763104351884.dkr.ecr.$REGION.amazonaws.com/tensorflow-inference:$TFS_VERSION-$PROCESSOR_TYPE"
INITIAL_INSTANCE_COUNT=1
INSTANCE_TYPE="ml.c5d.xlarge"

# See the following document for more on SageMaker Roles:
# https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-roles.html
ROLE_ARN="arn:aws:iam::$ACCOUNT:role/service-role/AmazonSageMaker-ExecutionRole-20190805T172704"

echo 'Creating model...'
aws sagemaker create-model \
    --model-name $MODEL_NAME \
    --primary-container Image=$IMAGE,ModelDataUrl=$MODEL_DATA_URL \
    --execution-role-arn $ROLE_ARN


echo 'Creating enpoint config...'
ENDPOINT_CONFIG_NAME="$MODEL_NAME-config"
# It creates endpoint configuration.
aws sagemaker create-endpoint-config \
   --endpoint-config-name $ENDPOINT_CONFIG_NAME \
   --production-variants VariantName=Tensorflow,ModelName=$MODEL_NAME,InitialInstanceCount=$INITIAL_INSTANCE_COUNT,InstanceType=$INSTANCE_TYPE

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
   --body fileb://./test/inputs/request.json \
   /tmp/200-response.json

cat /tmp/200-response.json 
echo '\n'
echo 'Restoring...'
aws sagemaker delete-endpoint --endpoint-name $ENDPOINT_NAME
aws sagemaker wait endpoint-deleted --endpoint-name $ENDPOINT_NAME
aws sagemaker delete-endpoint-config --endpoint-config-name $ENDPOINT_CONFIG_NAME
aws sagemaker delete-model --model-name $MODEL_NAME