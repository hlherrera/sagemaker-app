import os
import re
import boto3

INSTANCE_TYPE = 'ml.t2.medium'

sagemaker = boto3.client('sagemaker')
ecr = boto3.client('ecr')


def handler(event, context):
    app_client = event['appClient']
    model_name = event['clientModel']['modelName']
    model_type = event['clientModel']['type']
    model_instance = event['clientModel']['instanceType']

    repositories = ecr.describe_repositories()
    [r] = list(filter(lambda item: item['repositoryName'] == model_type,
                      repositories['repositories']))
    container = '{}:latest'.format(r['repositoryUri'])

    print('Creating model resource from training artifact...')
    create_model(container, event)

    print('Creating endpoint configuration...')
    endpoint_config_name = '{}{}-{}-{}{}-cfg'.format(
        app_client[:8], app_client[-12:], model_type, model_name[:8], model_name[-12:])
    create_endpoint_config(endpoint_config_name, event, model_instance)

    print('Creating new model endpoint...')
    create_endpoint(endpoint_config_name, event)

    return event


def create_model(container, event):
    expr = re.search(r"^s3://([\w_\.-]+)/", event['chameleonStorage']['key'])
    try:
        primary_container = {
            'Image': container,
            'Environment': {
                'CHAMELEON_APP_LOGS_TABLE': os.environ.get('CHAMELEON_APP_LOGS_TABLE'),
                'MONGO_DB_URL': os.environ.get('MONGO_DB_URL'),
                'MONGO_DB_USER': os.environ.get('MONGO_DB_USER'),
                'MONGO_DB_PASS': os.environ.get('MONGO_DB_PASS'),
                'MONGO_DB_NAME': os.environ.get('MONGO_DB_NAME'),
                'EVENT_BUS_SOURCE': os.environ.get('EVENT_BUS_SOURCE'),
                'EVENT_BUS_NAME': os.environ.get('EVENT_BUS_NAME'),
                'EVENT_BUS_TYPE': os.environ.get('EVENT_BUS_TYPE'),
                'APP_CLIENT': event['appClient'],
                'BUCKET': os.environ.get('BUCKET', expr[1]),
                'MODEL': event['clientModel']['modelName'],
                'MODEL_MAIN': event['clientModel']['mainProgram'],
                'MODEL_PREFIX': '{}/'.format(event['clientModel']['prefix']).replace('//', '/')
            }
        }

        sagemaker.create_model(
            ModelName=event['clientModel']['modelName'],
            PrimaryContainer=primary_container,
            ExecutionRoleArn=os.environ.get('EXECUTION_ROLE'),
        )
    except Exception as e:
        print(e)
        print('Unable to create model.')
        raise e


def create_endpoint_config(endpoint_config_name, event, model_instance):
    app_id = event['appClient']
    model_name = event['clientModel']['modelName']
    bucket = os.environ.get('BUCKET')
    try:
        sagemaker.create_endpoint_config(
            EndpointConfigName=endpoint_config_name,
            ProductionVariants=[{
                'VariantName': app_id,
                'ModelName': model_name,
                'InitialInstanceCount': 1,
                'InstanceType': model_instance or INSTANCE_TYPE
            }],
            DataCaptureConfig={
                'EnableCapture': False,  # @todo
                'InitialSamplingPercentage': 100,
                'DestinationS3Uri': 's3://{}/{}'.format(bucket, app_id),
                'CaptureOptions': [{'CaptureMode': 'Input'}, {'CaptureMode': 'Output'}]
            },
            Tags=[{'Key': 'type', 'Value': event['clientModel']['type']}]
        )
    except Exception as e:
        print(e)
        print('Unable to create endpoint configuration.')
        raise e


def create_endpoint(endpoint_config_name, event):
    print('Creating new model endpoint...')
    endpoint_name = endpoint_config_name.replace('-cfg', '')
    try:
        sagemaker.create_endpoint(
            EndpointName=endpoint_name,
            EndpointConfigName=endpoint_config_name,
            Tags=[{
                "Key": "appClient", "Value": event['appClient']
            }, {
                "Key": "modelName", "Value": event['clientModel']['modelName']
            }]
        )
    except Exception as e:
        print(e)
        print('Unable to create endpoint.')
        raise e


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
        raise e