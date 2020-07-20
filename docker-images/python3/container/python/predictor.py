import os

import flask
from python_inference_service import PythonInferenceService

# The flask app for serving predictions
app = flask.Flask(__name__)


@app.route('/ping', methods=['GET'])
def ping():
    """Determine if the container is working and healthy. In this sample container, we declare
    it healthy if we can load the model successfully."""
    status = 200
    return flask.Response(response='\n', status=status, mimetype='text/plain')


@app.route('/invocations', methods=['POST'])
def transformation():
    data = None

    if flask.request.content_type == 'application/json':
        data = flask.request.get_json()
    else:
        return flask.Response(response='This predictor only supports JSON data', status=415, mimetype='text/plain')

    # Do the prediction
    response = PythonInferenceService().predict(data)

    return flask.jsonify(result=response)
