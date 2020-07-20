%%sh -s $ALGORITHM_NAME

algorithm_name=$1

account=$(aws sts get-caller-identity --query Account --output text)

# Get the region defined in the current configuration
region=$(aws configure get region)

ecr_image="${account}.dkr.ecr.${region}.amazonaws.com/${algorithm_name}:latest"

# If the repository doesn't exist in ECR, create it.
aws ecr describe-repositories --repository-names "${algorithm_name}" > /dev/null 2>&1

if [ $? -ne 0 ]
then
    aws ecr create-repository --repository-name "${algorithm_name}" > /dev/null
fi

# Get the login command from ECR and execute it directly
$(aws ecr get-login --region ${region} --no-include-email --registry-ids ${account})

# Build the docker image locally with the image name and then push it to ECR
# with the full name.

# First clear out any prior version of the cloned repo
rm -rf sagemaker-mxnet-serving-container/

# Clone the container repo
git clone https://github.com/aws/sagemaker-mxnet-serving-container
cd sagemaker-mxnet-serving-container/

cp -r docker/artifacts/* docker/1.6.0/py3
cd docker/1.6.0/py3

# Build 
docker build -t ${algorithm_name} -f Dockerfile.cpu .

docker tag ${algorithm_name} ${ecr_image}

docker push ${ecr_image}