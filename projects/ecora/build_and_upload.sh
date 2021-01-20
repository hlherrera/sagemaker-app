#!/usr/bin/env bash

MODEL=${1:-"ecora"}
ROOT=$PWD

BUCKET="23people-model"
MODEL_PREFIX="ecora"

MODEL_PATH="s3://${BUCKET}/${MODEL_PREFIX}"
MODEL_DATA_URL="s3://${BUCKET}/${MODEL_PREFIX}/${MODEL}.tar.gz"


cd $ROOT/projects/ecora/src/
echo 'Compressing model...'
tar -cf ${MODEL}.tar.gz --exclude=${MODEL}.tar.gz .

echo 'Uploading model...'
aws s3 cp "./${MODEL}.tar.gz" $MODEL_DATA_URL