// remix.config.js
/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  serverBuildTarget: "vercel", // or "node" for Render deployments
  server: "./server.ts",
  ignoredRouteFiles: ["**/.*"],
  future: {
    v3_routeConvention: true,
  },
};
