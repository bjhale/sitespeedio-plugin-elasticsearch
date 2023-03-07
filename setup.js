module.exports = async (client,log) => {
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
  }

  //Check if sitespeedio index template exists
  const indexTemplate = await client.indices.existsIndexTemplate({
    name: 'sitespeedio'
  });

  //Create Index Template
  if (!indexTemplate) {
    log.info('Creating Index Template');
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
            dynamic_templates: [],
            date_detection: true
          }
        },
        index_patterns: ['sitespeedio-*'],
        composed_of: []
      }
    });
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
  }
};
