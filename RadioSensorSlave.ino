//Required Libraries

//For nrf24l01 radio module
#include "nRF24L01.h"
#include "RF24.h" 
#include <SimpleTimer.h>

#include "SPI.h" //spi interface
#include <dht.h> //for dht 22 temp/humidity sensor
#include "printf.h"


#define DHT22_PIN 7
#define SENSOR_ID 2

dht DHT;
SimpleTimer timer;
RF24 radio(9,10);
const byte slaveAddress[5] = {'R','x','A','A','A'};
const byte masterAddress[5] = {'T','X','a','a','a'};

//16 bytes
typedef struct 
{
  float temperature;
  float humidity; 
  int sensorID; //Unique id of this sensor device
  int masterID; //Id of master device
}
data;

typedef struct 
{
  int masterID;
  int signalStrength;
  unsigned long dataUsage;
  unsigned long latency;
}
masterData;

data dataToSend;
masterData dataRecieved;
masterData currentMaster;
bool masterAck = false;
int masterAckTimeout = 5000;
int ackTimerId;

void setup(void)
{
  Serial.begin(9600);
  printf_begin();
  printf("\n\rRadio Setup\n\r");
  radio.begin();
  radio.setDataRate(RF24_1MBPS);
  radio.setCRCLength(RF24_CRC_8);
  radio.setPayloadSize(32);
  radio.setChannel(101);
  radio.setRetries(3,5); // delay, count
  dataToSend.sensorID = SENSOR_ID;
  dataToSend.masterID = -1;
  currentMaster.masterID = -1;
  radio.powerUp();
  radio.openWritingPipe(masterAddress); 
  radio.openReadingPipe(1, slaveAddress);
  radio.setAutoAck(true);
  radio.printDetails();
  timer.setInterval(2000, mainFunction);
  ackTimerId = timer.setInterval(masterAckTimeout, checkMasterAck);
}

void loop(void)
{
  timer.run();
}

void mainFunction()
{
  checkDHT();
  radioWrite();
}

void radioWrite() 
{
  radio.stopListening();

  //In case master has changed
  dataToSend.masterID = currentMaster.masterID;
  
  bool ok = radio.write( &dataToSend,sizeof(dataToSend));
  radio.startListening();
  while (radio.available()) 
  {
    radio.read(&dataRecieved, sizeof(masterData));

    //Update currentMaster
    if(currentMaster.masterID == -1)
    {
      currentMaster = dataRecieved; //Assign master
      masterAck = true;
    } 
    else if(currentMaster.masterID == dataRecieved.masterID)
    {
      currentMaster = dataRecieved; //Update master data
      masterAck = true;
    }
    else if(currentMaster.dataUsage > dataRecieved.dataUsage)
    {
      currentMaster = dataRecieved; //Update master data
      masterAck = true;
    }
  }
  if(masterAck)
  {
    timer.restartTimer(ackTimerId);
  }
  Serial.print("Master Id:");
  Serial.println(currentMaster.masterID);
}

void checkMasterAck()
{
  if(!masterAck)
  {
    currentMaster.masterID = -1;  
  }
  masterAck = false;
}

bool switchMaster()
{
  float dataUsageScale = (float) currentMaster.dataUsage / dataRecieved.dataUsage;
  float latencyScale = (float) currentMaster.latency / dataRecieved.latency;

  float sum = (dataUsageScale + latencyScale) / 2;
  return sum > 1.5;  
}

//Checks the humidity and temperature 
void checkDHT() 
{
  int chk = DHT.read22(DHT22_PIN);
  
  //Reads data if sensor ready
  if(chk == DHTLIB_OK) {
    dataToSend.temperature = DHT.temperature;
    dataToSend.humidity = DHT.humidity;
  }
}
