jQuery( document ).ready(function( $ ) {
  $('.content-modal').on('click', function(event) {
    if($(event.target).is(".content-modal")) {
      // the hash doenst exists on the page, this way it closes the modal, but doesnt jump on the page
      window.location.hash = '#variants';
    }
  });

  /*$('.mobile-accordion-opener').on('click', function() {
    $(this).closest('.mobile-accordion').toggleClass('open');
  });*/

  $('.react-to-variant').click(function() {
    var variantValue = $(this).attr('data-variant-value');
    $('.variant-selector').val(variantValue);
    $('#filter-arguments-option-' + variantValue).trigger('click');
    updateVariantTextareaPlaceholder();
  });

  $('.for-or-against-selector, .variant-selector').on('change', function() {
    updateVariantTextareaPlaceholder();
  });


  function updateVariantTextareaPlaceholder() {
    var placeholderTpl = "Ik heb gestemd op {{variant}}, omdat..";
    var forLabel = $('.for-or-against-selector').val() === 'against' ? 'tegen' : 'voor';
    placeholderTpl = placeholderTpl.replace('{{forOrAgainst}}', forLabel);
    placeholderTpl = placeholderTpl.replace('{{variant}}', $('.variant-selector').val());
    $('.argument-textarea').attr('placeholder', placeholderTpl);
  }

  setTimeout(function() {
    //$('.fotorama').fotorama();
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
  }, 1400);


  $('.add-button').click(function () {
    if ($('#budgeting-edit-mode').prop('checked')) {
      $('#budgeting-edit-mode').trigger('click');
    }
  });

});

function setFormSendingToDisabled (form) {
  jQuery(form).find('button[type="submit"]').text('Verzenden...');
  jQuery(form).find('input[type="submit"]').val('Verzenden...');
  jQuery(form).find('button[type="submit"], input[type="submit"]').attr('disabled', true);
};
