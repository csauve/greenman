FROM centos:centos6

# install ffmpeg: https://hub.docker.com/r/lambdadriver/docker-ffmpeg-centos/~/dockerfile/
RUN yum install -y autoconf automake gcc gcc-c++ git libtool make nasm pkgconfig zlib-devel
RUN mkdir /root/ffmpeg_sources
WORKDIR /root/ffmpeg_sources
RUN git clone --depth 1 git://github.com/yasm/yasm.git
RUN cd yasm && \
  autoreconf -fiv && \
  ./configure && \
  make && \
  make install
RUN curl -L -O http://downloads.sourceforge.net/project/lame/lame/3.99/lame-3.99.5.tar.gz
RUN tar xzvf lame-3.99.5.tar.gz
RUN cd lame-3.99.5 && \
  ./configure --disable-shared --enable-nasm && \
  make && \
  make install
RUN git clone --depth 1 git://source.ffmpeg.org/ffmpeg
ENV PKG_CONFIG_PATH /usr/local/lib/pkgconfig
RUN cd ffmpeg &&\
  ./configure --enable-gpl --enable-nonfree --enable-libmp3lame &&\
  make &&\
  make install &&\
  hash -r
WORKDIR /root
RUN rm -rf /root/ffmpeg_sources

# install graphicsmagick: https://hub.docker.com/r/colyn/docker-centos-nodejs-gm-base/~/dockerfile/
RUN yum install -y wget tar gcc libpng libjpeg libpng-devel libjpeg-devel ghostscript libtiff libtiff-devel freetype freetype-devel
RUN wget http://sourceforge.net/projects/graphicsmagick/files/graphicsmagick/1.3.21/GraphicsMagick-1.3.21.tar.gz \
  && tar zxvf GraphicsMagick-1.3.21.tar.gz \
  && cd GraphicsMagick-1.3.21 \
  && ./configure --enable-shared \
  && make && make install

# install node
RUN curl --silent --location https://rpm.nodesource.com/setup_6.x | bash -
RUN yum install -y nodejs
RUN yum install -y epel-release
RUN yum install -y libicu-devel
RUN yum install -y util-linux

RUN mkdir -p /usr/local/greenman
WORKDIR /usr/local/greenman
COPY . .
RUN npm install

EXPOSE 8902
CMD ["node", "bot.js"]
