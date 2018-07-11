var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
			ALTER TABLE
				meetings
			ADD
				forceShow TINYINT(1) NOT NULL DEFAULT 0 AFTER date;
		`);
	},
	down: function() {
		return db.query(`
			ALTER TABLE
				meetings
			DROP
				forceShow
		`);
	}
}
