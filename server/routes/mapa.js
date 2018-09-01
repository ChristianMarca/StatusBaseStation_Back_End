const express = require('express');
// const knex = require('knex');
// var router = express.Router(); // setup usage of the Express router engine
const {Client, Query } = require('pg');
const pg =require('pg');
var cors = require('cors')

// const bcrypt = require('bcrypt');
// const _ = require('underscore');

// const Usuario = require('../models/usuario');
const { verificaToken, verificaAdmin_Role } = require('../middlewares/autenticacion');

const app = express();
app.use(cors())

var username = "postgres" // sandbox username
var password = "qsqqpEjOTN0C" // read only privileges on our table
var host = "localhost:5432"
var database = "coffee_shops" // database name
var conString = "postgres://"+username+":"+password+"@"+host+"/"+database; // Your Database Connection
var coffee_query = "SELECT row_to_json(fc) FROM (SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry,row_to_json((id, name,address)) As properties FROM coffe_shops As lg) As f) As fc";


var db = require('knex')({
  client: 'pg',
  connection: {
    // host : 'localhost:5432',
    host: '127.0.0.1',
    user : 'postgres',
    password : 'qsqqpEjOTN0C',
    database : 'coffee_shops'
  }
});


app.get('/data_radiobase', (req, res) => {
    var databaseRB = "plataforma_sma" // database name
    var conStringRB = "postgres://"+username+":"+password+"@"+host+"/"+databaseRB; // Your Database Connection
    console.log(conStringRB)
    var coffee_queryRB = "SELECT row_to_json(fc) FROM (SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry,row_to_json((id,no,cod_est,est,provincia,canton,parroquia,direccion,lat,lon,cell_id,tecnologia,clasificacion_d,cod_estr_d,operadora,status)) As properties FROM radiobases As lg) As f) As fc";


    // console.log(req.query);
    var client = new Client(conStringRB);
    client.connect();

    var query = client.query(new Query(coffee_queryRB));
    query.on("row", function (row, result) {
        result.addRow(row);
    });
    // Pass the result to the map page
    query.on("end", function (result) {
      var data = result.rows[0].row_to_json // Save the JSON as variable data
      res.json({
          title: "Express API", // Give a title to our page
          jsonData: data // Pass data to the View
      });
  });
    // res.json(conStringRB)
})

app.post('/filter_radiobase', function (req, res) {
    var name = req.body;
    var databaseRB = "plataforma_sma" // database name
    var conStringRB = "postgres://"+username+":"+password+"@"+host+"/"+databaseRB; // Your Database Connection

    function contains(target, pattern){
        return pattern.map(function(word){
            value = target.includes(word);
           return value
        });
    }

    if (!contains(name.provincia,['LTE','GSM','UMTS']).includes(true)){
        name.provincia.push('LTE','GSM','UMTS')
    }
    if(!contains(name.provincia,['CNT','CONECEL','OTECEL']).includes(true)){
        name.provincia.push('CNT','CONECEL','OTECEL')
    }

    

    // if (name.indexOf("--") > -1 || name.indexOf("'") > -1 || name.indexOf(";") > -1 || name.indexOf("/*") > -1 || name.indexOf("xp_") > -1){
    //     console.log("Bad request detected");
    //     res.redirect('/data');
    //     return;
    // } else {

        console.log("Request passed")
        var filter_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json((id,no,cod_est,est,provincia,canton,parroquia,direccion,lat,lon,cell_id,tecnologia,clasificacion_d,cod_estr_d,operadora,status) ) As properties FROM radiobases As lg WHERE lg.operadora= ANY($1) AND lg.tecnologia= ANY($1) )As f) As fc";

        // console.log(filter_query)

        var client = new pg.Client(conStringRB);
        client.connect();
        var query = client.query(new Query(filter_query,[name.provincia]));
        query.on("row", function (row, result) {
            result.addRow(row);
        });
        query.on("end", function (result) {
            var data = result.rows[0].row_to_json
            res.json({
                title: "Express API",
                jsonData: data
            });
        });
    // };
});
  


// app.get('/data', verificaToken, (req, res) => {
app.get('/data', (req, res) => {

  console.log(req.query);
  var client = new Client(conString);
  client.connect();
  var query = client.query(new Query(coffee_query));
  query.on("row", function (row, result) {
      result.addRow(row);
  });
  // Pass the result to the map page
  query.on("end", function (result) {
    var data = result.rows[0].row_to_json // Save the JSON as variable data
    res.json({
        title: "Express API", // Give a title to our page
        jsonData: data // Pass data to the View
    });
});

  // db.select('row_to_json(fc)').from('coffe_shops').then(data=>{
  //   console.log(data)
  // })


});
/* GET the filtered page */
app.get('/filter', function (req, res) {
    var name = req.query.name;
    console.log('LLamado')
    console.log(name)
    if (name.indexOf("--") > -1 || name.indexOf("'") > -1 || name.indexOf(";") > -1 || name.indexOf("/*") > -1 || name.indexOf("xp_") > -1){
        console.log("Bad request detected");
        res.redirect('/data');
        return;
    } else {
        console.log("Request passed")
        var filter_query = "SELECT row_to_json(fc) FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json((id, name,address)) As properties FROM coffe_shops As lg WHERE lg.name = \'" + name + "\') As f) As fc";
        var client = new pg.Client(conString);
        client.connect();
        var query = client.query(new Query(filter_query));
        query.on("row", function (row, result) {
            result.addRow(row);
        });
        query.on("end", function (result) {
            var data = result.rows[0].row_to_json
            res.json({
                title: "Express API",
                jsonData: data
            });
        });
    };
});

app.post('/usuario', [verificaToken, verificaAdmin_Role], function(req, res) {

    let body = req.body;

    let usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        role: body.role
    });


    usuario.save((err, usuarioDB) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            usuario: usuarioDB
        });


    });


});

app.put('/usuario/:id', [verificaToken, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['nombre', 'email', 'img', 'role', 'estado']);

    Usuario.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, usuarioDB) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }



        res.json({
            ok: true,
            usuario: usuarioDB
        });

    })

});

app.delete('/usuario/:id', [verificaToken, verificaAdmin_Role], function(req, res) {


    let id = req.params.id;

    // Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {

    let cambiaEstado = {
        estado: false
    };

    Usuario.findByIdAndUpdate(id, cambiaEstado, { new: true }, (err, usuarioBorrado) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        };

        if (!usuarioBorrado) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no encontrado'
                }
            });
        }

        res.json({
            ok: true,
            usuario: usuarioBorrado
        });

    });



});



module.exports = app;