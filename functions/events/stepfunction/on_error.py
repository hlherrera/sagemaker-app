import boto3
import json
import functions.db.chameleon_saver as db
client = boto3.client('events')


def handler(event, context):
    print('event: ', event)
    input = event['detail']['input']
    print('input: ', input)
    error_message = 'error'
    data = json.loads(input)
    app_id = data["appClient"]
    model_id = data['clientModel']['modelName']
    if event['detail']['status'] == 'FAILED':
        db.update_status_model(
            app_id=app_id, model_id=model_id, status='failed', soft_delete=False, status_message=error_message
        )

        response = client.put_events(
            Entries=[{
                'Source': 'aws.sagemaker',
                'Resources': [
                    'arn:aws:events:us-east-1:657799620713:event-bus/default',
                ],
                'DetailType': 'SageMaker Endpoint State Change',
                'Detail': json.dumps({
                    "AppId": app_id,
                    "ModelId": model_id,
                    "Message": error_message
                }),
                'EventBusName': 'default'
            },
            ]
        )

        print('response: ', response)
