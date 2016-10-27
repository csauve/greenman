FROM centos:centos6

RUN yum install -y epel-release
RUN yum install -y nodejs npm
RUN yum install -y libicu-devel
RUN yum install -y util-linux

RUN mkdir -p /usr/local/greenman
WORKDIR /usr/local/greenman
COPY . .
RUN npm install
RUN npm install -g coffee-script

EXPOSE 8902
CMD ["coffee", "bot.coffee"]