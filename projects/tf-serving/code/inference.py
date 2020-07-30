# inference.py
import tensorflow as tf
import numpy as np
import requests
import base64
import json
import os

IMG_HEIGHT = 128
IMG_WIDTH = 128

imagenet_labels = None


def _get_labels():
    labels_path = tf.keras.utils.get_file(
        'ImageNetLabels.txt',
        'https://storage.googleapis.com/download.tensorflow.org/data/ImageNetLabels.txt')
    imagenet_labels = np.array(open(labels_path).read().splitlines())
    return imagenet_labels


def handler(data, context):
    """Handle request.
    Args:
        data (obj): the request data
        context (Context): an object containing request and configuration details
    Returns:
        (bytes, string): data to return to client, (optional) response content type
    """
    body = json.loads(data.read().decode('utf-8'))
    processed_input = _process_input(body, context)
    headers = {"content-type": "application/json"}
    print(context.rest_uri)
    response = requests.post(
        context.rest_uri, data=processed_input, headers=headers)
    print(response)
    return _process_output(response, context)


def _process_input(body, context):
    print(body)
    if context.request_content_type == 'application/json':

        input_url = body['input_url']
        print(input_url)
        # Converts the JSON object to an array
        # that meets the model signature.
        name_file = input_url.split('/')[-1]
        print(name_file)
        file = tf.keras.utils.get_file(name_file, input_url)
        img = tf.keras.preprocessing.image.load_img(
            file, target_size=[224, 224])
        x = tf.keras.preprocessing.image.img_to_array(img)
        x = tf.keras.applications.mobilenet.preprocess_input(
            x[tf.newaxis, ...])

        data = json.dumps(
            {"signature_name": "serving_default", "instances": x.tolist()})
        return data

    raise ValueError('{{"error": "unsupported content type {}"}}'.format(
        context.request_content_type or "unknown"))


def _process_output(data, context):
    global imagenet_labels
    if data.status_code != 200:
        raise ValueError(data.content.decode('utf-8'))

    response_content_type = context.accept_header
    print(data.text)
    response = json.loads(data.content.decode('utf-8'))
    print(response)
    predictions = np.array(response["predictions"])
    if imagenet_labels is None:
        imagenet_labels = _get_labels()
    index = np.argsort(predictions)[0, ::-1][:5]

    result = list(zip(imagenet_labels[index+1], predictions[0][index]))
    return json.dumps({"response": result}), response_content_type
