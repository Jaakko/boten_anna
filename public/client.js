// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

$(function() {
  console.log('hello world :o');

  $('form').submit(function(event) {
    event.preventDefault();
	var $form = $( this ),
		twitter_name = $form.find( "input[name='twitter_name']" ).val(),
		profile = $form.find( "textarea[name='profile']" ).val(),
		url = $form.attr( "action" );
 
	// Send the data using post
	//var posting = $.post( '/api/post', { twitter_name: twitter_name , profile: profile } ).done(function( data ) {
    $.post( '/api/post', { twitter_name: twitter_name , profile: profile } ).done(function( data ) {
		var content = data;
		console.log('content:' + content);
		$( "#result" ).empty().append( content );
	});
 
  });

});
