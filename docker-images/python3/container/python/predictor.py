import os
from uuid import UUID, SafeUUID

import flask

from db import get_model_status
from inference_service import PythonInferenceService
from monitor import monitor


def install_requirements(only_install=True):
    print('Bucket: ', os.environ.get("BUCKET"))
    print('MODEL_PREFIX: ', os.environ.get("MODEL_PREFIX"))
    print('MODEL: ', os.environ.get("MODEL"))

    inference = PythonInferenceService()
    if only_install:
        inference.get_model(bucket=os.environ.get("BUCKET"),
                            prefix=os.environ.get("MODEL_PREFIX"),
                            model=os.environ.get("MODEL"))
    else:
        inference.predict({})
    pass


# The flask app for serving predictions
app = flask.Flask(__name__)


@app.route('/ping', methods=['GET'])
def ping():
    status = 200
    variables = {
        "bucket": os.environ.get("BUCKET"),
        "model": os.environ.get("MODEL"),
        "prefix": os.environ.get("MODEL_PREFIX"),
        "main": os.environ.get("MODEL_MAIN"),
        "logsTable": os.environ.get("CHAMELEON_APP_LOGS_TABLE"),
        "projectsTable": os.environ.get("CHAMELEON_PROJECTS_TABLE"),
    }
    print(variables)

    db_model = get_model_status()
    print(db_model)

    m_path = os.path.join(
        '/opt/ml/model', os.path.join(variables['prefix'], variables['model']))
    if not os.path.exists(m_path):
        status = 404

    if not db_model:  # or db_model['status'].lower() == 'failed':
        status = 400

    return flask.Response(response='{}\n'.format(m_path), status=status, mimetype='text/plain')


@app.route('/invocations', methods=['POST'])
@monitor
def predict():
    data = None
    request_id = str(
        UUID(bytes=os.urandom(16), is_safe=SafeUUID.safe, version=4)
    )
    if flask.request.content_type == 'application/json':
        data = flask.request.get_json()
    else:
        return flask.Response(response='This predictor only supports JSON data', status=415, mimetype='text/plain')

    print(":::  REQUEST ID  :::", request_id)
    response, err = PythonInferenceService().predict(data, request_id)
    print("Error in Inference:", err)
    if response is None:
        return flask.Response(response='{"error": true}', status=200, mimetype='application/json'), request_id

    return flask.jsonify(response), request_id


if __name__ == "__main__":
    install_requirements()
