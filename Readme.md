# Elasticsearch Plugin for sitespeed.io

Push data to elasticsearch and visualize in Kibana.

## Compatibility

This plugin is currently only compatible with elasticsearch 8.x.

## Configuration

```
 --elasticsearch.endpoint       Elasticsearch endpoint
 --elasticsearch.username       Elasticsearch username
 --elasticsearch.password       Elasticsearch password
 --elasticsearch.version        Elasticsearch version [default: 8]
 --elasticsearch.index          Elasticsearch index [default: sitespeed.io]
```

Configuration can also be done in a JSON file, see the [configuration documentation](https://www.sitespeed.io/documentation/sitespeed.io/configuration/).

## Usage

```shell
bin/sitespeed.js https://www.google.com/ --plugins.add plugins/elasticsearch --elasticsearch.endpoint https://127.0.0.1:9200 --elasticsearch.username elastic --elasticsearch.password password
```

## Docker

A periodic docker build including the elasticsearch plugin and lighthouse plugin is available at [Docker Hub](https://hub.docker.com/r/bjhale/sitespeedio-elasticsearch)

```shell
docker run --rm --shm-size=1g -v "${PWD}:/sitespeed.io" bjhale/sitespeedio-elasticsearch:latest https://www.google.com/ --elasticsearch.endpoint https://127.0.0.1:9200 --elastisearch.username elastic --elasticsearch.password password
```

## Setup

  1. Run sitespeed.io with elasticsearch plugin enabled. During the run, indexes and mappings will be created automatically.
  2. Import dashboard.ndjson into Kibana via Stack Management > Saved Objects to use pre-built dashboard.