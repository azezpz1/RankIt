// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  appId: 'rankit-widget',
  /* firebaseConf: {
     apiKey: 'AIzaSyDbp_hzGe3_RIQ_qHcTSOBHYWCVjuuSydk',
     authDomain: 'rank-it-dev.firebaseapp.com',
     databaseURL: 'https://rank-it-dev.firebaseio.com',
     projectId: 'rank-it-dev',
     storageBucket: 'rank-it-dev.appspot.com',
     messagingSenderId: '845591056733'
   }*/
  firebaseConf: {
    apiKey: 'AIzaSyDIaBo2noEB9NWosdwGAn69SSw5AYvTMO0',
    authDomain: 'rank-it-app.firebaseapp.com',
    databaseURL: 'https://rank-it-app.firebaseio.com',
    projectId: 'rank-it-app',
    storageBucket: 'rank-it-app.appspot.com',
    messagingSenderId: '1063554480254'
  }

};
