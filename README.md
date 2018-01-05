# Overview
A visualization of crime activity in the Atlanta Metro area during 2016

## Usage
You can view the website at: <coming shortly> or download the project and load the html in a local browser. All data files are provided formatted appropriately, however python scripts can be found in the 'scripts' folder that were used to format the original data obtained here: http://opendata.atlantapd.org/Crimedata/Default.aspx .

## Goal
This was a final project for my Data Visualization course at the University of Illinois Urbana-Champaign. The goal for this project was to demonstrate a working knowledge around D3.js and how to practically leverage it to create a visualization narrative. 

## Technologies
- D3.js for data visualization rendering
- Mapzen for map rendering.
- CSS3 for stylizing

## Challenges Overcome
The focus of this project was purely on client-side technologies, so some creativity was needed to display data of this scale without any server-side rendering. One way I did this was by breaking up the single .csv file originally obtained with all crime data into 240+ neighborhood-level json files. This allows me to load only the data specific to the neighborhood the user clicks rather than loading all crime events in Atlanta. To provide information for the main page, data aggregation was performed and stored in an aggregate json file, offloading the need to do aggregations in the javascript. 

## Remaining Challenges
Due to deadline and scope of project, the code itself needs to be cleaned up significantly. Also Mapzen recently announced it's closure and it's map service will no longer be available after February 2018, so that will need to be addressed.
