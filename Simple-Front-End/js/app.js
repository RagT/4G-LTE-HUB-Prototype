//API to call to get data
var apiUrl = "https://pvgp101szb.execute-api.us-west-2.amazonaws.com/Prototype/";

//Use Count / dataResolution entries in graph
var dataResolution = 100;

//Arrays of data to be graphed
var m1Timestamps = [];
var m2Timestamps = [];
var s1Timestamps = [];
var s2Timestamps = [];

var m1Latency = [];
var m1DataUsage = [];
var m1Signal = [];
var m2Latency = [];
var m2DataUsage = [];
var m2Signal = [];

var s1Temp = [];
var s1Hum = [];
var s2Temp = [];
var s2Hum = [];

//CSV strings that will be passed to graphing library
var m1Csv = "Date,DataUsage,Latency\n";
var m2Csv = "Date,DataUsage,Latency\n";
var s1Csv = "Date,Temperature,Humidity\n";
var s2Csv = "Date,Temperature,Humidity\n";

var mostRecentMasterData;
var mostRecentSlaveData;

window.onload = function(){
	var value = $('#drop-down').val();
	refreshData(value);
}

$('#drop-down').change(function(){
	var value = $('#drop-down').val();
	refreshData(value);
});

var refreshData = function(table) {
	clearData();

	//Make API calls to get JSON
	if(table === "master1") {
		$.getJSON((apiUrl + 'masterdata/1'), function(json_data){
			processJSON(json_data, "master", 1);
			createCSV("master1");
			var g1 = new Dygraph(document.getElementById("graph"), m1Csv); 
			printMostRecentMasterValue();
		});
	}

	if(table === "master2") {
		$.getJSON((apiUrl + 'masterdata/2'), function(json_data){
			processJSON(json_data, "master", 2);
			createCSV("master2");
			var g2 = new Dygraph(document.getElementById("graph"), m2Csv);
			printMostRecentMasterValue();
		}); 
	}

	if(table === "slave1") {
		$.getJSON((apiUrl + 'slavedata/1'), function(json_data){
			processJSON(json_data, "slave", 1);
			createCSV("slave1");
			var g3 = new Dygraph(document.getElementById("graph"), s1Csv);
			printMostRecentSlaveValue();
		}); 
	}

	if(table === "slave2") {
		$.getJSON((apiUrl + 'slavedata/2'), function(json_data){
			processJSON(json_data, "slave", 2);
			createCSV("slave2");
			var g4 = new Dygraph(document.getElementById("graph"), s2Csv);
			printMostRecentSlaveValue();
		}); 
	}
};

var processJSON = function(data, type, num) {
	if(type === "master") {
		mostRecentMasterData = data.Items[data.Count - 2];
	}
	if(type === "slave") {
		mostRecentSlaveData = data.Items[data.Count - 1];
	}
	for(var i = 0; i < data.Count; i += dataResolution) {
		var item = data.Items[i];
		if(type === "master" && item.latency.N != "0") {
			if(num == 1) {
				m1Signal.push(parseInt(item.signalStrength.N));
				m1Latency.push(parseInt(item.latency.N));
				m1DataUsage.push(parseInt(item.dataUsage.N));
				m1Timestamps.push(new Date(parseInt(item.timestamp.N)));
			} else if(num == 2) {
				m2Signal.push(parseInt(item.signalStrength.N));
				m2Latency.push(parseInt(item.latency.N));
				m2DataUsage.push(parseInt(item.dataUsage.N));
				m2Timestamps.push(new Date(parseInt(item.timestamp.N)));
			} 
		} else if (type === "slave") {
			if(num == 1) {
				s1Temp.push(cToF(parseFloat(item.temperature.N)));
				s1Hum.push(parseFloat(item.humidity.N));
				s1Timestamps.push(new Date(parseInt(item.timestamp.N)));
			} else if(num == 2) {
				s2Temp.push(cToF(parseFloat(item.temperature.N)));
				s2Hum.push(parseFloat(item.humidity.N))
				s2Timestamps.push(new Date(parseInt(item.timestamp.N)));
			}
		}
	}
};

