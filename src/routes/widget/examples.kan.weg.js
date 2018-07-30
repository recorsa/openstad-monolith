const config       = require('config')
const express      = require('express')

let router = express.Router({mergeParams: true});

// list ideas
// ----------
router.route('/ideas')
	.get(function( req, res, next ) {

		res.status(200).end(`
<script src="/js/custom-elements.min.js"></script>

<script src="/widget/site/1/idea"></script>
<link rel="import" href="/widget/site/1/idea/test" id="test">

<div style="width: 1000px; margin: 0 auto;">
	<h1>
		Plannen
	</h1>
Hieronder een import met de lopende plannen. Die gebruikt de voorbeeld css.
	<link rel="stylesheet" type="text/css" media="all"   href="/css/widget/idea.css">
<ideas-list whatever="2">XXX</ideas-list>
<script>
console.log(document.getElementById('test').import);
</script>
</div>
`)

	});


module.exports = router;
