const path = require("path");

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Disable source maps to save memory during build
      webpackConfig.devtool = false;

      // Reduce parallelism to lower peak memory usage
      if (webpackConfig.optimization) {
        if (webpackConfig.optimization.minimizer) {
          webpackConfig.optimization.minimizer.forEach((plugin) => {
            if (plugin.constructor.name === 'TerserPlugin') {
              plugin.options = plugin.options || {};
              plugin.options.parallel = 2; // limit to 2 threads
            }
          });
        }
      }

      return webpackConfig;
    },
  },
};
