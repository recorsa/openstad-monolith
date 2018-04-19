jQuery( document ).ready(function( $ ) {
  var $tabs = $('.argument-filter-tab');

  $tabs.on('click', function(event) {
    event.preventDefault();
    var $thisTab = $(this);
    var variant = $thisTab.attr('data-variant');

    if(!$thisTab.hasClass('active') ) {
      $tabs.removeClass('active');
      $thisTab.addClass("active");

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

});
