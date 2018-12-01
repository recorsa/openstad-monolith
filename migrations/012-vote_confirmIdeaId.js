var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
			ALTER TABLE votes ADD confirmIdeaId INT NULL DEFAULT NULL AFTER confirmed;
		`);
	},
	down: function() {
		return db.query(`
			ALTER TABLE
				votes
			DROP
				confirmIdeaId;
		`);
	}
}
