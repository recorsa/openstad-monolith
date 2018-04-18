jQuery( document ).ready(function( $ ) {
  $('.content-modal').on('click', function(event) {
    console.log('event', event.target, $(event.target).is(".content-modal"));
    if($(event.target).is(".content-modal")) {
      window.location.hash = '#variants';
    }
  })
});
