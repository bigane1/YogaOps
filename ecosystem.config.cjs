const path = require("path");

module.exports = {
  apps: [
    {
      name: "yogaops",
      cwd: path.resolve(__dirname),
      script: "node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0 -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      max_restarts: 10,
      min_uptime: "10s",
    },
  ],
};
