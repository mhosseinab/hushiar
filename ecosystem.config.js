module.exports = {
  apps : [
    {
      name: 'HS_device',
      script: 'npm',
      args: 'run start:device',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      // logs
      out_file: './logs/hs_device.out.log',
      error_file: './logs/hs_device.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    },
    {
      name: 'HS_app',
      script: 'npm',
      args: 'run start:app',
      env: { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production' },
      out_file: './logs/hs_app.out.log',
      error_file: './logs/hs_app.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    },
    {
      name: 'HS_admin',
      script: 'npm',
      args: 'run start:admin',
      env: { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production' },
      out_file: './logs/hs_admin.out.log',
      error_file: './logs/hs_admin.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    },
    {
      name: 'HS_service',
      script: 'npm',
      args: 'run start:service',
      env: { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production' },
      out_file: './logs/hs_service.out.log',
      error_file: './logs/hs_service.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    },
    {
      name: 'HS_live',
      script: 'npm',
      args: 'run start:live',
      // HS_live may be CPU heavy; run in cluster mode to use all cores
      instances: 'max',
      exec_mode: 'cluster',
      env: { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production' },
      out_file: './logs/hs_live.out.log',
      error_file: './logs/hs_live.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    },
],

};
