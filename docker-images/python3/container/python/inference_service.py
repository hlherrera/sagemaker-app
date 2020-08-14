
import os
import subprocess
import sys
from shutil import rmtree, unpack_archive
import json
import boto3
import s3
from db import put_app_log
from error import error_handler
from invoker import invoke


prefix = '/opt/ml/'
model_path = os.path.join(prefix, 'model')
context = {}


@error_handler('Dependencies')
def install_requirements():
    subprocess.check_call(
        [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"]
    )


class PythonInferenceService(object):

    @error_handler("Model Package")
    def get_model(self, bucket, prefix, model):
        global model_path
        print("Getting model from bucket:", bucket)
        m_path = os.path.join(model_path, os.path.join(prefix, model))
        if os.path.exists(m_path):
            return m_path

        model_file = s3.get_s3_file(bucket, prefix, model)
        print("Unpacking tar.gz to: ", m_path)
        rmtree(m_path, ignore_errors=True)
        unpack_archive(model_file, m_path)

        cwd = os.getcwd()
        os.chdir(m_path)
        print("Installing model requirements:")
        install_requirements()
        os.chdir(cwd)

        return m_path

    @error_handler("Prediction Function")
    def predict(self, request, request_id=None):
        global context
        print('Init request.')
        print('Request data: ', request)
        result = {}

        bucket = os.environ.get("BUCKET")
        prefix = os.environ.get("MODEL_PREFIX")
        model = os.environ.get("MODEL")
        main_program = os.environ.get("MODEL_MAIN")
        appId = os.environ.get('APP_CLIENT', 'client-app')

        cwd = os.getcwd()
        m_path = self.get_model(bucket, prefix, model)
        os.chdir(m_path)
        print("Moved to Function Working Directory ", os.getcwd())

        if 'params' in request:
            print(
                f"Calling handler functions implemented in script: '{main_program}' of model: '{model}'"
            )
            result, output, elapsed_time = invoke("{}.py".format(main_program), {
                k: request['params'][k] for k in request['params']
            })
            print('Result: ', result)
            print(f"Setting output log for custom handlers in app: {appId}")
            put_app_log(request_id, output, elapsed_time, bool(result))
        else:
            result = invoke("{}.py".format(main_program), {})
        #
        os.chdir(cwd)
        print(f"Moving to initial Working Directory {os.getcwd()}")
        print('End request.')
        return result or {}
