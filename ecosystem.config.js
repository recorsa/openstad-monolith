var config = {
	apps : [{
		name      : 'stem-staging',
		script    : 'server.js',
		node_args : '--use-strict',
		env: {
			NODE_ENV                   : 'stemvan',
			NODE_APP_INSTANCE          : 'staging',
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
			'post-deploy' : 'git submodule init && git submodule update && npm install && node migrate.js && pm2 startOrRestart ecosystem.config.js --only stem-staging --update-env'
		}
	}
};
// Production deployments
// ----------------------
addProductionApp('stemvan', [{
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
}, {
	appName    : 'stem-zuidoost',
	deployName : 'production_zuidoost',
	remotePath : '/var/www/stemvanzuidoost.amsterdam.nl/www'
}]);
module.exports = config;

// Helper
// ------
// Automates configuring production deployments to keep it DRY.
function addProductionApp( env, app ) {
	if( app instanceof Array ) {
		return app.forEach(addProductionApp.bind(null, env));
	}
	if( app.constructor !== Object ) {
		return;
	}
	
	config.apps.push({
		name      : app.appName,
		script    : 'server.js',
		node_args : '--use-strict',
		env : {
			NODE_ENV                   : env,
			NODE_APP_INSTANCE          : 'production',
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
		'post-deploy' : `git submodule init && git submodule update && npm install && node migrate.js && pm2 startOrRestart ecosystem.config.js --only ${app.appName}`
	};
}