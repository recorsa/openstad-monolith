var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
		  ALTER TABLE sites CHANGE id id INT(11) NOT NULL AUTO_INCREMENT;
		`);
	},
	down: function() {
		return db.query(``);
		
	}
}
