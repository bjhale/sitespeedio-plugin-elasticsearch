FROM sitespeedio/sitespeed.io:26.1.0-plus1

ENV SITESPEED_IO_PLUGINS__ADD=/lighthouse,/elasticsearch

WORKDIR /elasticsearch

RUN git clone https://github.com/bjhale/sitespeedio-plugin-elasticsearch.git .

RUN npm install --production

VOLUME ["/sitespeed.io"]

WORKDIR /sitespeed.io

