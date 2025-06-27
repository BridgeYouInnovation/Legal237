module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix AJV compatibility by creating a more comprehensive solution
      // Override webpack's module resolution to handle AJV path remapping
      const originalResolveLoader = webpackConfig.resolveLoader;
      
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        // Map all ajv/dist/* paths to ajv/lib/* for v6 compatibility
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

      // Add a custom resolver plugin to handle any remaining ajv/dist/* imports
      if (!webpackConfig.resolve.plugins) {
        webpackConfig.resolve.plugins = [];
      }

      webpackConfig.resolve.plugins.push({
        apply(resolver) {
          const target = resolver.ensureHook('resolve');
          resolver
            .getHook('before-resolve')
            .tapAsync('AjvDistResolver', (request, resolveContext, callback) => {
              if (request.request && request.request.startsWith('ajv/dist/')) {
                const newRequest = request.request.replace('ajv/dist/', 'ajv/lib/');
                return resolver.doResolve(
                  target,
                  { ...request, request: newRequest },
                  null,
                  resolveContext,
                  callback
                );
              }
              callback();
            });
        }
      });

      return webpackConfig;
    }
  }
}; 