var db = require('../src/db');

module.exports = {
	up: function() {
		db.query("ALTER TABLE `articles` ADD `seqnr` INT NOT NULL DEFAULT '1000000' AFTER `video`;");
		db.query("ALTER TABLE `articles` ADD `isPublished` TINYINT(1) NOT NULL DEFAULT '0' AFTER `description`, ADD `date` DATE NULL AFTER `isPublished`;");
		db.query("UPDATE `articles` SET isPublished=1;");
		db.query("UPDATE `articles` SET date=createdAt;");
	}
}
