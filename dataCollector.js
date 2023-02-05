'use strict';

const util = require('util');

module.exports = class DataCollector {
  constructor(props) {
    this.urls = {};
  }

  getUrls() {
    return Object.keys(this.urls);
  }

  getUrlData(url) {
    return this.urls[url];
  }

  getData() {
    return this.urls;
  }

  _addUrl(url) {
    if (!this.urls[url]) {
      this.urls[url] = {};
    }
  }

  processLighthousePageSummary(message) {
    this._addUrl(message.url);

    let lighthouse = {};

    lighthouse.categories = {};
    Object.entries(message.data.categories).map(([key,value]) => {
      lighthouse.categories[key] = value.score;
    });

    lighthouse.audits = {};
    Object.entries(message.data.audits).map(([key,value]) => {
      lighthouse.audits[key] = {};
      lighthouse.audits[key].score = value.score;
      if (value.numericValue) {
        lighthouse.audits[key].value = value.numericValue;
      }
    });

    this.urls[message.url]['lighthouse'] = lighthouse;
  }

  processBrowsertimePageSummary(message) {
    this._addUrl(message.url);

    const statistics = this._condenseStatisticsRecursive(
      message.data.statistics
    );

    this.urls[message.url]['@timestamp'] = message.timestamp;
    this.urls[message.url]['url'] = message.url;
    this.urls[message.url]['domain'] = message.group;
    this.urls[message.url]['connectivity'] = message.data.info.connectivity.profile;
    this.urls[message.url]['browser'] = message.data.info.browser.name;
    this.urls[message.url]['statistics'] = statistics;

    // console.log(util.inspect(data, { depth: null }));
    // process.exit();
  }

  _condenseStatisticsRecursive(data) {
    // Escape when data.mean exists.
    if (data.mean || data.mean === 0) {
      return data.mean;
    }

    // Escape when encountering an array as arrays are typically not useful.
    if (Array.isArray(data)) {
      return null;
    }

    let d = {};

    Object.entries(data).map(([key, value]) => {
      const recursiveResult = this._condenseStatisticsRecursive(value);

      // Eliminate null value keys from returned data.
      if (recursiveResult === null) {
        return;
      }

      d[key] = recursiveResult;
    });

    return d;
  }
};
