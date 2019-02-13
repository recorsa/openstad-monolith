// los aan te roepen script; geen deel van de app
// run met
// $ NODE_ENV=stemvan node src/util/budgeting-count-result.js


const db = require('../db');

let voteResult = {};

db.BudgetVote
	.findAll()
	.then(result => {
		if (!result) return console.log('(Nog) geen resultaten');
		result.forEach((entry) => {
			let vote = JSON.parse(entry.vote)
			vote.forEach(id => {
				if (typeof voteResult[id] != 'undefined') {
					voteResult[id]++;
				} else {
					voteResult[id] = 1;
				}
			});
		});
		return result;
	})
	.then(result => {
		// haal de ideeen erbij om de leesbaarheid te vergroten
		db.Idea
			.findAll({ where: { id: Object.keys(voteResult) } })
			.then(result => {
				result.forEach((idea) => {
					voteResult[idea.id] = {
						title: idea.title,
						noOfVotes: voteResult[idea.id],
						budget: idea.budget,
					}
				});

				let total = 0;
				Object.keys(voteResult).sort((a,b) => { return voteResult[b].noOfVotes - voteResult[a].noOfVotes }).forEach((id) => {
					total = total + voteResult[id].budget;
					console.log(`"${id}","${voteResult[id].title}","${voteResult[id].noOfVotes}","${voteResult[id].budget}","${total}"`);
				});
				
				process.exit();
			})
			.catch(err => {
				console.log(err);
				process.exit();
			});
	})
	.catch(err => {
		console.log(err);
				process.exit();
	});
