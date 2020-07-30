#!/usr/bin/env bash

# ./build_and_push.sh python3
image=${1:-python3}

cd "$PWD/docker-images/$image/container"

chmod +x python/serve
echo  'Get AWS Account'
# Get the account number associated with the current IAM credentials
account=$(aws sts get-caller-identity --query Account --output text)

if [ $? -ne 0 ]
then
    exit 255
fi

echo  'Get AWS Region'
# Get the region defined in the current configuration (default to us-west-2 if none defined)
region=$(aws configure get region)
region=${region:-us-east-1}

account_repository="${account}.dkr.ecr.${region}.amazonaws.com"
fullname="${account_repository}/${image}:latest"

# If the repository doesn't exist in ECR, create it.

echo  'Get AWS Repositories'
aws ecr describe-repositories --repository-names "${image}" > /dev/null 2>&1

if [ $? -ne 0 ]
then
    aws ecr create-repository --repository-name "${image}" > /dev/null
fi

# Build the docker image locally with the image name and then push it to ECR
# with the full name.

echo 'Building...'
docker build --rm -t ${image} .
docker tag ${image} ${fullname}

#echo 'Pushing...'
# Get the login command from ECR and execute it directly
$(aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${account_repository} > /dev/null)

docker push ${fullname}
