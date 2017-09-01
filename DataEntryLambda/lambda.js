var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
const masterTable = "IoTMasterData";
const slaveTable = "IoTSlaveData";

String.prototype.replaceAll = function(str1, str2, ignore) 
{
	return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

function putInTable(tableName, item)
{
    dynamodb.putItem({
        "TableName": tableName,
        "Item" : item
    }, function(err, data) {
        if (err) {
            console.log('error','putting item into dynamodb failed: '+err);
        }
        else {
            console.log('great success: '+JSON.stringify(data, null, '  '));
        }
    });
}

exports.handler = (event, context, callback) => {
    //console.log(JSON.stringify(event, null, '  '));
    dynamodb.listTables(function(err, data) {
      console.log(JSON.stringify(data, null, '  '));
      console.log(err);
    });
    
    if(!event.hasOwnProperty("clientToken")){
        callback();
    }
    
    var masterId;
    
    //Check which thing we are referring to
    if(event.clientToken.includes("ATT_IoT2")){
        masterId = 2;    
    }  else if(event.clientToken.includes("ATT_IoT")) {
        masterId = 1;
    } else {
        callback();
    }
    
    var datetime = new Date().getTime().toString();
    var masterData = {
      "id": {"N": masterId.toString()},
      "timestamp": {"N": datetime},
      "signalStrength": {"N": event.state.reported.signalStrength.toString()},
      "dataUsage": {"N": event.state.reported.dataUsage.toString()},
      "latency": {"N": event.state.reported.latency.toString()}
    };
    putInTable(masterTable, masterData);
    
    var slaveData = {
      "id": -1,
      "timestamp": {"N" : datetime},
      "masterId": -1,
      "temperature": 0.0,
      "humidity": 0.0
    };
    if(event.state.reported.slaves === "")
    {
       callback();
    } else {
        
        var slaves = event.state.reported.slaves;
        slaves = slaves.replaceAll("?", "\"");
        console.log(slaves);
        var slaveArray = JSON.parse(slaves);
        for(var i = 0; i < slaveArray.length; i++)
        {
            slaveData.id = {"N": slaveArray[i].sensorId.toString() };
            slaveData.masterId = {"N": slaveArray[i].masterId.toString() };
            slaveData.temperature = {"N": slaveArray[i].temperature.toString() };
            slaveData.humidity = {"N": slaveArray[i].humidity.toString() };
            putInTable(slaveTable, slaveData);
        }
    }
};