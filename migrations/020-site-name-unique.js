var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
		  ALTER TABLE sites CHANGE name name VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL;
		  ALTER TABLE sites ADD UNIQUE(name);
		`);
	},
	down: function() {
		return db.query(``);
		
	}
}
