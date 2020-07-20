import importlib
import os
import subprocess
import sys
from shutil import rmtree, unpack_archive

import boto3
from colorama import init
from termcolor import colored

from s3 import get_s3_files

init(autoreset=True)

prefix = '/opt/ml/'
model_path = os.path.join(prefix, 'model')


def callfunc(myfile, myfunc, *args):
    secret = os.environ.get('AWS_SECRET_ACCESS_KEY')
    id = os.environ.get('AWS_ACCESS_KEY_ID')
    os.environ['AWS_SECRET_ACCESS_KEY'] = ''
    os.environ['AWS_ACCESS_KEY_ID'] = ''

    pathname, filename = os.path.split(myfile)
    sys.path.append(os.path.abspath(pathname))
    modname = os.path.splitext(filename)[0]
    mymod = importlib.import_module(modname)
    result = getattr(mymod, myfunc)(*args)

    os.environ['AWS_SECRET_ACCESS_KEY'] = secret or ''
    os.environ['AWS_ACCESS_KEY_ID'] = id or ''

    return result


def install_requirements():
    try:
        subprocess.check_call([sys.executable, "-m", "pip",
                               "install", "-r", "requirements.txt"],
                              stdout=subprocess.DEVNULL
                              # stderr=subprocess.DEVNULL
                              )
    except:
        pass


class PythonInferenceService(object):

    def get_model(self, bucket, prefix, model):
        """Get the model object for this instance, loading it if it's not already loaded."""
        print("Getting model from bucket:", colored(bucket, 'green'))
        files = get_s3_files(bucket, prefix, model)
        m_path = os.path.join(model_path, os.path.join(prefix, model))
        print("Unpacking tar.gz to: ", colored(m_path, 'green'))
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
        print('Init request.')
        print('Request data: ', colored(request, 'green'))

        result = ''
        bucket = request['bucket']
        prefix = request['prefix']
        model = request['model']
        main_program = request['main']

        m_path = self.get_model(bucket, prefix, model)
        cwd = os.getcwd()
        os.chdir(m_path)
        print("Moving to Working Directory ", colored(os.getcwd(), 'green'))

        print("Calling Predictor Function(inference): ", colored(model, 'green'))
        result = callfunc("{}.{}".format(main_program, 'py'),
                          "inference", {k: request['params'][k] for k in request['params']})
        print('Result: ', colored(result, 'yellow'))
        #
        os.chdir(cwd)
        print("Moving to initial Working Directory ",
              colored(os.getcwd(), 'green'))
        print('End request.')
        return result
