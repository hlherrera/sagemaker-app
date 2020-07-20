import os
import pickle

labels = ["setosa", "versicolor", "virginica"]


def inference(payload):
    measurements = [
        payload["sepal_length"],
        payload["sepal_width"],
        payload["petal_length"],
        payload["petal_width"],
    ]

    model = pickle.load(open("model.pkl", "rb"))

    labelId = model.predict([measurements])[0]
    return labels[labelId]
