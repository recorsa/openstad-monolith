$(function() {

	// Call Gridder
	try {
	$('.gridder').gridderExpander({
    scroll: true,
    scrollOffset: 100,
    scrollTo: "panel",                  // panel or listitem
    animationSpeed: 300,
    animationEasing: "easeInOutExpo",
    showNav: true,                      // Show Navigation
    nextText: "<span></span>", // Next button text
    prevText: "<span></span>", // Previous button text
    closeText: "", // Close button text                // Close button text
    onStart: function(target) {
			var isPhone = document.querySelector('body').offsetWidth < 700; // isPhone - todo: betere afvanging
			this.scrollOffset = isPhone ? -40 : 100;
		},
    onContent: function(args){

			var element = args[0];
			var ideaId = element.querySelector('.this-idea-id').innerHTML;
			 
			console.log(ideaId)
			 
			window.history.replaceState({}, '', '#showidea-' + ideaId);
			 
			return false;

		},
    onClosed: function(){
			window.history.replaceState({}, '', '#');
		}
  });
	} catch(err) {console.log(err);}
});

function scrollToIdeas() {
  scrollToResolver(document.getElementById('ideas-anchor'));
}

function scrollToResolver(elem) {
  var jump = parseInt(elem.getBoundingClientRect().top * .2);
  document.body.scrollTop += jump;
  document.documentElement.scrollTop += jump;
  if (!elem.lastjump || elem.lastjump > Math.abs(jump)) {
    elem.lastjump = Math.abs(jump);
    setTimeout(function() { scrollToResolver(elem);}, 25);
  } else {
    elem.lastjump = null;
  }
}
