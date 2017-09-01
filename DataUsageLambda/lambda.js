//Include neccessary libraries
const https = require('https');
const v4 = require('aws-signature-v4');
const crypto = require('crypto-js');

//AWS Post request credentials and info
const algorithm = 'AWS4-HMAC-SHA256'; //hashing algorithm
const region = 'your region here'; //AWS region 
const service = 'iotdata'; //to connect to AWS IoT
const accessKey = 'Your access key';
const secretKey = 'Your secret key';

function getDate(full) {
    var date = new Date();
    var month = date.getMonth() + 1;
    if(month < 10) {
        month = '0' + month;
    }
    var day = date.getUTCDate();
    if(day < 10) {
        day = '0' + day;
    }
    var hours = date.getUTCHours();
    if(hours < 10) {
        hours = '0' + hours;
    }
    var minutes = date.getUTCMinutes();
    if(minutes < 10) {
        minutes = '0' + minutes;
    }
    var seconds = date.getUTCSeconds();
    if(seconds < 10) {
        seconds = '0' + seconds;
    }
    if(full) {
        var dateString = date.getUTCFullYear() + '' + month + '' + day + 'T' + hours + '' + minutes + '' + seconds + 'Z';
        return dateString;
    } else {
        return date.getUTCFullYear() + '' + month + '' + day;
    }
}

function postCall(dataUsage, thingName) {
    var requestBody = '{"state": {"desired" : {"dataUsage": ' + dataUsage + '}}}';
    var hash = crypto.SHA256(requestBody);
    var payload = hash.toString(crypto.enc.Hex);
    var dateString = getDate(true);
    var path = '/things/' + thingName + '/shadow';
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': requestBody.length,
        'Host': 'a2m031708va2or.iot.us-west-2.amazonaws.com',
        'X-Amz-Date': dateString
    }

    var canonicalRequest = v4.createCanonicalRequest('POST', path, '', headers, payload);
    //console.log(canonicalRequest);
    var stringToSign = v4.createStringToSign(Date.now(), 'us-west-2', service, canonicalRequest);
    //console.log(stringToSign);
    var signature = v4.createSignature(secretKey, Date.now(), 'us-west-2', service, stringToSign);
    
    headers['Authorization'] = algorithm + ' Credential=' + accessKey + '/' + getDate(false) + '/us-west-2/' + service
                                + '/aws4_request, '  + 'SignedHeaders=content-length;content-type;host;x-amz-date, ' +
                                'Signature=' + signature; 
    
    var options = {
        host: 'a2m031708va2or.iot.us-west-2.amazonaws.com',
        port: 443,
        path: path,
        headers: headers,
        method: 'POST'
    }
    
    // Set up the request
    var post_req = https.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });
    
    // post the data
    post_req.write(requestBody);
    post_req.end();

}

function getCall(iccid, thingName) {
    var headers = {
        'Authorization' : 
        'Your Authorization Header here'
    }
    var options = {
        host: 'api-iotdevice.att.com',
        port: 443,
        path: '/rws/api/v1/devices/' + iccid + '/ctdUsages',
        headers: headers,
        method: 'GET'
    }
    console.log(options);
    var getReq = https.request(options, function(res) {
        console.log("\nstatus code: ", res.statusCode);
        res.on('data', function(data) {
            var jsonData = JSON.parse(data);
            var dataUsage = jsonData.ctdDataUsage;
            postCall(dataUsage, thingName);
        });
    });
    
    //end the request
    getReq.end();
    getReq.on('error', function(err){
        console.log("Error: ", err);
    });
}

exports.handler = (event, context, callback) => {
    getCall('Your sim number here', 'ATT_IoT');
    getCall('Your other sim number here', 'ATT_IoT2');
};