'use strict';

module.exports = class DataCollector {
  constructor() {
    this.urls = {};
    this.debug = {};
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

  getDebugData() {
    return this.debug;
  }

  _addUrl(url) {
    if (!this.urls[url]) {
      this.urls[url] = {};
    }
    if (!this.debug[url]) {
      this.debug[url] = {};
    }
  }

  processLighthousePageSummary(message) {
    this._addUrl(message.url);

    let lighthouse = {};

    lighthouse.categories = {};
    Object.entries(message.data.categories).map(([key, value]) => {
      lighthouse.categories[key] = value.score;
    });

    lighthouse.audits = {};
    Object.entries(message.data.audits).map(([key, value]) => {
      lighthouse.audits[key] = {};
      lighthouse.audits[key].score = value.score;
      if (value.numericValue) {
        lighthouse.audits[key].value = value.numericValue;
      }
    });

    this.debug[message.url]['lighthouse'] = message.data;

    this.urls[message.url]['lighthouse'] = lighthouse;
  }

  processBrowsertimePageSummary(message) {
    this._addUrl(message.url);

    const statistics = this._condenseStatisticsRecursive(
      message.data.statistics
    );

    this.urls[message.url]['@timestamp'] = message.timestamp;
    this.urls[message.url]['url'] = message.url;
    this.urls[message.url]['browser'] = message.data.info.browser.name;
    this.urls[message.url]['statistics'] = statistics;

    this.debug[message.url]['browsertime'] = message.data;
  }

  processPagexrayPageSummary(message) {
    const url = new URL(message.data.finalUrl);

    this.urls[message.url]['url'] = message.data.url;
    this.urls[message.url]['finalUrl'] = message.data.finalUrl;
    this.urls[message.url]['domain'] = message.data.baseDomain;
    this.urls[message.url]['path'] = url.pathname;
    this.urls[message.url]['connectivity'] = message.data.meta.connectivity;
    this.urls[message.url]['size'] = {
      total: {
        transferSize: message.data.transferSize,
        contentSize: message.data.contentSize,
        headerSize: message.data.headerSize,
        requests: message.data.requests
      },
      contentTypes: message.data.contentTypes,
      firstParty: message.data.firstParty,
      thirdParty: message.data.thirdParty
    };
    this.urls[message.url]['timings'] = {
      fullyLoaded: message.data.fullyLoaded
    };
    this.urls[message.url]['contentTypeSize'] = message.data.contentTypes;

    this.debug[message.url]['pagexray'] = message.data;
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
