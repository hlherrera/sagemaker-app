
import os
import subprocess
import sys
from shutil import rmtree, unpack_archive

import boto3
import s3
from db import put_app_log
from invoker import invoke

prefix = '/opt/ml/'
model_path = os.path.join(prefix, 'model')
context = {}


def install_requirements():
    try:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"]
        )
    except:
        pass


class PythonInferenceService(object):

    def get_model(self, bucket, prefix, model):
        global model_path
        """Get the model object for this instance, loading it if it's not already loaded."""
        print("Getting model from bucket:", bucket)

        m_path = os.path.join(model_path, os.path.join(prefix, model))
        if os.path.exists(m_path):
            return m_path

        files = s3.get_s3_files(bucket, prefix, model)
        print("Unpacking tar.gz to: ", m_path)
        for f in files:
            rmtree(m_path, ignore_errors=True)
            unpack_archive(f, m_path)

        cwd = os.getcwd()
        os.chdir(m_path)
        print("Installing model requirements:")
        install_requirements()
        os.chdir(cwd)

        return m_path

    def predict(self, request):
        global context
        print('Init request.')
        print('Request data: ', request)

        bucket = request['bucket']
        prefix = request['prefix']
        model = request['model']
        main_program = request['main']
        appId = os.environ.get('APP_CLIENT', 'client-app')

        m_path = self.get_model(bucket, prefix, model)
        cwd = os.getcwd()
        os.chdir(m_path)
        print("Moved to Function Working Directory ", os.getcwd())

        print(
            f"Calling handler functions implemented in script: '{main_program}' of model: '{model}'"
        )
        result, output = invoke("{}.py".format(main_program), {
            k: request['params'][k] for k in request['params']
        }, context)
        print('Result: ', result)

        print(f"Setting output log for custom handlers in app: {appId}", )
        put_app_log(output, os.environ.get('APP_CLIENT', 'client-app'))
        #
        os.chdir(cwd)
        print(f"Moving to initial Working Directory {os.getcwd()}")
        print('End request.')
        return result
