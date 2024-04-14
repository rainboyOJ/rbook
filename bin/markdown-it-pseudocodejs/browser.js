var md = require('markdown-it')(),
	mpjs = require('./index');

md.use(mpjs);

var input = document.getElementById('input'),
	output = document.getElementById('output'),
	button = document.getElementById('button');

button.addEventListener('click', function(ev){

	var result = md.render(input.value);

	output.innerHTML = result;

});