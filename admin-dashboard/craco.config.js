const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add NormalModuleReplacementPlugin to handle AJV path mappings
      webpackConfig.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^ajv\/dist\/(.*)$/,
          (resource) => {
            resource.request = resource.request.replace(/^ajv\/dist\//, 'ajv/lib/');
          }
        )
      );

      // Keep the aliases as backup
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'ajv/dist/compile/codegen': 'ajv/lib/compile/codegen',
        'ajv/dist/runtime/equal': 'ajv/lib/runtime/equal',
        'ajv/dist/compile/util': 'ajv/lib/compile/util',
        'ajv/dist/compile/context': 'ajv/lib/compile/context',
        'ajv/dist/compile/names': 'ajv/lib/compile/names',
        'ajv/dist/vocabularies/core': 'ajv/lib/vocabularies/core',
        'ajv/dist/compile': 'ajv/lib/compile',
        'ajv/dist/runtime': 'ajv/lib/runtime',
        'ajv/dist/vocabularies': 'ajv/lib/vocabularies'
      };

      return webpackConfig;
    }
  }
}; 