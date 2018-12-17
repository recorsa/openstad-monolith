var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
      ALTER TABLE ideas ADD budget INT NULL DEFAULT NULL AFTER description;
		`);
	},
	down: function() {
		return db.query(`
			ALTER TABLE ideas DROP budget
		`);
	}
}
