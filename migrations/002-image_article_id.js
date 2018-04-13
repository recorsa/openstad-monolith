var db = require('../src/db');

module.exports = {
	up: function() {
		db.query('ALTER TABLE `images` ADD `articleId` INT NULL AFTER `id`;');
		db.query('ALTER TABLE `images` ADD INDEX `articleId` (`articleId`);');
    
	}
}
