import json
import math

def readJson(fileName):
    with open(fileName) as inputJson:
        json_data = inputJson.read()
    return json.loads(json_data)

def calcMinDistance(neighborArray):
    #For every neighborhood
    for i in neighborArray:
        minDistance = 9999999
        #For every neighborhood
        for j in neighborArray:
            #Don't compare a neighborhood to itself
            if i['key'] != j['key']:
                #Euclidean Distance Formula
                distance = math.sqrt((i['values']['longitude'] - j['values']['longitude'])**2 + (i['values']['latitude'] - j['values']['latitude'])**2)
                if distance < minDistance:
                    minDistance = distance
        #Add minimum distance to the array
        i['values']['minDistance'] = minDistance*100
    return neighborArray

def writeToJson(neighborArray, fileName):
    with open(fileName, 'w') as outputjson:
            json.dump(neighborArray, outputjson)

if __name__ == "__main__":
    neighborArray = readJson('./data/neighborhoods.json')
    neighborArray = calcMinDistance(neighborArray)
    writeToJson(neighborArray, './data/neighborhood_data.json')