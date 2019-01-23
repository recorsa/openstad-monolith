var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
			ALTER TABLE budget_votes ADD userId varchar(64) NOT NULL AFTER siteId;
      ALTER TABLE budget_votes
        ADD UNIQUE KEY userId (userId);
      DROP TABLE budget_user_has_voteds;
		`);
	},
	down: function() {
		return db.query(`
		`);
		
	}
}
