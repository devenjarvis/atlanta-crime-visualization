var mapWidth = (6.5*window.innerWidth/10);
var visWidth = (3.5*window.innerWidth/10) - 10;
var height = window.innerHeight;
var layers = ['roads'];
var title = 'Atlanta Crime In 2016';
var description = 'Atlanta, Georgia ranks above the national median for crime, and though officials have made great strides in reducing crime over the past ' 
                   + 'few decades, crime does remain a sizable problem. Atlanta continues to rank high in \"most violent\" or \"most crime-ridden\" cities within the nation. The graph below explores the overall trend of crime in '
                   + 'Atlanta between 2009 and 2016, showing an overall decrease in crime, but demonstrating an increase in violent crimes such as homicide or rape. The interactive map to the right can be used to '
                   + 'explore when, where, and what kind of crime is occuring within specific neighborhoods of Atlanta during 2016. Try clicking into a neighborhood to get a more detailed picture of crime in that area.';
var tile = d3.geo.tile().size([mapWidth, height]);
var crimeColor = d3.scale.ordinal()
            .range(['#663831','#72414A','#714F65','#62617A','#4C7385','#3D8480','#4B9171','#709A5C','#9D9F4E','#CC9E51','#F59B6B', '#DDDFDF'])
            .domain(['AGG ASSAULT', 'AUTO THEFT', 'BURGLARY-NONRES', 'BURGLARY-RESIDENCE', 'HOMICIDE', 'LARCENY-FROM VEHICLE', 'LARCENY-NON VEHICLE', 'RAPE', 'ROBBERY-COMMERCIAL', 'ROBBERY-PEDESTRIAN', 'ROBBERY-RESIDENCE', 'TOTAL CRIME']);

//Setup Projection
var projection = d3.geo.mercator()
    .center([-84.38, 33.74])
    .scale(699050 / 2 / Math.PI) //1 << 19
    .translate([mapWidth/2, height/2]);

//Setup geo path
var path = d3.geo.path()
    .projection(projection);

//Setup Vis SVG
var vis = d3.select('body').append('svg')
    .attr('class', 'vis')
    .attr('width', visWidth)
    .attr('height', height);

//Display title
var visTitle = vis.append('text')
    .attr('x', 20)
    .attr('y', 50)
    .style('font-size', '40px')
    .text(title);

//Display description
var visDescription = d3.select('body').append('div')
    .attr('class', 'description')
    .html(description)
    .style('left', 20 + 'px')
    .style('top', 70 + 'px')
    .style('width', visWidth - 20 + 'px')
    .style('height', 320 + 'px')
    .style('color', 'white');

//Display Overview Graph
var tooltip = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0.0);

var lineGraph = vis.append('g');

