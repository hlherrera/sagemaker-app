import boto3

client = boto3.client('sagemaker')


def handler(event, context):
    print('event: ', event)
    cham_project = event['appClient']
    model_name = event['clientModel']['modelName']
    model_type = event['clientModel']['type']

    endpoint_config_name = '{}{}-{}-{}{}-cfg'.format(
        cham_project[:8], cham_project[-12:], model_type, model_name[:8], model_name[-12:])
    endpoint_name = endpoint_config_name.replace('-cfg', '')

    destroy_chameleon_model(endpoint_name, endpoint_config_name, model_name)


def destroy_chameleon_model(endpoint_name, endpoint_config_name, model_name):
    print('Deleting model endpoint...')

    try:
        response = client.describe_endpoint(EndpointName=endpoint_name)
        if response and response['EndpointConfigName'] == endpoint_config_name:
            client.delete_endpoint(EndpointName=endpoint_name)
            client.delete_endpoint_config(
                EndpointConfigName=endpoint_config_name)
            client.delete_model(ModelName=model_name)
        else:
            print("The endpoint {}, does not  exist".format(endpoint_name))
    except Exception as e:
        print(e)
        print('Unable to delete endpoint.')
        raise e
