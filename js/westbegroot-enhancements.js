
jQuery( document ).ready(function( $ ) {
  initTurnOffEditModeOnAddClick();
});

function initTurnOffEditModeOnAddClick () {
  $('.add-button').click(function () {
    if ($('#budgeting-edit-mode').prop('checked')) {
      $('#budgeting-edit-mode').trigger('click');
    }
  });
}
