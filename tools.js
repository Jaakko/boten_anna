fs = require('fs')
var tools = require('./tools');

module.exports = {
	compare: function (jsPerson, metrics) {
		var fileName = __dirname + '/personalities/' + metrics + '.json';
		var data = fs.readFileSync(fileName, 'utf8');
		var jsMetric = JSON.parse(data);
		var lenMetric = jsMetric.personality.length;
		var diff = 0.0
		for (var i = 0; i < lenMetric; ++i) {
			var lenPerson = jsPerson.personality.length;

			for (var j = 0; j < lenPerson; ++j) {
				if (jsMetric.personality[i].name == jsPerson.personality[j].name) {
					diff = diff + Math.abs(jsMetric.personality[i].percentile - jsPerson.personality[j].percentile);
					// TODO end loop
				}
			}
		}
		return diff;
  } ,
	compareTo: function (jsPerson,metrics) {
		var min = 100.0;
		var diff;
		var minMetric = '';
		var lenMetric = metrics.length;
		
		for (var i = 0; i < lenMetric; ++i) {
			var m = metrics[i];
			console.log('compareTo compare',m);
			diff= module.exports.compare(jsPerson,m);
			console.log('compareAll compare diff: ' + m + 'min: ' + min,diff);
			if (diff < min)  {
				minMetric = m;
				min = diff;
			}
		}
		return minMetric;
	},
	getMetricText: function (bricksToJobs, bricksToDescription) {
		var arrayLength = bricksToJobs.length;
		var returnString = bricksToDescription + "\n\n";
		for (var i = 0; i < arrayLength; i++) {
			var item = bricksToJobs[i];
			returnString += item[0] + " title \n";
			for (var j = 1; j < item.length; j++) {
				returnString += item[j] + "\n";
			}
		}
		return returnString;
	},
	getMetricHtml: function (bricksToJobs,bricksToDescription) {
		var arrayLength = bricksToJobs.length;
		var returnString = "<p>" + bricksToDescription + "</p>";
	
		for (var i = 0; i < arrayLength; i++) {
			var item = bricksToJobs[i];
			returnString += "<h2>" + item[0] + "</h2><ul style=\"list-style-type:disc\">";
			for (var j = 1; j < item.length; j++) {
				returnString += "<li>" + item[j] + "</li>";
			}
			returnString += "</ul>";
		}
		return returnString;
	}
};
