var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
      CREATE TABLE budget_user_has_voteds (
        id int(11) NOT NULL,
        siteId int(11) NOT NULL,
        userId varchar(64) NOT NULL,
        vote text NOT NULL,
        createdAt datetime NOT NULL,
        updatedAt datetime NOT NULL,
        deletedAt datetime DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
       
      ALTER TABLE budget_user_has_voteds
        ADD PRIMARY KEY (id),
        ADD UNIQUE KEY userId (userId);
       
      ALTER TABLE budget_user_has_voteds
        MODIFY id int(11) NOT NULL AUTO_INCREMENT;COMMIT;
       
      ALTER TABLE budget_votes DROP userId;
		`);
	},
	down: function() {
		return db.query(`
			DROP TABLE budget_user_has_voted;
		`);
	}
}
