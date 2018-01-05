import csv
import json

def aggregateCSVData(fileName, yearCol, crimeCol, years):
    overview = {}
    total = 0

    with open(fileName) as inputCSV:
        readCSV = csv.reader(inputCSV, delimiter=',')
        #Skip header
        next(readCSV, None)
        for row in readCSV:
            year = row[yearCol].split('/', 2)[2]
            crime = row[crimeCol]
            if year in years:
                #Use crime + year as key for dictionary
                if (crime + year) in overview:
                    overview[crime + year]['count'] += 1
                else:
                    overview[crime + year] = {}
                    overview[crime + year]['crime'] = crime
                    overview[crime + year]['year'] = year
                    overview[crime + year]['count'] = 1
                
                #Create a seperate key for non-crime-specific totals
                if ('total' + year) in overview:
                    overview['total' + year]['count'] += 1
                else:
                    overview['total' + year] = {}
                    overview['total' + year]['crime'] = 'TOTAL CRIME'
                    overview['total' + year]['year'] = year
                    overview['total' + year]['count'] = 1
    return overview
            
#Convert dictionary to list of objects         
def dictToList(dictionary):
    resultsList = []
    for key in dictionary:
        resultsList.append(dictionary[key])
    return resultsList
    
#Write an array to JSON
def writeToJson(jsonList, fileName):
    with open(fileName, 'w') as outputjson:
            json.dump(jsonList, outputjson)

if __name__ == "__main__":
    years = ['2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016']
    results = aggregateCSVData('./data/ATL_CRIME_MASTER.csv', 3, 18, years)
    resultsList = dictToList(results)
    writeToJson(resultsList, './data/atl_crime_overview.json')