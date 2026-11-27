module.exports = ({ config }) => {
  if (process.env.EXPO_PUBLIC_STORE_BUILD === "1") {
    for (const key of ["EXPO_PUBLIC_API_URL", "EXPO_PUBLIC_WEB_URL"]) {
      let url;
      try {
        url = new URL(process.env[key]);
      } catch {}
      const hostname = url?.hostname.replace(/\.$/, "");
      if (
        !url ||
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        hostname === "localhost" ||
        hostname.endsWith(".localhost") ||
        hostname.startsWith("127.") ||
        hostname === "0.0.0.0" ||
        hostname === "[::1]" ||
        hostname === "[::]" ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      ) {
        throw Error(
          key + " must be a deployed HTTPS origin for a store build.",
        );
      }
    }
  }
  return config;
};