//convert all data into 4 csv strings for graphing
var createCSV = function(table) {
	var i;
	if(table === "master1") {
		for(i = 0; i < m1Timestamps.length; i++) {
			var dateString = getDateString(m1Timestamps[i]);
			var csvLine = dateString + ',' + m1DataUsage[i] + ',' + m1Latency[i] + '\n';
			m1Csv += csvLine;
		}
		console.log(m1Csv);
		console.log(m1Timestamps);
	} 
	if(table === "master2") {
		for(i = 0; i < m2Timestamps.length; i++) {
			var dateString = getDateString(m2Timestamps[i]);
			var csvLine = dateString + ',' + m2DataUsage[i] + ',' + m2Latency[i] + '\n';
			m2Csv += csvLine;
		}
		console.log(m2Csv);
	}

	if(table === "slave1") {
		for(i = 0; i < s1Timestamps.length; i++) {
			var dateString = getDateString(s1Timestamps[i]);
			var csvLine = dateString + ',' + s1Temp[i] + ',' + s1Hum[i] + '\n';
			s1Csv += csvLine;
		}
		console.log(s1Csv);
	}

	if(table === "slave2") {
		for(i = 0; i < s2Timestamps.length; i++) {
			var dateString = getDateString(s2Timestamps[i]);
			var csvLine = dateString + ',' + s2Temp[i] + ',' + s2Hum[i] + '\n';
			s2Csv += csvLine;
		}
		console.log(s2Csv);
	}

};

var getDateString = function(date) {
	var month = date.getMonth() + 1;
	var day = date.getDate();
	if(month < 10) {
		month = '0' + month;
	}
	if(day < 10) {
		day = '0' + day;
	}
	return date.getFullYear() + '-' + month + '-' + day;
};

var clearData = function() {
	m1Timestamps = [];
	m2Timestamps = [];
	s1Timestamps = [];
	s2Timestamps = [];

	m1Latency = [];
	m1DataUsage = [];
	m1Signal = [];
	m2Latency = [];
	m2DataUsage = [];
	m2Signal = [];

	s1Temp = [];
    s1Hum = [];
	s2Temp = [];
	s2Hum = [];
	m1Csv = "Date,DataUsage,Latency\n";;
	m2Csv = "Date,DataUsage,Latency\n";;
	s1Csv = "Date,Temperature,Humidity\n";
	s2Csv = "Date,Temperature,Humidity\n";
};

var printMostRecentMasterValue = function() {
	$('#mostRecent').html("<b>Id: </b>" + mostRecentMasterData.id.N + "<br/>"+
						  "<b>Latency: </b>" + mostRecentMasterData.latency.N + "<br/>"+
						  "<b>Data Usage: </b>" + mostRecentMasterData.dataUsage.N + "<br/>" +
						  "<b>Signal Strength: </b>" + mostRecentMasterData.signalStrength.N +"<br/>" +
						  "<b>Date: </b>" + new Date(parseInt(mostRecentMasterData.timestamp.N)));
};

var printMostRecentSlaveValue = function() {
	$('#mostRecent').html("<b>Id: </b>" + mostRecentSlaveData.id.N + "<br/>" +
						  "<b>Temperature: </b>" + mostRecentSlaveData.temperature.N + "<br/>" +
						  "<b>Humidity: </b>" + mostRecentSlaveData.humidity.N + "<br/>" +
						  "<b>Master Id: </b>" + mostRecentSlaveData.masterId.N + "<br/>" +
						  "<b>Date: </b>" + new Date(parseInt(mostRecentSlaveData.timestamp.N)));
};

var cToF = function(c) {
	return c * (9 / 5) + 32;
};