#!/bin/sh

$(aws ecr get-login --region us-east-1 --no-include-email)
docker build -t greenman .
docker tag greenman:latest 504811786459.dkr.ecr.us-east-1.amazonaws.com/greenman:latest
docker push 504811786459.dkr.ecr.us-east-1.amazonaws.com/greenman:latest

#to debug: docker run -it greenman /bin/bash
