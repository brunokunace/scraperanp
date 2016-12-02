var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var _und = require("underscore");

var json = [];
var state = [];
var city = [];
var fuel = [];




app.get('/', function (req, res) {



    var cookies = [];
    url = 'http://www.anp.gov.br/preco/prc/resumo_por_estado_index.asp';
    request(url, function (error, response, html) {


        if (!error) {
            var $ = cheerio.load(html);
            $('select[name=selEstado]').filter(function () {
                var data = $(this);
                data.children().each(function () {
                    state.push($(this).val());
                });
            })

            $('select[name=selCombustivel]').filter(function () {
                var data = $(this);
                data.children().each(function () {
                    fuel.push($(this).val());
                });
            })


            console.log('Loading prices...');
            var pattern = new RegExp(/\d+\*(\w\@|\w)+/);
            var i = 0;



            state.forEach(function (currentState, indexe) {
                fuel.forEach(function (currentFuel, indexf) {
                    var options = {
                        method: 'POST',
                        url: 'http://www.anp.gov.br/preco/prc/Resumo_Por_Estado_Municipio.asp',
                        headers: {
                            'postman-token': 'fc833b5b-dfe2-1530-3283-0e609bc4ae16',
                            'cache-control': 'no-cache',
                            'content-type': 'application/x-www-form-urlencoded'
                        },
                        form: {
                            selSemana: '911*De 27/11/2016 a 03/12/2016',
                            selEstado: currentState,
                            selCombustivel: currentFuel
                        }
                    };

                    request(options, function (error, response, body) {
                        if (error)
                            throw new Error(error);
                        var $ = cheerio.load(body);
                        $('.lincol').filter(function () {
                            var data = $(this);
                            data.parent().prev().nextAll().each(function () {

                                var city_name = $(this).children().first().children().first().text();
                                var tdElem = $(this).children().first().next().next();
                                var cod_city = $(this).children().first().children().first().attr("href");

                                cod_city = pattern.exec(cod_city)[0];
                                var estate_name = currentState.substr(currentState.indexOf("*") + 1);
                                var fuel_type = currentFuel.substr(currentFuel.indexOf("*") + 1);
                                estate_name = estate_name.replace('@', ' ');
                                fuel_type = fuel_type.replace('@', ' ');
                                
                                var dados = {
                                    state: estate_name,
                                    city: city_name,
                                    fuel: fuel_type,
                                    client_price:
                                            {
                                                client_average_price: 0.0,
                                                client_deviation: 0.0,
                                                client_minimum_price: 0.0,
                                                client_maximum_price: 0.0,
                                                client_average_margin: 0.0
                                            }
                                    ,
                                    distributor_price:
                                            {
                                                distributor_average_price: 0.0,
                                                distributor_deviation: 0.0,
                                                distributor_minimum_price: 0.0,
                                                distributor_maximum_price: 0.0
                                            }
                                };

                                dados.client_price.client_average_price = parseFloat(tdElem.text().replace(',', '.'));
                                tdElem = tdElem.next();
                                dados.client_price.client_deviation = parseFloat(tdElem.text().replace(',', '.'));
                                tdElem = tdElem.next();
                                dados.client_price.client_minimum_price = parseFloat(tdElem.text().replace(',', '.'));
                                tdElem = tdElem.next();
                                dados.client_price.client_maximum_price = parseFloat(tdElem.text().replace(',', '.'));
                                tdElem = tdElem.next();
                                dados.client_price.client_average_margin = parseFloat(tdElem.text().replace(',', '.'));
                                tdElem = tdElem.next();
                                dados.distributor_price.distributor_average_price = parseFloat(tdElem.text().replace(',', '.'));
                                tdElem = tdElem.next();
                                dados.distributor_price.distributor_deviation = parseFloat(tdElem.text().replace(',', '.'));
                                tdElem = tdElem.next();
                                dados.distributor_price.distributor_minimum_price = parseFloat(tdElem.text().replace(',', '.'));
                                tdElem = tdElem.next();
                                dados.distributor_price.distributor_maximum_price = parseFloat(tdElem.text().replace(',', '.'));
                                json.push(dados);
                            })
                        });
                    });
                });

            });
        }

    });

    Promise.all(json).then(function (json) {
        json = _und.groupBy(json, 'state');
        fs.writeFile('price.json', JSON.stringify(json, null, 4), function (err) {
            if (err)
                console.log('Error on updating');
            else {

                console.log('Writen/Updated json data.');

            }
        });

    });
});



app.listen('8081');
console.log('Please, open your browser on http://localhost:8081 ');
exports = module.exports = app;