var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
			ALTER TABLE articles ADD imageCaption VARCHAR(255) NULL DEFAULT NULL AFTER image;
		`);
	},
	down: function() {
		return db.query(`
			ALTER TABLE
				articles
			DROP
				imageCaption;
		`);
	}
}
