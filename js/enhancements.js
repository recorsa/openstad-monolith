jQuery( document ).ready(function( $ ) {
  $('.content-modal').on('click', function(event) {
    if($(event.target).is(".content-modal")) {
      window.location.hash = '#variants';
    }
  })
});
