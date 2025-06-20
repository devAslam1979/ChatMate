/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  future: {
    v3_routeConvention: true,
  },
  serverModuleFormat: "cjs", // 👈 this tells Remix to use CommonJS (Vercel needs this)
};
