var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
			ALTER TABLE users ADD externalUserId INT NULL DEFAULT NULL AFTER id;
		`);
	},
	down: function() {
		return db.query(`
			ALTER TABLE users	DROP externalUserId;
		`);
		
	}
}
