var config = {
	apps : [{
		name      : 'stem-staging',
		script    : 'server.js',
		node_args : '--use-strict',
		env: {
			NODE_ENV                   : 'staging',
			BLUEBIRD_LONG_STACK_TRACES : 1,
			BLUEBIRD_WARNINGS          : 0
		}
	}],
	
	deploy : {
		staging : {
			user          : 'daan',
			host          : '185.110.174.172',
			path          : '/var/www/destemvanwest.openstadsdeel.nl/www',
			
			ref           : 'origin/staging',
			repo          : 'ssh://git@git.daanmortier.nl/abtool',
			
			env           : {
				NODE_ENV : 'production'
			},
			'post-deploy' : 'npm install && node migrate.js && pm2 startOrRestart ecosystem.config.js --only stem-staging --update-env'
		}
	}
};
// Production deployments
// ----------------------
addProductionApp([{
	appName    : 'stem-prod',
	deployName : 'production',
	remotePath : '/var/www/stemvanwest.amsterdam.nl/www'
}, {
	appName    : 'stem-centrum',
	deployName : 'production_centrum',
	remotePath : '/var/www/stemvancentrum.amsterdam.nl/www'
}, {
	appName    : 'stem-oost',
	deployName : 'production_oost',
	remotePath : '/var/www/stemvanoost.amsterdam.nl/www'
}, {
	appName    : 'stem-nieuwwest',
	deployName : 'production_nieuwwest',
	remotePath : '/var/www/stemvannieuwwest.amsterdam.nl/www'
}]);
module.exports = config;

// Helper
// ------
// Automates configuring production deployments to keep it DRY.
function addProductionApp( app ) {
	if( app instanceof Array ) {
		return app.forEach(addProductionApp);
	}
	
	config.apps.push({
		name      : app.appName,
		script    : 'server.js',
		node_args : '--use-strict',
		env : {
			NODE_ENV                   : 'production',
			BLUEBIRD_LONG_STACK_TRACES : 1,
			BLUEBIRD_WARNINGS          : 0
		}
	});
	config.deploy[app.deployName] = {
		user          : 'daan',
		host          : '185.110.174.172',
		path          : app.remotePath,
		
		ref           : 'origin/production',
		repo          : 'ssh://git@git.daanmortier.nl/abtool',
		
		env           : {
			NODE_ENV : 'production'
		},
		'post-deploy' : `npm install && node migrate.js && pm2 startOrRestart ecosystem.config.js --only ${app.appName}`
	}
}