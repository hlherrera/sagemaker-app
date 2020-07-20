%%sh -s $ALGORITHM_NAME

algorithm_name=$1

account=$(aws sts get-caller-identity --query Account --output text)

# Get the region defined in the current configuration (default to us-west-2 if none defined)
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
# with the full image name.

# First clear out any prior version of the cloned repo
rm -rf sagemaker-scikit-learn-container/

# Clone the sklearn container repo
git clone --single-branch --branch mme https://github.com/aws/sagemaker-scikit-learn-container.git
cd sagemaker-scikit-learn-container/

# Build the "base" container image that encompasses the installation of the
# scikit-learn framework and all of the dependencies needed.
docker build -q -t sklearn-base:0.20-2-cpu-py3 -f docker/0.20-2/base/Dockerfile.cpu --build-arg py_version=3 .

# Create the SageMaker Scikit-learn Container Python package.
python setup.py bdist_wheel --universal

# Build the "final" container image that encompasses the installation of the
# code that implements the SageMaker multi-model container requirements.
docker build -q -t ${algorithm_name} -f docker/0.20-2/final/Dockerfile.cpu .

docker tag ${algorithm_name} ${ecr_image}

docker push ${ecr_image}