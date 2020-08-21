import boto3
import functions.db.chameleon_saver as db
autoscaling = boto3.client('application-autoscaling')

MODEL_STATUS_IN_SERVICE = 'IN_SERVICE'

MODEL_STATUS = {
    'CREATING': 'Creating',
    'UPDATING': 'Updating',
    'DELETING': 'Deleted',
    'DELETED': 'Deleted',
    'IN_SERVICE': 'Ready',
    'FAILED': 'Failed',
}


def handler(event, context):

    print('event: ', event)
    endpoint = event['detail']['EndpointName']
    endpoint_config = event['detail']['EndpointConfigName']
    endpoint_status = event['detail']['EndpointStatus']

    status = MODEL_STATUS[endpoint_status]

    if 'modelName' in event['detail']['Tags']:
        model_id = event['detail']['Tags']['modelName']
        app_id = event['detail']['Tags']['appClient']
        db.update_status_model(app_id, model_id, status, status == 'Deleted')
        if status == "Deleted":
            db.delete_model_monitor_logs(app_id, model_id)

    if endpoint_status == MODEL_STATUS_IN_SERVICE:
        app_id = event['detail']['Tags']['appClient']
        auto_scale(endpoint, app_id)

    return {
        'endpoint': endpoint
    }


def auto_scale(endpoint, app_id):

    autoscaling.register_scalable_target(
        ServiceNamespace='sagemaker',
        ResourceId='endpoint/{}/variant/{}'.format(endpoint, app_id),
        ScalableDimension='sagemaker:variant:DesiredInstanceCount',
        MinCapacity=1,
        MaxCapacity=4
    )

    response = autoscaling.put_scaling_policy(
        PolicyName=endpoint,
        PolicyType='TargetTrackingScaling',
        ResourceId='endpoint/{}/variant/{}'.format(endpoint, app_id),
        ScalableDimension='sagemaker:variant:DesiredInstanceCount',
        ServiceNamespace='sagemaker',
        TargetTrackingScalingPolicyConfiguration={
            "TargetValue": 70,
            "CustomizedMetricSpecification": {
                "MetricName": "CPUUtilization",
                "Namespace": "/aws/sagemaker/Endpoints",
                "Dimensions": [
                    {"Name": "EndpointName", "Value": endpoint},
                    {"Name": "VariantName", "Value": app_id}
                ],
                "Statistic": "Average",
                "Unit": "Percent"
            }
        }
    )
    return response
