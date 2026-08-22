module.exports = {
    swcMinify: true,
    webpack: (config, { dev }) => {
        if (!dev) {
            config.devtool = false;
        }

        return config;
    },
};
