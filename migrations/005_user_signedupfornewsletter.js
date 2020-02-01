var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
			ALTER TABLE
				users
			ADD
				signedupfornewsletter TINYINT(1) NOT NULL DEFAULT '0' AFTER zipCode;
		`);
	},
	down: function() {
		return db.query(`
			ALTER TABLE
				users
			DROP
				signedupfornewsletter
		`);
	}
}
