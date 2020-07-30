import os

import numpy as np
import tensorflow as tf


pretrained_model = tf.keras.applications.MobileNet()
mobilenet_save_path = os.path.join('.', "mobilenet/1/")
tf.saved_model.save(pretrained_model, mobilenet_save_path)

loaded = tf.saved_model.load(mobilenet_save_path)
print(list(loaded.signatures.keys()))

labels_path = tf.keras.utils.get_file(
    'ImageNetLabels.txt',
    'https://storage.googleapis.com/download.tensorflow.org/data/ImageNetLabels.txt')
imagenet_labels = np.array(open(labels_path).read().splitlines())

infer = loaded.signatures["serving_default"]
print(infer.structured_outputs)


file = tf.keras.utils.get_file(
    "grace_hopper.jpg",
    "https://storage.googleapis.com/download.tensorflow.org/example_images/grace_hopper.jpg")
img = tf.keras.preprocessing.image.load_img(file, target_size=[224, 224])
x = tf.keras.preprocessing.image.img_to_array(img)
x = tf.keras.applications.mobilenet.preprocess_input(
    x[tf.newaxis, ...])

labeling = infer(tf.constant(x))[pretrained_model.output_names[0]]
decoded = imagenet_labels[np.argsort(labeling)[0, ::-1][:5]+1]
print("Result after saving and loading:\n", decoded.tolist())
