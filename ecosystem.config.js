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
		
		watch        : true,
		ignore_watch : ['\.git', 'node_modules', 'css', 'img']
	}],
	
	deploy : {
		production : {
			user : 'daan',
			host : '185.110.174.172',
			path : '/var/www/stemvanwest.daanmortier.nl/www',
			
			ref  : 'origin/master',
			repo : 'git@git.daanmortier.nl/abtool',
			
			'post-deploy' : 'npm install && pm2 startOrRestart ecosystem.config.js --update-env --env production'
		},
		// dev : {
		// 	user : 'node',
		// 	host : '212.83.163.1',
		// 	ref  : 'origin/master',
		// 	repo : 'git@github.com:repo.git',
		// 	path : '/var/www/development',
		// 	'post-deploy' : 'npm install && pm2 startOrRestart ecosystem.json --env dev',
		// 	env  : {
		// 		NODE_ENV: 'dev'
		// 	}
		// }
	}
}
