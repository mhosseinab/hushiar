module.exports = {
  apps : [
    {
      name: 'HS_device',
      script: '/projects/homeSecurity/server/device/hs_deviceAPI.js'
    },
    {
      name: 'HS_app',
      script: '/projects/homeSecurity/server/app/hs_appAPI.js'
    },
    {
      name: 'HS_admin',
      script: '/projects/homeSecurity/server/admin/hs_adminAPI.js'
    },
    {
      name: 'HS_service',
      script: '/projects/homeSecurity/server/service/service.js'
    },
    {
      name: 'HS_live',
      script: '/projects/homeSecurity/server/live/hs_liveAPI.js'
    },
],

};
