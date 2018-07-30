var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
      CREATE TABLE sites (
      	'id' INT NOT NULL AUTO_INCREMENT,
				'name' VARCHAR(255) NOT NULL,
				'title' VARCHAR(255) NOT NULL,
				'config' TEXT NOT NULL,
				PRIMARY KEY ('id')) ENGINE = InnoDB;
      ALTER TABLE sites ADD createdAt DATETIME NOT NULL AFTER config,
                        ADD updatedAt DATETIME NOT NULL AFTER createdAt,
                        ADD deletedAt DATETIME NULL AFTER updatedAt;
      ALTER TABLE meetings ADD siteId INT NOT NULL AFTER id;
      ALTER TABLE articles ADD siteId INT NOT NULL AFTER id;
      ALTER TABLE ideas ADD siteId INT NOT NULL AFTER id;
		`);
	},
	down: function() {
		return db.query(`
      DROP TABLE sites;
      ALTER TABLE meetings DROP siteId;
      ALTER TABLE articles DROP siteId;
      ALTER TABLE ideas DROP siteId;
		`);
		
	}
}
