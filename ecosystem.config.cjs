/**
 * PM2 – manter o AXIS no ar após reboot (VPS Hostinger, etc.)
 * Uso: pm2 start ecosystem.config.cjs
 */
module.exports = {
    apps: [
        {
            name: 'axis',
            script: 'server.js',
            cwd: __dirname,
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '800M',
            env: {
                NODE_ENV: 'production',
                PORT: process.env.PORT || 3006
            }
        }
    ]
};
