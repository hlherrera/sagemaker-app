FROM lambci/lambda:build-nodejs12.x

ENV NODE_ENV=development

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install -g serverless typescript

COPY package*.json ./
COPY . .
RUN rm -f node_modules
RUN npm ci
#RUN cat .lambdaignore | xargs zip -9qyr lambda.zip . -x
#CMD aws lambda update-function-code --function-name mylambda --zip-file fileb://lambda.zip

# 1st - STEP
# docker build -t doc .

# 2nd - STEP
# docker run --env-file ./.env doc sls deploy
RUN chmod +x ./start.sh

CMD ["./start.sh"]