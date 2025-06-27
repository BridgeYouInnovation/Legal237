module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix AJV compatibility issue by adding explicit AJV to dependencies
      // and handling module resolution
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        // Redirect problematic AJV imports to compatible paths
        'ajv/dist/compile/codegen': 'ajv/lib/compile/codegen',
        'ajv/dist/runtime/equal': 'ajv/lib/runtime/equal',
        'ajv/dist/compile/util': 'ajv/lib/compile/util'
      };

      // Ensure AJV modules are properly resolved
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
      };

      return webpackConfig;
    }
  }
}; 