module.exports = {
	apps : [{
		name      : 'ab-server',
		script    : 'server.js',
		node_args : '--use-strict',
		env: {
			NODE_ENV                   : 'development',
			BLUEBIRD_LONG_STACK_TRACES : 1,
			BLUEBIRD_WARNINGS          : 0
		},
		env_production : {
			NODE_ENV                   : 'production',
			BLUEBIRD_LONG_STACK_TRACES : 1,
			BLUEBIRD_WARNINGS          : 0
		},
		
		// watch        : true,
		// ignore_watch : ['\.git', 'node_modules', 'css', 'img']
	}],
	
	deploy : {
		production : {
			user          : 'daan',
			host          : '185.110.174.172',
			path          : '/var/www/stemvanwest.amsterdam.nl/www',
			
			ref           : 'origin/production',
			repo          : 'ssh://git@git.daanmortier.nl/abtool',
			
			env           : {
				NODE_ENV : 'production'
			},
			'post-deploy' : 'npm install && pm2 startOrRestart ecosystem.config.js --update-env --env production'
		},
		staging : {
			user          : 'daan',
			host          : '185.110.174.172',
			path          : '/var/www/destemvanwest.openstadsdeel.nl/www',
			
			ref           : 'origin/staging',
			repo          : 'ssh://git@git.daanmortier.nl/abtool',
			
			env           : {
				NODE_ENV : 'dev'
			},
			'post-deploy' : 'npm install && pm2 startOrRestart ecosystem.config.js --update-env --env dev'
		}
	}
}
