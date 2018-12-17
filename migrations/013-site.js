var db = require('../src/db').sequelize;

module.exports = {
	up: function() {
		return db.query(`
      CREATE TABLE sites (
        id int(11) NOT NULL,
        name varchar(255) NOT NULL,
        title varchar(255) NOT NULL,
        config text NOT NULL,
        createdAt datetime NOT NULL,
        updatedAt datetime NOT NULL,
        deletedAt datetime DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      ALTER TABLE sites ADD PRIMARY KEY (id);
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
