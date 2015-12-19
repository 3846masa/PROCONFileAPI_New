/* global $:false Handlebars:false marked:false MathJax:false */
$.fn.serializeJson = function() {
  var obj = {};
  $.each(this.serializeArray(), function() {
    obj[this.name] = this.value;
  });
  return obj;
};
$.fn.isVisible = function() {
  return $.expr.filters.visible(this[0]);
};

$(function(){

  var questionList = [];
  var userInfo = {};

  loadQuestionList()
    .then(formSettings)
    .then(loadUserInfo);

  function loadQuestionList() {
    return fetch('./questionList.json')
      .then(function(res) { return res.json(); })
      .then(function(json) {
        questionList = json.map(function(f) { return f.split('-'); })
          .map(function(a) { return a.concat(a.splice(1).join('-')); })
          .map(function(a) { return {
            point: parseInt(a[0], 10),
            name: a[1],
            question: a.join('-')
          }; });
        return questionList;
      })
      .then(function(list) {
        var $qListContainer = $('main#qList');
        var source = $('template', $qListContainer).html();
        var template = Handlebars.compile(source);
        list.forEach(function(qInfo) {
          var $panel = $(template(qInfo));
          $('a.toggle-details', $panel).on('click', toggleDetails);
          $qListContainer.append($panel);
        });
      });
  }

  function formSettings() {
    $('form').on('submit', function(ev) {
      ev.preventDefault();
    });
    $('#qList .panel form').on('submit', submitCode);
    $('#login button').on('click', login);
    $('#logout button').on('click', logout);
  }

  function submitCode(ev) {
    var $target = $(ev.currentTarget);
    var $parent = $target.parent();
    $('.alert', $parent).hide(250);

    var code = $('textarea', $target).val();
    var lang = $('select#lang').val();

    return fetch('./api/submit', {
      credentials: 'same-origin',
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: $target.data('question'),
        code: code,
        lang: lang
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (json.status !== 'ok') {
        $('.alert-warning', $parent).text(json.message).show(250);
      } else {
        var message = $('<span>').text('Your submitID is ');
        var id = $('<a>')
          .attr({
            href: '/search.html#_id=' + json.info._id,
            target: '_blank'
          })
          .text(json.info._id);
        $('.alert-info', $parent).empty().append(message).append(id).show(250);
      }
    })
    .then(loadUserInfo);
  }

  function login(ev) {
    var action = $(ev.currentTarget).data('action');
    var $loginForm = $('form#login');
    var query = $loginForm.serializeJson();

    var opts = {
      credentials: 'same-origin',
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    };

    var promise = (action === 'signup') ?
      fetch('./api/signup', opts)
        .then(function(res) { return res.json(); })
        .then(function(json) { if (json.status !== 'ok') throw json; }) :
      Promise.resolve();

    return promise.then(function() {
      return fetch('./api/auth', opts);
    })
    .then(function(res) { return res.json(); })
    .then(function(json) { if (json.status !== 'ok') throw json; })
    .then(loadUserInfo)
    .catch(function(json) {
      alert(json.message);
    });
  }

  function loadUserInfo() {
    return fetch('./api/user', {
      credentials: 'same-origin'
    })
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (json.status === 'ok') {
        userInfo = json.user;
        $('#userStatus').text(userInfo.username + '(' + userInfo.score + 'pts)');
        $('#login').hide(0);
        $('#logout').show(0);
      } else {
        throw new Error(json.message);
      }
    })
    .then(loadSubmitted);
  }

  function logout() {
    return fetch('./api/logout', {
      credentials: 'same-origin'
    }).then(function() {
      $('#userStatus').text('');
      $('#login').show(0);
      $('#logout').hide(0);
      $('.panel .label-info').hide(0);
      userInfo = {};
    })
    .then(loadUserInfo);
  }

  function loadSubmitted() {
    return fetch('./api/scores', {
      credentials: 'same-origin',
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: userInfo.username
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (json.status !== 'ok') return;
      $('.panel .label-info').hide(0);
      json.scores.forEach(function(sInfo) {
        $('.panel[data-question="' + sInfo.question + '"]')
          .find('.label-info').show(0);
      });
    });
  }

  function toggleDetails(ev) {
    ev.preventDefault();

    var $target = $(ev.currentTarget);
    var question = $target.data('question');
    var $details = $('.panel[data-question="' + question + '"] .details');
    if (!$details.isVisible()) {
      fetch('/' + question + '/README.md')
        .then(function(res) { return res.text(); })
        .then(function(md) {
          $details.html(md);
          return new Promise(function(resolve) {
            this.resolve = resolve;
            MathJax.Hub.Queue(
              ['Typeset', MathJax.Hub, $details[0]],
              ['resolve', this]
            );
          });
        })
        .then(function() {
          var renderer = new marked.Renderer();
          (function() {
            var link = renderer.link.bind(renderer);
            renderer.link = function(href, title, text) {
              if (!href.match(/^http/)) href = '/' + question + '/' + href;
              return link(href, title, text);
            };
            var image = renderer.image.bind(renderer);
            renderer.image = function(href, title, text) {
              if (!href.match(/^http/)) href = '/' + question + '/' + href;
              return image(href, title, text);
            };
          })();
          $details.html(marked($details.html() + '\n\n----', {
            sanitize: false, renderer: renderer
          }));
          $('a', $details).attr({ target: '_blank' });
        })
        .then(function() {
          return fetch('./api/scores', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: question
            })
          })
          .then(function(res) { return res.json(); });
        })
        .then(function(json) {
          if (json.status === 'ok') {
            $details.append($('<p>').text(json.scores.length + ' users submitted.'));
          }
          $details.show(500);
        });
    } else {
      $details.hide(500);
    }
  }

});
