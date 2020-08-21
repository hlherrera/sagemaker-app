#!/bin/bash
STAGE=${1:-"dev"}

if [ $? -ne 0 ]
then
    STAGE="dev"
fi
SLS_DEBUG=* && node_modules/.bin/sls deploy --stage STAGE