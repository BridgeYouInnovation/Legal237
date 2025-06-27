module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix AJV compatibility issue by forcing webpack to ignore the problematic import
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        // Redirect the problematic import to a compatible path
        'ajv/dist/compile/codegen': 'ajv/lib/compile/codegen'
      };

      return webpackConfig;
    }
  }
}; 