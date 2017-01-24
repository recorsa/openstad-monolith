var moment = require('moment-timezone');
var today  = moment().endOf('day');

module.exports = [
	{id: 1,  date: moment(today).day(5).subtract(8, 'weeks').toDate()},
	{id: 2,  date: moment(today).day(5).subtract(6, 'weeks').toDate()},
	{id: 3,  date: moment(today).day(5).subtract(4, 'weeks').toDate()},
	{id: 4,  date: moment(today).day(5).subtract(2, 'weeks').toDate()},
	{id: 5,  date: moment(today).day(5).toDate()},
	{id: 6,  date: moment(today).day(5).add(2,  'weeks').toDate()},
	{id: 7,  date: moment(today).day(5).add(4,  'weeks').toDate()},
	{id: 8,  date: moment(today).day(5).add(6,  'weeks').toDate()},
	{id: 9,  date: moment(today).day(5).add(8,  'weeks').toDate()},
	{id: 10, date: moment(today).day(5).add(10, 'weeks').toDate()},
	{id: 11, date: moment(today).day(5).add(12, 'weeks').toDate()},
	{id: 12, date: moment(today).day(5).add(14, 'weeks').toDate()},
	{id: 13, date: moment(today).day(5).add(16, 'weeks').toDate()},
	{id: 14, date: moment(today).day(5).add(18, 'weeks').toDate()},
	{id: 15, date: moment(today).day(5).add(20, 'weeks').toDate()},
	{id: 16, date: moment(today).day(5).add(22, 'weeks').toDate()},
	{id: 17, date: moment(today).day(5).add(24, 'weeks').toDate()},
	{id: 18, date: moment(today).day(5).add(26, 'weeks').toDate()},
	{id: 19, date: moment(today).day(5).add(28, 'weeks').toDate()},
	{id: 20, date: moment(today).day(5).add(30, 'weeks').toDate()},
	{id: 21, date: moment(today).day(5).add(32, 'weeks').toDate()},
	{id: 22, date: moment(today).day(5).add(34, 'weeks').toDate()},
	{id: 23, date: moment(today).day(5).add(36, 'weeks').toDate()}
];