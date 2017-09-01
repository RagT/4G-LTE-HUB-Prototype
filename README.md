This repository contains the code for the Hub Based IoT Sensor Network project.

1. Using FRDM K64F Board with Shield

Link to repository (https://developer.mbed.org/users/RaghuT/code/ATT_IoT_Project/)

(From Demo README file)
#############################################################################################################
Resources
#############################################################################################################
Getting Started with MBED using FRDM-K64F: (NOTE!!! The FRDM bootloader MUST be updated to work with Windows 10)
https://developer.mbed.org/platforms/frdm-k64f/

Avnet IoT Kit quickstart:
https://starterkit.att.com/quickstart

AWS IoT Interactive Tutorial (what demo is based on):
https://us-west-2.console.aws.amazon.com/iot/home?region=us-west-2#/tutorial/help

AWS IoT C-SDK Tutorial (targeted for Raspberry Pi-2):
http://docs.aws.amazon.com/iot/latest/developerguide/iot-device-sdk-c.html

- Configuring settings 

1a) Option a (default) - Use an SD card:
    a) Format a MicroSD card to use a "FAT32" file system (https://www.sdcard.org/downloads/formatter_4/)

    b) Create a folder on the SD card root named 'certs'

    c) Copy your AWS things certs into this folder.  Your file paths should look exactly like this:
    /certs/rootCA-certificate.crt
    /certs/certificate.pem.crt
    /certs/private.pem.key

    d) Create a file in the 'certs' directory named 'mqtt_config.txt', and copy the template below into the file
       fill in these parameters with your AWS IoT thing information (minus the brackets):
       NOTE: Port is always 8883 (if not using web socket)
	AWS_IOT_MQTT_HOST=[1234asdf.iot.us-west-2.amazonaws.com]
	AWS_IOT_MQTT_PORT=8883
	AWS_IOT_MQTT_CLIENT_ID=[MyThingName]
	AWS_IOT_MY_THING_NAME=[MyThingName]

    e) Place SD card into the FRDM-K64F MicroSD slot before powering it on.


1b) Option b - Hard code certs/key and MQTT config:
    a) In the mbed ATT_AWS_IoT_demo project open "aws_iot_config.h" and comment out the following #define:
    //#define USING_SD_CARD

    b) In the mbed ATT_AWS_IoT_demo project open "aws_iot_config.h" and update the following to match your AWS 
       IoT 'thing':
    #define AWS_IOT_MQTT_HOST
    #define AWS_IOT_MQTT_CLIENT_ID
    #define AWS_IOT_MY_THING_NAME

    c) In the mbed ATT_AWS_IoT_demo project open "certs.cpp" and update the following to match your AWS 'thing' 
       private key and IoT certificate. NOTE Make sure the string format matches the format of AWS_IOT_ROOT_CA 
       (which is pre-populated):
    const unsigned char AWS_IOT_CERTIFICATE[]
    const unsigned char AWS_IOT_PRIVATE_KEY[]

2. Lambda functions

2a) Data Usage Lambda
	- This rule gets the data usage info for the current billing session for a specified sim card and updates
	  an AWS IoT thing shadow with the recieved data.

	- The function requires you to specify the Access key and Secret Key of an IAM User with permission to access 
	  the IoT data

	- You also need to specify the sim ICCID when making a get call with the function

	-(Suggestion) Update the thing shadow with the sim ICCID then get all the ICCID's from the things to make the 
	 get calls.

	- You will also need to create an authorization header to get a sim's data usage. Instructions here (https://marketplace.att.com/docs#rest-apis)

2b) Data Entry Lambda  
	- This lambda function is triggered when a thing shadow is updated.

	- It parses the data and posts it to DynamoDB tables

3. Front End
	- The front-end was made to simply display data in dynamoDB.

	- It calls an Amazon API from API gateway and shows the data using Dygraphs

4. Arduino code
	- The arduino code was used with arduino nano devices.

	- The network broadcasts a lot of messages from slaves to masters so it may not be extensible for many slaves

	- Consider redesigning using RF24 mesh network library for better scalability

5. Issues/Suggestions
	- In order to expand data usage lambda function to update more sim cards perhaps update thing shadow with the sim ICCID and have the function loop through all the thing ICCID's in your registry

	- The data usage for a sim only updates after the current session ends so in order to get an update to dataUsage you have to close the current session and open a new one. Currently this is done by simply resetting the board but this takes time(around 20 seconds).
	