#!/usr/bin/env bash

name=$1

if [ "$name" == "" ]
then
    echo "Usage: $0 <name-model>"
    exit 1
fi

cd src

#compress all files(create tar.gz)
tar -cf ${name}.tar.gz --exclude=${name}.tar.gz .

#upload to s3
aws s3 cp ${name}.tar.gz s3://23people-model/python/ 