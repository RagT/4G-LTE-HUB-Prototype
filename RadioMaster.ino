//Required Libraries

//For nrf24l01 radio module
#include "nRF24L01.h"
#include "RF24.h" 

#include "SPI.h" //spi interface
#include "printf.h"

#define MASTER_ID 2

RF24 radio(9,10);
const int MAX_SLAVES = 50;
const byte slaveAddress[5] = {'R','x','A','A','A'};
const byte masterAddress[5] = {'T','X','a','a','a'};

//16 bytes
typedef struct {
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

data dataRecieved;
masterData myData;

data slaveData[MAX_SLAVES];
int lastIndex = 0;
int numSlaves = 0;

void setup() 
{
  Serial.begin(9600);
  printf_begin();
  radio.begin();
  radio.setDataRate(RF24_1MBPS);
  radio.setCRCLength(RF24_CRC_8);
  radio.setPayloadSize(32);
  radio.setChannel(101);
  radio.powerUp();
  radio.setAutoAck(true);
  //radio.printDetails();
  radio.setRetries(3,5); // delay, count
  radio.openWritingPipe(slaveAddress);
  radio.openReadingPipe(1, masterAddress);
  dataRecieved.temperature = 0.0;
  dataRecieved.humidity = 0.0;
  radio.startListening();
  myData.masterID = MASTER_ID;
  myData.dataUsage = 0;
  initSlaveArray();
}

void loop()
{
  if(Serial.available())
  {
    char c = Serial.read();
    if(c == 'd')
    {
      Serial.print(getJSONData());
    }
    if(c == '*')
    {
      String dataUsage = Serial.readStringUntil(',');
      String latency = Serial.readStringUntil(',');
      String signalStrength = Serial.readStringUntil('\n');
      myData.dataUsage = dataUsage.toInt();
      myData.latency = latency.toInt();
      myData.signalStrength = signalStrength.toInt();
    }
  }
  if(radio.available()) 
  {
    radio.read(&dataRecieved, sizeof(dataRecieved) );
    handleRecievedData();
    writeToSlaves();
  }
}

//Add new data to array for new slave, update data for existing slaves, or remove a slave that has switched to other master
void handleRecievedData() 
{
  bool found = false;
  int i;
  for(i = 0; i < numSlaves; i++)
  {
    if(slaveData[i].sensorID > 0)
    {
      myData.dataUsage++;
      if(dataRecieved.sensorID == slaveData[i].sensorID)
      {
        if(dataRecieved.masterID == MASTER_ID)
        {
          //update slave with latest recieve data
          slaveData[i] = dataRecieved;
          found = true;
        }
        else 
        {
          //remove slave data from list
          removeSlave(i);
          i--;
          found = true;
        }
      }
    }
    else 
    {
      break;
    }
  }

  //Add new slave
  if(!found && dataRecieved.masterID == MASTER_ID && lastIndex < MAX_SLAVES)
  {
    slaveData[i] = dataRecieved;
    lastIndex++;
    numSlaves++;
  }
}

void writeToSlaves()
{
  radio.stopListening();
  bool ok = radio.write(&myData, sizeof(myData));
  radio.startListening();
}

void printRecievedData(const data &dataRecieved)
{
  Serial.print("Temperature: ");
  Serial.println(dataRecieved.temperature);
  Serial.print("Humidity: ");
  Serial.println(dataRecieved.humidity);   
  printf("SensorId: %i\n", dataRecieved.sensorID);
  printf("MasterId: %i\n", dataRecieved.masterID);
}


//Intialize slave array with null slaves
void initSlaveArray()
{
  data nullData;
  nullData.sensorID = -1;
  nullData.masterID = MASTER_ID;
  for(int i = 0; i < MAX_SLAVES; i++)
  {
    slaveData[i] = nullData;      
  }
}

void setSlaveInfo(int index, const data &dataRecieved)
{
  slaveData[index].temperature = dataRecieved.temperature;
  slaveData[index].humidity = dataRecieved.humidity;
  slaveData[index].sensorID = dataRecieved.sensorID;
  slaveData[index].masterID = dataRecieved.masterID;
}

void removeSlave(int index) 
{
  if(index > (MAX_SLAVES - 1))
  {
    return;
  }
  data nullData;
  nullData.sensorID = -1;
  nullData.masterID = MASTER_ID;
  slaveData[index] = nullData;
  if(index < (lastIndex - 1))
  {
    swap(slaveData[index], slaveData[lastIndex - 1]);
  }
  lastIndex--;
  numSlaves--;
}

void swap(data &a, data &b)
{
  data temp = a;
  a = b;
  b= temp;  
}

void printSlaveData()
{
  Serial.println(getJSONData());
  Serial.println();
}

//Convert slave array to JSON string
String getJSONData()
{
  String result = "[";
  for(int i = 0; i < numSlaves; i++)
  {
    result += getJSONSlaveObject(i);
    if(i < (numSlaves - 1))
    {
      result += ",";
    }
  }
  result += "]";
  return result;
}

String getJSONSlaveObject(int i)
{
  String result = "{temperature:" + String(slaveData[i].temperature, 4) + ",humidity:" + String(slaveData[i].humidity,4)
                  + ",sensorId:" + slaveData[i].sensorID + ",masterId:" + slaveData[i].masterID + "}";
  return result;
}

