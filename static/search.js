/* global $:false Handlebars:false */
$.fn.serializeJson = function() {
  var obj = {};
  $.each(this.serializeArray(), function() {
    if (this.value.trim()) obj[this.name] = this.value.trim();
  });
  return obj;
};
$.fn.isVisible = function() {
  return $.expr.filters.visible(this[0]);
};

$(function(){
  var $statusList = $('#statusList');
  var $searchForm = $('#searchForm');
  $searchForm.on('submit', function(ev) {
    ev.preventDefault();

    location.hash = $searchForm.serialize();
    fetch('/api/status', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify($searchForm.serializeJson())
    })
    .then(function (res) { return res.json(); })
    .then(function (json) {
      if (json.status !== 'ok') return;
      var source = $('template', $statusList).html();
      var template = Handlebars.compile(source);

      $('.data', $statusList).remove();
      json.info.forEach(function(info) {
        var $list = $(template(info)).addClass('data');
        $statusList.append($list);
      });
    });
  });

  if (location.hash.substr(1)) {
    $searchForm.deserialize(location.hash.substr(1)).submit();
  }
});