d3.json("./data/atl_crime_overview.json", function(error, json) {
    var margin = {top: 400, right: 20, bottom: 30, left: 40};
    var graphWidth = visWidth - margin.left - margin.right;
    var graphHeight = height - margin.top - margin.bottom;
    var parseDate = d3.time.format("%Y").parse;

    var x = d3.time.scale().range([0, graphWidth]);
    var y = d3.scale.log().base(2).range([graphHeight, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom');

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient('left')
        .ticks(20, ",.1s")
        .tickSize(6, 0);

    var crimeLine = d3.svg.line()
        .x(function(d) { return x(d.year); })
        .y(function(d) { return y(d.count); });

    lineGraph.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    json.sort(function(x, y) { return d3.ascending(x.year, y.year); });
    json.forEach(function(d) {
        d.year = parseDate(d.year);
    });

    x.domain(d3.extent(json, function(d) { return d.year; }));
    y.domain([80, d3.max(json, function(d) { return d.count; })]).nice();

    var nest = d3.nest()
        .key(function(d) { return d.crime;})
        .entries(json);

    lineGraph.selectAll('path.line')
        .data(nest).enter().append("path")
        .attr("class", "line")
        .attr("d", function(d) { return crimeLine(d.values); })
        .style('stroke', function(d) { return crimeColor(d.key); })
        .style('stroke-width', 5)
        .on('mouseover', overviewMouseover)
        .on('mouseout', overviewMouseout)
        .on('mousemove', overviewMousemove);
    
    lineGraph.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + graphHeight + ')')
        .call(xAxis);

    lineGraph.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

    function overviewMouseover(data) {
        lineGraph.selectAll('.line')
                        .style('stroke', function(d) {
                            if (d.key == data.key)
                                return crimeColor(d.key);
                            else
                                return 'grey';
                        });
        tooltip
            .style("opacity", 0.8)
            .style("width", "150px")
            .style("height", "50px")
            .html(data.key);
    }

    function overviewMousemove(data) {
        tooltip
            .style("left", (d3.event.pageX - 60) + "px")
            .style("top", (d3.event.pageY - 65) + "px");
    }

    function overviewMouseout(data) {
        lineGraph.selectAll('.line').style('stroke', function(d) { return crimeColor(d.key); })

        tooltip
            .style("opacity", 0.0);
    }
    
});

//Setup Map SVG
var map = d3.select('body').append('svg')
    .attr('class', 'map')
    .attr('width', mapWidth)
    .attr('height', height);

/* Start g block */
var background = map.selectAll('g')
    .data(tile.scale(projection.scale() * 2 * Math.PI)
        .translate(projection([0, 0])))
    .enter().append('g')
        .each(function(d) {
            var background = d3.select(this);
            d3.json('https://tile.mapzen.com/mapzen/vector/v1/roads/' + d[2] + '/' + d[0] + '/' + d[1] + '.topojson?api_key=vector-tiles-LM25tq4', function(error, json) {
                if (error) throw error;

                var data = {};
                for (var key in json.objects) {
                    data[key] = topojson.feature(json, json.objects[key]);
                }   

                var features = [];
                layers.forEach(function(layer){
                    if(data[layer])
                    {
                        for(var i in data[layer].features)
                        {
                            if (data[layer].features[i].properties.kind == 'major_road' || data[layer].features[i].properties.kind == 'highway') {
                            data[layer].features[i].layer_name = layer;
                            features.push(data[layer].features[i]);
                            }
                        }
                    }
                });

                background.selectAll('path')
                    .data(features)//.sort(function(a, b) { return a.properties.sort_rank ? a.properties.sort_rank - b.properties.sort_rank : 0 ; }))
                    .enter().append('path')
                    .attr('class', function(d) { return d.properties.kind; })
                    .attr('d', path);
                });
        });
    /* End g block */
var linkClicked = false;
//Display 'About this visualization
var mapLink = map.append('text')
    .attr('x', mapWidth - 270)
    .attr('y', height - 20)
    .style('font-size', '24px')
    .text('About this Visualization')
    .on('mouseover', function(d) { mapLink.style('fill', '#CC9E51')})
    .on('mouseout', function(d) { mapLink.style('fill', '#DDDFDF')})
    .on('click', function(d) { 
        if(linkClicked) {
            visTitle.text(title);
            visDescription
                .style('font-size', '18px').style('height', '320px').html(description);
            mapLink.text('About this Visualization');
            lineGraph
                .style("opacity", 1.0)
                .style("pointer-events", "all");
            linkClicked=false;
        }
        else {
            visTitle.text('About This Visualization');
            visDescription
                .style('font-size', '14px')
                .style('height', height + 'px')
                .html('This visualization was created by Deven Jarvis using D3.js as a final project for CS 498, Data Visualization at UIUC. '    +
            'The narrative visualization uses a drill down story structure, providing a high-level overview of crime trends in Atlanta, while allowing'     +
            ' the user to dive deeper into specific locations within Atlanta to gather more specific details. <br/><br/> In total, there are 241 scenes that'    +
            ' are dynamically created in this visualization, one for the city-wide overview, and one for each of the 240 neighborhoods that Metro Atlanta'  +
            ' is divided into. These scenes all follow a template with a marked, interactive section of the map on the right and annotations and an'        +
            ' aggregate graph (line or bar) on the left. Colors are kept consistent throughout the scenes, corresponding the same crimes to the same colors'+
            ' in each scene. <br/><br/> Each of the 241 scenes contain annotations that help guide the user towards notable information. The city-wide scene'    +
            ' provides an introductory paragraph, giving a history to Atlanta\'s crime, a justification for this visualization, as well as trends of '       +
            'specific crimes that are contrary to the overall trend. Each individual neighborhood contains a dynamically generated annotation that gives '  +
            'the user insight into the most common type, time, and day for crimes to happen within this neighborhood. All graphs and map markers also '     +
            'utilize tooltips to allow for clarity and often more specific information (such as the address a specific crime event occurred). <br/><br/> The '   +
            'parameters that users may interact with in this visualization include overall crime trends, what neighborhood to drill down into, and '   +
            'types of crime within a neighborhood to investigate. The overall crime trends are shown in the city-wide multiline graph, with '   +
            'specific trends being triggered when the user mouse-overs a specific line. The neighborhood that the user chooses to explore is triggered by ' +
            'clicking on one of the neighborhood markers in the main scene. Finally, specific crime locations can be filtered when the user '      +
            'mouse-overs or clicks a bar corresponding to a crime type in the neighborhood scene bar graph. <br/><br/> My goal is that users of this '       +
            'visualization find an accessible way to explore interesting crime trends in the Metro Atlanta area, specifically with a focus for those who '  +
            'wish to consider specific neighborhoods that they may live, work, or visit in. I hope you find this visualization meets that goal.');
            lineGraph
                .style("opacity", 0.0)
                .style("pointer-events", "none");
            mapLink.text('Return to Visualization');
            linkClicked=true;
        }
        });

/* Start map load */
d3.json('./data/neighborhood_data.json', function(error, neighborhoods) {
    var foci = [];
    var points = [];

    neighborhoods.forEach(function(d, i) {
        var c = projection([d.values.longitude, d.values.latitude]);
        foci.push({x: c[0], y: c[1]});
        points.push({x: c[0], y: c[1], label: d.key, count: d.values.count, minDist: d.values.minDistance});
    });

    //Create force layout
    var force = d3.layout.force()
        .nodes(points)
        .charge(function(d) { return -(1/d.minDist)*2;})
        .gravity(0)
        .size([mapWidth, height]);
    

    //Display points for neighborhood location
    var overlay = map.append('g');
    
    neighborhoodPoints = overlay.selectAll('circle')
        .data(points)
        .enter().append('circle');
    neighborhoodPoints
            .attr('class', 'neighborhood')
            .attr('cx', function(d) { return d.x; })
            .attr('cy', function(d) { return d.y; })
            .attr('r', function(d) { return Math.log2(d.count)*1.2})
            .attr('fill-opacity', '0.9')
            .attr('fill', '#1F7A8C')
            .on('click', neighborhoodClick)
            .on('mouseover', neighborhoodMouseover)
            .on('mouseout', neighborhoodMouseout);

    force.on('tick', function(e) {
        //Change Rate
        var k = .5 * e.alpha;

        //Calculate new point locations
        points.forEach(function(o, j) {
            o.y += (foci[j].y - o.y) * k;
            o.x += (foci[j].x - o.x) * k;
        });

        map.selectAll('circle.neighborhood')
            .attr('cx', function(d) { return d.x;})
            .attr('cy', function(d) { return d.y});
    });

    force.start();

    d3.select('svg.map')
        .on('click', zoomOut);

    var zoomed = false;

    function zoomIn(x, y, scale) {
        overlay
            .transition().duration(750).delay(400)
            .attr('transform', 'translate(' + mapWidth/2 + ',' + height/2 + ')scale(' + scale + ')translate(' + -x + ',' + -y + ')')
       
        neighborhoodPoints
            .transition().duration(750)
            .attr('r', '0px');

        background
            .transition().duration(750).delay(400)
            .attr('transform', 'translate(' + mapWidth/2 + ',' + height/2 + ')scale(' + scale + ')translate(' + -x + ',' + -y + ')');

        tooltip.style("opacity", 0.0);

        lineGraph
            .style("opacity", 0.0)
            .style("pointer-events", "none");

        zoomed=true;
        
        mapLink
            .text('About this Visualization')
            .style('opacity', 0.0)
            .style('pointer-events', 'none');

        linkClicked=false;
    } 

    function zoomOut() {
        if (zoomed) {
        vis.select('g.barGraph').remove();

        //Zoom out the map layer
        background
            .transition().duration(750)
            .attr('transform', 'scale(' + 1 + ')translate(' + 0 + ',' + 0 + ')');

        //Resize the neighborhood markers
        neighborhoodPoints
            .transition().duration(350).delay(400)
            .attr('r', function(d) { return Math.log2(d.count)});

        //Remove vis charts and text
        visTitle.text(title);
        visDescription.html(description);

        tooltip 
            .style("opacity", 0.0);

            lineGraph
                .style("opacity", 1.0)
                .style("pointer-events", "all");

            mapLink.style('opacity', 1.0).style('pointer-events', 'all');

            zoomed=false;

        //Zoom out our overlay layer
        overlay
            .transition().duration(750)
            .attr('transform', 'scale(' + 1 + ')translate(' + 0 + ',' + 0 + ')')
            .selectAll('circle.crimeEvent').remove();
        }
    }               

    function neighborhoodClick(data, index) {
        //Get neighborhoodName
        var neighborhoodName = ''
        if(data.label.includes('/')) {
            neighborhoodName = data.label.toLowerCase().split('/')[0] + '_' + data.label.toLowerCase().split('/')[1];
        } else {
            neighborhoodName = data.label.toLowerCase();
        }

        /*Start neighborhood load block */
        d3.json('./data/' + neighborhoodName + '_data_2016.json', function(error, json) { 
            //Update Neighborhood Label
            visTitle.text(data.label);
            zoomIn(data.x, data.y, 9);

            //Build annotation
            var typeAgg = d3.nest()
                    .key(function(d) {return d.type; })
                    .rollup(function(v) { return v.length; })
                    .entries(json);
            var commonCrime = typeAgg
                    .sort(function(x, y) { return d3.descending(x.values, y.values); })
                    [0].key;

            var commonTime = d3.nest()
                    .key(function(d) {return d.occur_time; })
                    .rollup(function(v) { return v.length; })
                    .entries(json)
                    .sort(function(x, y) { return d3.descending(x.values, y.values); })
                    [0].key;

            var commonDay = d3.nest()
                    .key(function(d) {return d.day; })
                    .rollup(function(v) { return v.length; })
                    .entries(json)
                    .sort(function(x, y) { return d3.descending(x.values, y.values); })
                    [0].key;

            if(parseInt(commonTime) > 13) {
                newTime = parseInt(commonTime) - 12;
                commonTime = String(newTime) + ':00 PM';
            }
            else if(parseInt(commonTime) == 0) {
                newTime = 12;
                commonTime = String(newTime) + ':00 PM';
            }
            else {
                newTime = parseInt(commonTime);
                commonTime = String(newTime) + ':00 AM'; 
            }

            switch(commonDay) {
                case 'Mon':
                    commonDay = 'Monday';
                    break;
                case 'Tue':
                    commonDay = 'Tuesday';
                    break;
                case 'Wed':
                    commonDay = 'Wednesday';
                    break;
                case 'Thu':
                    commonDay = 'Thursday';
                    break;
                case 'Fri':
                    commonDay = 'Friday';
                    break;
                case 'Sat':
                    commonDay = 'Saturday';
                    break;
                case 'Sun':
                    commonDay = 'Sunday';
                    break;
                default:
                    commonDay = 'unknown due to lack of data'
                    break;
            }

            visDescription
                .style('height', '320px')
                .html(
                'In ' + data.label + ' the most common type of crime is ' + commonCrime.toLowerCase() 
                + '. Crimes in this area normally occur at ' + commonTime + ', with the most common day for crime to happen being ' 
                + commonDay + '. <br/><br/> Click into the below offense types to filter the related criminal events, represented by the markers on the map.'
                );

            overlay.selectAll('circle.crimeEvent')
                .data(json)
                .enter().append('circle')
                    .attr('class', 'crimeEvent')
                    .attr('cx', function(d) { return projection([d.longitude,d.latitude])[0];})
                    .attr('cy', function(d) { return projection([d.longitude,d.latitude])[1];})
                    .attr('r', '1px')
                    .attr('fill-opacity', '0.7')
                    .on('mouseover', eventMouseover)
                    .on('mouseout', eventMouseout);

            function eventMouseover(data) {
                tooltip
                    .style("opacity", 0.8)
                    .style("width", "180px")
                    .style("height", "80px")
                    .html(data.type + '<br/>' + data.day + ', ' + data.occur_date + '<br/>' + data.street_address)
                    .style("left", (d3.event.pageX - 90) + "px")
                    .style("top", (d3.event.pageY - 100) + "px");
            }

            function eventMouseout(data) {
                tooltip
                    .style("opacity", 0.0);
            }

            function displayType() {
                var isClicked = '';

                //Fill in 0 values
                crimes = ['ROBBERY-RESIDENCE', 'ROBBERY-PEDESTRIAN', 'ROBBERY-COMMERCIAL', 'RAPE', 'LARCENY-NON VEHICLE', 'LARCENY-FROM VEHICLE', 'HOMICIDE', 'BURGLARY-RESIDENCE', 'BURGLARY-NONRES', 'AUTO THEFT', 'AGG ASSAULT'];
                for (var i = 0, len = crimes.length; i < len; i++) {
                    if (typeAgg.find(x => x.id === crimes[i])) 
                        ;
                    else
                        var newObject = { 'key': crimes[i], 'values': 0};
                        typeAgg.push(newObject)
                }

                //Sort x-axis of the bar chart
                typeAgg.sort(function(x, y) { return d3.ascending(x.key, y.key); });

                //Initialize newbarchart
                var margin = {top: 300, right: 20, bottom: 40, left: 5};
                var graphWidth = visWidth - margin.right - margin.left;
                var graphHeight = height - margin.top - margin.bottom;
                var y = d3.scale.ordinal().rangeRoundBands([graphHeight, 0]);
                var x = d3.scale.linear().range([0, graphWidth]);

                var barGraph = vis.append('g')
                    .attr('class', 'barGraph')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
                
                y.domain(typeAgg.map(function(d) { return d.key; }));
                x.domain([0, d3.max(typeAgg, function(d) { return d.values; })]);

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient('bottom');

                barGraph.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0,' + graphHeight + ')')
                    .transition().duration(750).delay(500)
                    .call(xAxis);

                //Draw barchart
                barGraph.selectAll('rect.bar')
                    .data(typeAgg)
                    .enter().append('rect')
                        .on('mouseover', crimeMouseover)
                        .on('mouseout', crimeMouseout)
                        .on('click', crimeClick)
                        .attr('class', 'bar')
                        .attr('fill', function(d) {return crimeColor(d.key);})
                        .attr('x', 0)
                        .attr('y', function(d) { return y(d.key); })
                        .attr('height', y.rangeBand())
                        .attr('width', 0)
                        .transition().duration(750).delay(500)
                        .attr('width', function(d) { return x(d.values); });

                barGraph.selectAll('.label')
                    .data(typeAgg)
                    .enter().append('text')
                        .attr('class', 'label')
                        .attr('text-anchor', 'start')
                        .attr('x', 0)
                        .attr('y', function(d) { return y(d.key) + y.rangeBand()/2;})
                        .attr('dy', '.50em')
                        .text(function(d) { return d.key; })
                        .attr('fill-opacity', 0.0)
                        .transition().duration(750).delay(500)
                        .attr('fill-opacity', 1.0)
                        .style("pointer-events", "none");

                overlay.selectAll('circle.crimeEvent')
                    .attr('fill', function(d) {return crimeColor(d.type);});

                function crimeMouseover(data) {
                    if(isClicked == '' && data.values > 0) {
                        //Hide other bars
                        barGraph.selectAll('rect.bar')
                            .attr('fill', function(d) {
                                if (d.key == data.key)
                                    return crimeColor(d.key);
                                else
                                    return 'grey';
                            });

                        //Only display these crime events
                        overlay.selectAll('circle.crimeEvent')
                            .attr('opacity', function(d) {
                                if (d.type == data.key)
                                    return 1.0;
                                else
                                    return 0.0;
                            })
                            .style("pointer-events", function(d) {
                                if (d.type == data.key)
                                    return 'all';
                                else
                                    return 'none';
                            });

                    }
                }

                function crimeMouseout(data) {
                    if(isClicked == '') {
                        //Hide other bars
                        barGraph.selectAll('rect.bar')
                            .attr('fill', function(d) {
                                    return crimeColor(d.key);
                            });

                        //Only display these crime events
                        overlay.selectAll('circle.crimeEvent')
                            .attr('opacity', function(d) {
                                    return 1.0;
                            })
                            .style("pointer-events", "all");
                    }
                }

                function crimeClick(data) {
                    if(isClicked == '')
                        isClicked=data.key;
                    else {
                        if (isClicked == data.key) {
                            isClicked='';
                            crimeMouseout(data);
                        }
                        else{
                            isClicked='';
                            crimeMouseover(data);
                            isClicked=data.key;
                        }
                    }
                }
            }

            displayType();
            
        });
        /*End Neighborhood load block */     
    }

    function neighborhoodMouseover(data, index) {
        d3.select(this)
            .attr('fill', '#BFDBF7 ');
            
        tooltip
            .style("opacity", 0.8)
            .html(data.label + '<br/>' + data.count + ' crimes')
            .style("left", (d3.event.pageX - 60) + "px")
            .style("top", (d3.event.pageY - 65) + "px")
            .style("width", "150px")
            .style("height", "50px");
    }

    function neighborhoodMouseout(data, index) {
        d3.select(this)
            .attr('fill', '#1F7A8C'); 
            
        tooltip.style("opacity", 0.0);
    }
});