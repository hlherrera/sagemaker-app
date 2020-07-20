import os
import re
import boto3

EXECUTION_ROLE = 'arn:aws:iam::657799620713:role/service-role/AmazonSageMaker-ExecutionRole-20190805T172704'
INSTANCE_TYPE = 'ml.t2.medium'
SINGLE_MODELS = ['python3']

sagemaker = boto3.client('sagemaker')
ecr = boto3.client('ecr')


def deploy(event, context):
    app_client = event['appClient']
    model_name = event['clientModel']['modelName']
    model_type = event['clientModel']['type']

    repositories = ecr.describe_repositories()
    [r] = list(filter(lambda item: item['repositoryName'] == model_type,
                      repositories['repositories']))
    container = '{}:latest'.format(r['repositoryUri'])

    print('Creating model resource from training artifact...')
    create_model(model_name, container, event)

    print('Creating endpoint configuration...')
    endpoint_config_name = '{}{}-{}-{}{}-cfg'.format(
        app_client[:8], app_client[-12:], model_type, model_name[:8], model_name[-12:])
    create_endpoint_config(endpoint_config_name, model_name, app_client)

    print('Creating new model endpoint...')
    endpoint_name = endpoint_config_name.replace('cfg', 'ep')
    create_endpoint(endpoint_name, endpoint_config_name)

    event['status'] = 'Creating'
    event['message'] = 'Started deploying model "{}" to endpoint'.format(
        model_name)

    return event


def create_model(name, container, event):
    expr = re.search(r"^s3://([\w_\.-]+)/", event['chameleonStorage']['key'])
    try:
        primary_container = {
            'Image': container,
            'Environment': {
                'bucket': os.environ.get('BUCKET_MODELS', expr[1]),
                'model': event['clientModel']['modelName'],
                'main': event['clientModel']['mainProgram'],
                'prefix': '{}/'.format(event['clientModel']['prefix']).replace('//', '/')
            }
        }

        if event['clientModel']['type'] not in SINGLE_MODELS:
            primary_container['ModelDataUrl'] = event['chameleonStorage']['key']
            primary_container['Mode'] = 'MultiModel'

        sagemaker.create_model(
            ModelName=name, PrimaryContainer=primary_container, ExecutionRoleArn=EXECUTION_ROLE
        )
    except Exception as e:
        print(e)
        print('Unable to create model.')
        raise(e)


def create_endpoint_config(endpoint_config_name, model_name, app_client):
    try:
        sagemaker.create_endpoint_config(
            EndpointConfigName=endpoint_config_name,
            ProductionVariants=[
                {
                    'VariantName': app_client,
                    'ModelName': model_name,
                    'InitialInstanceCount': 1,
                    'InstanceType': INSTANCE_TYPE
                }
            ]
        )
    except Exception as e:
        print(e)
        print('Unable to create endpoint configuration.')
        raise(e)


def create_endpoint(endpoint_name, config_name):
    try:
        sagemaker.create_endpoint(
            EndpointName=endpoint_name,
            EndpointConfigName=config_name
        )
    except Exception as e:
        print(e)
        print('Unable to create endpoint.')
        raise(e)


def wait_endpoint(endpoint_name):
    try:
        waiter = sagemaker.get_waiter('endpoint_in_service')
        waiter.wait(
            EndpointName=endpoint_name,
            WaiterConfig={
                'Delay': 20,
                'MaxAttempts': 3
            }
        )
    except Exception as e:
        print(e)
        raise(e)
