import os

import flask
from inference_service import PythonInferenceService
from monitor import monitor


def install_requirements():
    # Your code
    inference = PythonInferenceService()
    model_path = inference.get_model(
        bucket=os.environ.get("BUCKET"),
        model=os.environ.get("MODEL"),
        prefix=os.environ.get("MODEL_PREFIX")
    )
    print(model_path)
    pass


# The flask app for serving predictions
app = flask.Flask(__name__)


@app.route('/ping', methods=['GET'])
def ping():
    """Determine if the container is working and healthy. In this sample container, we declare
    it healthy if we can load the model successfully."""
    response = flask.jsonify(
        result={
            "bucket": os.environ.get("BUCKET"),
            "model": os.environ.get("MODEL"),
            "prefix": os.environ.get("MODEL_PREFIX"),
            "main": os.environ.get("MODEL_MAIN"),
            "logsTable": os.environ.get("CHAMELEON_APP_LOGS_TABLE")
        }
    )
    print({
        "bucket": os.environ.get("BUCKET"),
        "model": os.environ.get("MODEL"),
        "prefix": os.environ.get("MODEL_PREFIX"),
        "main": os.environ.get("MODEL_MAIN"),
        "logsTable": os.environ.get("CHAMELEON_APP_LOGS_TABLE")
    })
    return response


@app.route('/invocations', methods=['POST'])
@monitor
def predict():
    data = None

    if flask.request.content_type == 'application/json':
        data = flask.request.get_json()
    else:
        return flask.Response(response='This predictor only supports JSON data', status=415, mimetype='text/plain')

    # Do the prediction
    response = PythonInferenceService().predict(data)

    return flask.jsonify(response)


if __name__ == "__main__":
    install_requirements()
