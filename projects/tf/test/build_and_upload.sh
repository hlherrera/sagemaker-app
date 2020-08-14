#!/usr/bin/env bash
# name=tf-model
MODEL=${1:-"tf-model"}
ROOT=$PWD

# Create the model in Sagemaker
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

if [ $? -ne 0 ]
then
    exit 255
fi

REGION=$(aws configure get region)
REGION=${region:-us-east-1}
ACCOUNT_REPOSITORY="${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com"
IMAGE="${ACCOUNT_REPOSITORY}/python3:latest"

# ENV VARS
CHAMELEON_APP_MONITOR_TABLE="chameleon-clients-monitor-dev"
CHAMELEON_APP_LOGS_TABLE="chameleon-clients-logs-dev"
BUCKET="23people-model"
MODEL_NAME="image-classification-tf"
MODEL_PREFIX="tf"
MODEL_MAIN="inference"

MODEL_PATH="s3://${BUCKET}/${MODEL_PREFIX}"
MODEL_DATA_URL="s3://${BUCKET}/${MODEL_PREFIX}/${MODEL}.tar.gz"
 
# See the following document for more on SageMaker Roles:
# https://docs.aws.amazon.com/sagemaker/latest/dg/sagemaker-roles.html
ROLE_ARN="arn:aws:iam::${ACCOUNT}:role/service-role/AmazonSageMaker-ExecutionRole-20190805T172704"

echo "Preparing model $MODEL ..."
echo "Packing model..."

cd $ROOT/projects/tf/src

tar -cf ${MODEL}.tar.gz --exclude=${MODEL}.tar.gz .

echo 'Uploading model...'
aws s3 cp "./${MODEL}.tar.gz" $MODEL_DATA_URL

cd $ROOT/projects/tf/test

echo 'Creating model...'
aws sagemaker create-model \
   --model-name $MODEL_NAME \
   --primary-container Image=$IMAGE,Environment="{BUCKET=$BUCKET,MODEL_PREFIX=$MODEL_PREFIX,MODEL=$MODEL,MODEL_MAIN=$MODEL_MAIN,CHAMELEON_APP_LOGS_TABLE=$CHAMELEON_APP_LOGS_TABLE,CHAMELEON_APP_MONITOR_TABLE=$CHAMELEON_APP_MONITOR_TABLE}" \
   --execution-role-arn $ROLE_ARN

# You need to change the timestamp value with the output of deploy-model.sh
ENDPOINT_CONFIG_NAME="$MODEL_NAME-config"
INITIAL_INSTANCE_COUNT=1
VARIANT_NAME="TF"
INSTANCE_TYPE="ml.r5.large" # 2vCPU + 16GB RAM + 10Gb/s

echo 'Creating enpoint config...'
# It creates endpoint configuration.
aws sagemaker create-endpoint-config \
   --endpoint-config-name $ENDPOINT_CONFIG_NAME \
   --production-variants VariantName=$VARIANT_NAME,ModelName=$MODEL_NAME,InitialInstanceCount=$INITIAL_INSTANCE_COUNT,InstanceType=$INSTANCE_TYPE \
   --data-capture-config EnableCapture=true,InitialSamplingPercentage=100,DestinationS3Uri=$MODEL_PATH,CaptureOptions=[{CaptureMode=Input},{CaptureMode=Output}]

echo 'Creating enpoint...'
ENDPOINT_NAME="$MODEL_NAME-endpoint"
# Create the endpoint
aws sagemaker create-endpoint \
   --endpoint-name $ENDPOINT_NAME \
   --endpoint-config-name $ENDPOINT_CONFIG_NAME

echo 'Waiting...'
aws sagemaker wait endpoint-in-service --endpoint-name $ENDPOINT_NAME

echo 'Configuring Endpoint Autoscaling...'
aws application-autoscaling register-scalable-target \
   --service-namespace sagemaker \
   --resource-id endpoint/$ENDPOINT_NAME/variant/$VARIANT_NAME \
   --scalable-dimension sagemaker:variant:DesiredInstanceCount \
   --min-capacity 1 \
   --max-capacity 3

sed -e "s/#edp/$ENDPOINT_NAME/g" -e "s/#vrt/$VARIANT_NAME/g" config.json > in.json

echo 'Defining Autoscaling Policy...'
aws application-autoscaling put-scaling-policy \
   --policy-name TF-CPU-Policy \
   --policy-type TargetTrackingScaling \
   --resource-id endpoint/$ENDPOINT_NAME/variant/$VARIANT_NAME \
   --service-namespace sagemaker \
   --scalable-dimension sagemaker:variant:DesiredInstanceCount \
   --target-tracking-scaling-policy-configuration file://in.json

echo 'Invoking enpoint...'
# Invoke the endpoint
aws sagemaker-runtime invoke-endpoint \
   --endpoint-name $ENDPOINT_NAME \
   --content-type=application/json \
   --body fileb://./inputs/request.json \
   /tmp/response.json

cat /tmp/response.json

echo ''
echo 'Restoring...'
# Deleting resources
#aws sagemaker delete-endpoint --endpoint-name $ENDPOINT_NAME
#aws sagemaker wait endpoint-deleted --endpoint-name $ENDPOINT_NAME
#aws sagemaker delete-endpoint-config --endpoint-config-name $ENDPOINT_CONFIG_NAME
#aws sagemaker delete-model --model-name $MODEL_NAME