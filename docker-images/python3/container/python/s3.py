import os
import tarfile

import boto3


def get_s3_files(bucket, prefix, model):
    files = []
    """Get the model object for this instance, loading it if it's not already loaded."""
    s3 = boto3.client('s3')
    # List objects matching your criteria
    response = s3.list_objects(
        Bucket=bucket,
        Prefix='{}/{}'.format(prefix, model).replace('//', '/')
    )

    for file in response['Contents']:
        key = file['Key']
        if key.endswith('.tar.gz'):
            destFolder = '{}/{}'.format('/opt/ml/model', prefix)
            dest = '{}/{}'.format('/opt/ml/model', key)
            os.makedirs(destFolder, exist_ok=True)
            try:
                os.remove(dest)
            except OSError:
                pass
            print("Downloading file:", key, "from bucket:", bucket)
            s3.download_file(
                Bucket=bucket,
                Key=key,
                Filename=dest
            )
            files.append(dest)

    return files
