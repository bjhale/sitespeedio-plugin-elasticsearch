'use strict';

const path = require('path');
const defaultOptions = require('./defaultConfig');
const dataCollector = require('./dataCollector');
const client = require('@elastic/elasticsearch');
const transport = require('@elastic/transport/index.js');


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

    this.log.info(
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

    if(this.options.password === null) {
      this.error = true;
      this.log.error('elasticsearch.password must be defined');
    }

    if (this.error){
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

    // this.client.index({
    //   index: 'game-of-thrones',
    //   document: {
    //     character: 'Ned Stark',
    //     quote: 'Winter is coming.'
    //   }
    // });
  },

  async processMessage(message, queue) {
    switch (message.type) {
      case 'browsertime.run':
      case 'coach.run':
        break;
      case 'browsertime.pageSummary':
        await this.client.index({
          index: this.options.index,
          document: {
            '@timestamp': message.timestamp,
            url: message.data.info.browsertime.url,
            browser: message.data.info.browser.name,
            connectivity: message.data.info.connectivity.profile,
            statistics: {
              googleWebVitals: {
                cumulativeLayoutShift: message.data.statistics.googleWebVitals.cumulativeLayoutShift.mean,
                ttfb: message.data.statistics.googleWebVitals.ttfb.mean,
                largestContentfulPaint: message.data.statistics.googleWebVitals.largestContentfulPaint.mean,
                firstContentfulPaint: message.data.statistics.googleWebVitals.firstContentfulPaint.mean,
                firstInputDelay: message.data.statistics.googleWebVitals.firstInputDelay.mean,
                totalBlockingTime: message.data.statistics.googleWebVitals.totalBlockingTime.mean
              },
              coach: {
                bestpractice: message.data.statistics.coach.coachAdvice.advice.bestpractice.score.mean,
                performance: message.data.statistics.coach.coachAdvice.advice.performance.score.mean,
                privacy: message.data.statistics.coach.coachAdvice.advice.privacy.score.mean,
                total: message.data.statistics.coach.coachAdvice.advice.score.mean
              }
            }
          }
        });
        break;
      case 'sitespeedio.render':
        // this.storageManager.writeData(
        //   JSON.stringify(this.messages, null, 2),
        //   'elasticsearch-messages.json'
        // );
        break;
    }
  },
  close(options, errors) {}
};
