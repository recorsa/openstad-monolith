jQuery( document ).ready(function( $ ) {
  $('.content-modal').on('click', function(event) {
    if($(event.target).is(".content-modal")) {
      // the hash doenst exists on the page, this way it closes the modal, but doesnt jump on the page
      window.location.hash = '#variants';
    }
  });

  $('document').ready(function() {
    $('.fotorama')
        .on('fotorama:fullscreenenter fotorama:fullscreenexit', function (e, fotorama) {

        if (e.type === 'fotorama:fullscreenenter') {
            // Options for the fullscreen
            fotorama.setOptions({
                fit: 'contain',
            });
        } else {
            // Back to normal settings
            fotorama.setOptions({
                fit: 'cover'
            });
        }
        })
        .fotorama();
  });


  $('.mobile-accordion-opener').on('click', function() {
    $(this).closest('.mobile-accordion').toggleClass('open');
  })

});
