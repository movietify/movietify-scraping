var cheerio = require('cheerio');
var express = require('express');
var fetch = require('node-fetch');
const mongoose = require('mongoose')

mongoose.connect('mongodb://handeebrar:qwerty_2019@cluster0-cy293.gcp.mongodb.net/test?retryWrites=true', { useMongoClient: true });

const Schema = new mongoose.Schema({
    cover: String,
    video: String,
    title: String,
    imdb: String,
    minute: String,
    year: String,
    genre: String,
    summary: String,
    director: String,
    scriptwriter: String,
    country: String
});

const Movies = mongoose.model('Movies', Schema);

var app = express();
var movieNameList = [];
var moviesList = [];

var cover,
    video,
    title,
    imdb,
    minute,
    year,
    genre,
    summary,
    director,
    scriptwriter,
    country;

let baseUrl = "https://www.turkcealtyazi.org";
let url     = 'https://www.turkcealtyazi.org/olmeden-once-gormeniz-gereken-1001-film-2.html';
let movie   = "";

var searchMovies = (url) => {
    
    return fetch(`${url}`)
    .then(response => response.text());
}

searchMovies(url)
    .then(body => {

        var $ = cheerio.load(body);
        
        $('tbody').children().each((index, element) => {
            
            var $element = $(element);

           if(index != 0) {
                var movieLink = $element.children("td").eq(2).children("a").attr("href")
                movieNameList.push(movieLink);
           }
        });

        console.log(movieNameList);
        
        console.log("**************************************");

        getMovieDetail();
});

var getMovieDetail = () => {

    movieNameList.forEach((url, index) => {

        movieDetailFunction((baseUrl + url), (index+1)).then((movieDetail) => {
            
            console.log("Tüm film detayları: " + movieDetail);

        }).catch((error) => {
            console.log("Request error: ", error);
        });
    });
}

var movieDetailFunction = (detailUrl, index) => {
    
    var promise = new Promise((resolve, reject) => {
        searchMovies(detailUrl)
            .then(body => {

                var $ = cheerio.load(body);

                cover       = $('#filmframe').children(".nm-left").find('.nm-poster').find('a').attr('href');
                title       = $('.nm-head').children("h1").children("span").text();
                imdb        = $('#filmframe').children(".nm-center").children().eq(5).find('.nm-info-r').find('.nrright').find('span').text().slice(0,3);
                minute      = $('.nm-head').find('.nm-duration').text();
                year        = $('.nm-head').children('h1').children('.year').find('a').text();
                genre       = $('#filmframe').children(".nm-center").children().eq(4).text().replace("Tür:","").trim();
                summary     = $('.nm-block').children('.ozet-goster').text();
                director    = $('#filmframe').children(".nm-center").children().eq(1).find('.nm-info-r').text().trim();
                scriptwriter= $('#filmframe').children(".nm-center").children().eq(2).find('.nm-info-r').text().trim();
                country     = $('#filmframe').children(".nm-center").children().eq(3).find('.nm-info-r').find('a').text().trim();
                
                //console.log("URL: " + video);
                
        }).then(() => {
            
            trailerUrlFunction(detailUrl).then((video) => {
                movie = {
                    cover           : baseUrl + cover,
                    video           : video,
                    title           : title,
                    imdb            : imdb,
                    minute          : minute,
                    year            : year,
                    genre           : genre,
                    director        : director,
                    scriptwriter    : scriptwriter,
                    country         : country,
                    summary         : summary
                }

                console.log("video: " + video);
                moviesList.push(movie);

                const movie_save = new Movies(moviesList);

                movie_save.save((err, doc) => { // Yeni oluşturduğumuz satırı işleyelim.
                    if (err) {
                      console.error(err)
                    } else {
                      console.log("Completed!" + doc)
                      moviesList = [];
                    }
                });
            }).catch((error) => {
                console.log("Trailer request error: ", error);
            });
        });

        if(index == movieNameList.length) {
            resolve(moviesList);
        }
    });

    return promise;
}

var trailerUrlFunction = (trailerUrl) => {

    var promise = new Promise((resolve, reject) => {

        trailerUrl = trailerUrl.replace("mov", "fragman");

        searchMovies(trailerUrl)
            .then(body => {

                var $ = cheerio.load(body);

                video = $('#filmframe').children().children().find('iframe').attr('src');  
                resolve(video);
        });        
    });

    return promise;
}

app.get("/movies", (req, res) => {

    res.header("Content-Type",'application/json');
    res.send(JSON.stringify(moviesList, null, 4)+ "INDEX: " + moviesList.length);
    
});

app.listen(3000, () => {
    console.log("Listening: 3000");
});