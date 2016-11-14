var co = require('co');

module.exports = function( db ) {
	return co(function*() {
		var user = yield db.User.create({
			firstName: 'Daan',
			lastName: 'Mortier'
		});
		var idea = yield user.createIdea({
			startDate: new Date(),
			endDate: new Date(Date.now() + 86400000),
			status: 'running',
			title: 'Test idee',
			summary: 'Dit is een test idee',
			description: 'Dit is het hele verhaal achter het test idee'
		});
		
		var user = yield idea.getUser();
		console.log(user.get());
	});
}