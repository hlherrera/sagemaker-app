import numpy as np
from joblib import load

labels = ['anexo', 'cedula', 'certificado afc', 'certificado afp',
          'certificado de afiliación de salud', 'certificado de antecedentes',
          'certificado de estudios', 'consentimiento de alcohol y drogas', 'contrato',
          'currículum vitae', 'curso', 'descriptor del cargo',
          'documento de entrega epp', 'examen', 'ficha odi', 'ficha personal',
          'finiquito', 'miscelaneas', 'reglamento interno']


def scale(values):
    return 1 - (np.max(values) - values)/(np.max(values) - np.min(values))


def predict_mn(doc, model, count_vec):
    prob = model.predict_proba(count_vec.transform(doc))
    idx = np.argsort(prob)[0, ::-1][:5]
    return (list([(labels[i], prob[0][i]) for i in idx]))


def predict_svc(doc, model, tf_idf_vec):
    vector = tf_idf_vec.transform(doc).toarray()
    densities = model.decision_function(vector.reshape(1, -1))
    idx = np.argsort(densities)[0, ::-1][:5]
    t = scale(densities)
    prob = (t/t.sum())[0]

    return (list([(labels[i], prob[i]) for i in idx]))


def load_model():
    print('Loading model...')

    naive = load('naivebayes.model', )
    svc = load('linearsvc.model')
    count_vec = load('counter.vec')
    tf_idf_vec = load('tfidf.vec')
    return [naive, svc, count_vec, tf_idf_vec]


def inference(models, payload, context):
    print("Input parameters: {}".format(payload))
    doc = [payload["doc"]]
    is_naive = True if 'naive' in payload and payload[
        "naive"] is not None and payload["naive"] is not False else False

    [naive, svc, count_vec, tf_idf_vec] = models

    print("Predicting class...")
    if not is_naive:
        print('Predict using Simple Linear Vector Machine model...')
        return predict_svc(doc, svc, tf_idf_vec)
    else:
        print('Predict using Naive Bayes model...')
        return predict_mn(doc, naive, count_vec)
