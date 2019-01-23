var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
      CREATE TABLE budget_votes (
        id int(11) NOT NULL,
        siteId int(11) NOT NULL,
        userId varchar(64) NOT NULL,
        vote text NOT NULL,
        createdAt datetime NOT NULL,
        updatedAt datetime NOT NULL,
        deletedAt datetime DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      ALTER TABLE budget_votes
        ADD PRIMARY KEY (id),
        ADD UNIQUE KEY userId (userId);
      ALTER TABLE budget_votes CHANGE id id INT(11) NOT NULL AUTO_INCREMENT;
		`);
	},
	down: function() {
		return db.query(`
      DROP TABLE budget_votes;
		`);
		
	}
}
