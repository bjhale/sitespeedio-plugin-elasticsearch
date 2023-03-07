'use strict';

const path = require('path');
const defaultOptions = require('./defaultConfig');
const dataCollector = require('./dataCollector');
const client = require('@elastic/elasticsearch');
const setup = require('./setup');

module.exports = {
  name() {
    return path.basename(__dirname);
  },
  open(context, options) {
    this.options = {
      ...defaultOptions.elasticsearch,
      ...options.elasticsearch
    };
    this.storageManager = context.storageManager;
    this.dataCollector = new dataCollector();
    this.error = false;

    this.log = context.intel.getLogger('sitespeedio.plugin.elasticsearch');

    this.log.debug(
      `Elasticsearch Configuration: ${JSON.stringify(this.options)}`
    );

    if (this.options.endpoint === null) {
      this.error = true;
      this.log.error('elasticsearch.endpoint must be defined');
    }

    if (this.options.username === null) {
      this.error = true;
      this.log.error('elasticsearch.username must be defined');
    }

    if (this.options.password === null) {
      this.error = true;
      this.log.error('elasticsearch.password must be defined');
    }

    if (this.error) {
      process.exit();
    }

    this.client = new client.Client({
      node: this.options.endpoint,
      auth: {
        username: this.options.username,
        password: this.options.password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    if (this.options.setup) {
      setup(this.client, this.log);
    }
  },

  async processMessage(message, queue) {
    console.log(message.type);

    switch (message.type) {
      case 'browsertime.pageSummary':
        this.dataCollector.processBrowsertimePageSummary(message);
        break;
      case 'lighthouse.pageSummary':
        this.dataCollector.processLighthousePageSummary(message);
        break;
      case 'pagexray.pageSummary':
        this.dataCollector.processPagexrayPageSummary(message);
        break;
      case 'sitespeedio.render':
        // eslint-disable-next-line no-case-declarations
        let urls = this.dataCollector.getUrls();
        console.log('Sending to Elasticseaarch');
        for (const url of urls) {
          await this.client.index({
            index: this.options.index,
            document: this.dataCollector.getUrlData(url)
          });
        }

        await this.storageManager.writeData(
          JSON.stringify(this.dataCollector.getData(), null, 2),
          'elasticsearch.json'
        );

        await this.storageManager.writeData(
          JSON.stringify(this.dataCollector.getDebugData(), null, 2),
          'elasticsearch-debug.json'
        );
        break;
    }
  },
  close(options, errors) {}
};
