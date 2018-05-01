jQuery( document ).ready(function( $ ) {
  var $tabs = $('.argument-filter-tab');

  $('#filter-arguments-select').on('change', function() {
    filterVariant($(this).val());
  });

  $tabs.on('click', function(event) {
    event.preventDefault();
    var $thisTab = $(this);
    var variant = $thisTab.attr('data-variant');

    filterVariant(variant);
  });


  function filterVariant(variant) {
    var $thisTab = $('[data-variant="'+variant+'"]');
    var $select = $('#filter-arguments-select');

    $tabs.removeClass('active');
    $thisTab.addClass('active');
    $select.val(variant);

    //hide all argumtens and no
    $('.argument, .reaction, .no-arguments').hide();

    var filterSelector = variant === 'all' ? '.argument, .reaction' : '.argument-variant-' + variant;
    var $argumentsToDispay = $(filterSelector);
    var forArgumentsCount = $('.for ' + filterSelector).length;
    var againstArgumentsCount = $('.against ' + filterSelector).length;

    if (forArgumentsCount === 0) {
      $('.for .no-arguments').show();
    }

    if (againstArgumentsCount === 0) {
      $('.against .no-arguments').show();
    }

    $argumentsToDispay.show();
  }

});
