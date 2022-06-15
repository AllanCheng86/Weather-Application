require('dotenv').config();
const express = require("express");
const https = require("https");
const ejs = require("ejs");


const app = express();


app.use(express.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

// Users gets send to the main index.html

app.get("/", function (req, res) {

    res.sendFile(__dirname + "/index.html");

})

// user gets redirected to failure.html when user enters an invalid city name
app.get("/failure.html" , function(req,res){
    res.sendFile(__dirname + "/failure.html");
})

// This post route catches the post request sent when user enters a valid city name
app.post("/", function (req, res) {


    const query = req.body.cityName;
    // replace with your own API key
    const apiKey = process.env.API_KEY;
    const exclude = "minutely,hourly,alerts";
    const unit = "metric";

    // URL for getting Geocordinates from City Name
    const geoURL = "https://api.openweathermap.org/geo/1.0/direct?q=" + query + "&limit=1&appid=" + apiKey;

    // coordinate is equal to the object returned by the getCoordinate function.
    let coordinate = getCoordinate(geoURL);
    // if resolved, assign the variables lat and lon to the lat and lon fields of the coordinate object
    coordinate.then(function (coordinates) {
        let lat = coordinates.lat;
        let lon = coordinates.lon;

        // URL for getting weatherData
        const weatherDataURL = "https://api.openweathermap.org/data/3.0/onecall?lat=" + lat + "&lon=" + lon + "&units=" + unit + "&exclude=" + exclude + "&appid=" + apiKey;

        //  Makes a HTTPS get request to the specified URL 
        https.get(weatherDataURL, (response) => {
            response.on("data", (data) => {
                const weatherData = JSON.parse(data)

                // Converts Unix Time to a more readable format for humans
                const unixTime = weatherData.current.dt;
                let date = new Date(unixTime * 1000)
                let dateTime = date.toDateString() + " - " + date.toLocaleTimeString([], {
                    timeStyle: 'short'
                });

                // gets all the weather information and assigns it to the corresponding variables.
                const currentTemp = Math.floor(weatherData.current.temp);
                const weatherDescription = weatherData.current.weather[0].description;
                const iconCode = weatherData.current.weather[0].icon;
                const iconUrl = "http://openweathermap.org/img/wn/" + iconCode + "@2x.png";
                const wind = Math.round(((weatherData.current.wind_speed) * 3.6));
                const humidity = weatherData.current.humidity;

                // Create a Forecast Array to store objects with 3 fields date , minTemp and maxTemp
                const forecast = [];

                for (let i = 1; i < 6; i++) {
                    forecast[i] = {
                        date: new Date((weatherData.daily[i].dt) * 1000).toLocaleDateString().slice(0,4),
                        minTemp: Math.floor(weatherData.daily[i].temp.min),
                        maxTemp: Math.floor(weatherData.daily[i].temp.max)
                    }
                }

                //  Renders the result.ejs page with the gathered weather data
                res.render("result.ejs", {
                    query: query,
                    currentTemp: currentTemp,
                    weatherDescription: weatherDescription,
                    dateTime: dateTime,
                    iconUrl: iconUrl,
                    wind: wind,
                    humidity: humidity,

                    day1: forecast[1].date,
                    maxTemp1: forecast[1].maxTemp,
                    minTemp1: forecast[1].minTemp,

                    day2: forecast[2].date,
                    maxTemp2: forecast[2].maxTemp,
                    minTemp2: forecast[2].minTemp,

                    day3: forecast[3].date,
                    maxTemp3: forecast[3].maxTemp,
                    minTemp3: forecast[3].minTemp,

                    day4: forecast[4].date,
                    maxTemp4: forecast[4].maxTemp,
                    minTemp4: forecast[4].minTemp,

                    day5: forecast[5].date,
                    maxTemp5: forecast[5].maxTemp,
                    minTemp5: forecast[5].minTemp
                });
            });
        });
    // If user enters an invalid city name, promise is rejected and user gets redirected to a failure page where they can retry and enter a valid city name
    }).catch(function (errMessage) {
        console.log(errMessage);
        res.redirect("/failure.html");
    });


});

// allow server to listen on port 3000
app.listen(process.env.PORT || 3000, function () {
    console.log("Server is running on part 3000.");
});


// Function that gets the geographical coordinates given a URL
function getCoordinate(url) {

    return new Promise(function (resolve, reject) {
        https.get(url, function (response) {
            if (response.statusCode != 200) {
            // Rejects the promise if the status code is not 200
                reject("Invalid Status Code " + response.statusCode)
            } else {
                response.on("data", function (data) {
                    const geoData = JSON.parse(data);
                // Rejects the promise if the geoData is empty indicating an invalid city name is entered.
                    if (geoData.length == 0){
                       reject("Please enter a valid City");
                    } else {
                        let lat = geoData[0].lat;
                        let lon = geoData[0].lon;
                    // Resolve the promise and return an object with 2 fields, lat and lon.
                        resolve({
                            lat: lat,
                            lon: lon
                        });
                    }
        
                });
            }
        });

    })

}