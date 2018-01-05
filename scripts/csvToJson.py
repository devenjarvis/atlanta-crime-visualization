import csv
import json

#Read CSV
def readCSVToDict(fileName, columns, splitColumn, year):
    results = {}
    with open(fileName) as inputcsv:
        readCSV = csv.reader(inputcsv, delimiter=',')
        #Skip the header
        next(readCSV, None)
        for row in readCSV:
            crime = {}
            #If the date is within the given year.
            if row[3].split('/', 2)[2] == year:
                for key, value in columns.items():
                    crime[key] = row[value]

                #Clean up the time field
                crime['occur_time'] = crime['occur_time'].split(':', 1)[0]
                if crime[splitColumn].lower() in results:
                    results[crime[splitColumn].lower()].append(crime)
                else:
                    results[crime[splitColumn].lower()] = [crime]
    return results

#Write JSON
def writeDictToJson(dictionary, path, fileSuffix):
    for key, value in dictionary.items():
        #Correct for specific neighborhood issues that arose with this dataset
        if '/' in key:
            neighborhoodName = key.lower().split('/')[0] + '_' + key.lower().split('/')[1]
        else:
            neighborhoodName = key.lower()
        with open(path + neighborhoodName + fileSuffix + '.json', 'w') as outputjson:
            json.dump(value, outputjson)

def cleanTime(dictionary):
    for key in dictionary:
        dictionary


if __name__ == "__main__":
    cols = {
                'occur_date' : 3,
                'street_address' : 10,
                'occur_time' : 4,
                'day' : 16,
                'type' : 18,
                'neighborhood' : 19,
                'longitude' : 21,
                'latitude' : 22
            }
    splitColumn = 'neighborhood'
    results = readCSVToDict('./data/ATL_2016.csv', cols, splitColumn, '2016')

    writeDictToJson(results, './data/', '_data_2016')