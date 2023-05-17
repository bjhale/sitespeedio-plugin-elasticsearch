const semver = require('semver');

module.exports = async (client, log) => {
  log.info('Setting up Elasticsearch');
  //Check if sitespeedio ilm policy exists
  let ilmPolicy;
  try {
    ilmPolicy = await client.ilm.getLifecycle({
      name: 'sitespeedio'
    });
  } catch (e) {
    ilmPolicy = false;
  }

  //Create ILM Policy
  if (!ilmPolicy) {
    log.info('Creating ILM Policy');
    await client.ilm.putLifecycle({
      name: 'sitespeedio',
      body: {
        policy: {
          phases: {
            hot: {
              min_age: '0ms',
              actions: {
                set_priority: {
                  priority: 100
                },
                rollover: {
                  max_primary_shard_size: '50gb',
                  max_age: '7d'
                }
              }
            },
            warm: {
              min_age: '7d',
              actions: {
                readonly: {},
                set_priority: {
                  priority: 50
                }
              }
            },
            delete: {
              min_age: '365d',
              actions: {
                delete: {
                  delete_searchable_snapshot: true
                }
              }
            }
          }
        }
      }
    });
  } else {
    log.info('ILM Policy already exists');
  }

  let indexTemplate;
  try {
    indexTemplate = await client.indices.getIndexTemplate({
      name: 'sitespeedio'
    });
  } catch (e) {
    log.error(e);
    process.exit();
  }

  let templateVersion;
  try {
    templateVersion =
      indexTemplate.index_templates[0].index_template.template.mappings._meta
        .version;
  } catch (e) {
    templateVersion = false;
  }

  const updateTemplate =
    templateVersion === false || semver.lt(templateVersion, '1.1.0');

  if (updateTemplate) {
    log.info('Updating Index Template');
    await client.indices.putIndexTemplate({
      name: 'sitespeedio',
      body: {
        priority: 1,
        template: {
          settings: {
            index: {
              lifecycle: {
                name: 'sitespeedio',
                rollover_alias: 'sitespeedio'
              },
              mapping: {
                total_fields: {
                  limit: '10000'
                },
                depth: {
                  limit: '1000'
                }
              },
              number_of_shards: '1',
              number_of_replicas: '1'
            }
          },
          mappings: {
            _meta: {
              version: '1.1.0'
            },
            _routing: {
              required: false
            },
            numeric_detection: false,
            dynamic_date_formats: [
              'strict_date_optional_time',
              'yyyy/MM/dd HH:mm:ss Z||yyyy/MM/dd Z'
            ],
            dynamic: true,
            _source: {
              excludes: [],
              includes: [],
              enabled: true
            },
            dynamic_templates: [
              {
                lighthouse_categories: {
                  path_match: 'lighthouse.categories.*',
                  mapping: {
                    type: 'float'
                  }
                }
              },
              {
                lighthouse_scores: {
                  path_match: 'lighthouse.audits.*.score',
                  mapping: {
                    type: 'float'
                  }
                }
              }
            ],
            date_detection: true
          }
        },
        index_patterns: ['sitespeedio-*'],
        composed_of: []
      }
    });
  } else {
    log.info('Index Template up to date');
  }

  //Detect if sitespeedio alias already exists
  const aliasExists = await client.indices.exists({
    index: 'sitespeedio'
  });

  //Seed Sitespeedio index
  if (!aliasExists) {
    log.info('Creating Sitespeedio Seed Index');
    await client.indices.create({
      index: 'sitespeedio-000001',
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1
        },
        aliases: {
          sitespeedio: {}
        }
      }
    });
  } else {
    log.info('Sitespeedio Index already exists');
  }

  if (updateTemplate && aliasExists) {
    log.info('Forcing rollover of sitespeedio alias following index template update');
    await client.indices.rollover({
      alias: 'sitespeedio',
      body: {
        conditions: {
          max_age: '1s'
        }
      }
    });
  }

};
