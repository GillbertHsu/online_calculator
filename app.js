const express = require("express")
const bodyParser = require("body-parser")
const app = express()

var redis = require("redis");
var cacheHostName = process.env.REDISCACHEHOSTNAME

var cachePassword = process.env.REDISCACHEKEY

// Add your cache name and access key.
var redisClient = redis.createClient({
    url: "rediss://" + cacheHostName + ":6380",
    password: cachePassword,
});

let redis_empty = true
let redis_change = true

// docker build --tag gilbert_calculator_docker .
// docker run -p 5000:5000 -d gilbert_calculator_docker
// docker tag gilbert_calculator_docker:latest gilbertdocker.azurecr.io/gilbert_calculator_docker
// docker push gilbertdocker.azurecr.io/gilbert_calculator_docker

app.use(bodyParser.urlencoded({ extended: true }))

app.get('',(req,res)=>res.sendFile(__dirname+"/index.html"))

app.post('/', async (req,res)=>{
    var num1 = Number(req.body.num1)
    var num2 = Number(req.body.num2)
    var result
    let check = true
    switch(req.body.operator){
        case '+':
            result = num1 + num2
            break
        case '-':
            result = num1 - num2
            break
        case '*':
            result = num1 * num2
            break
        case '/':
            result = num1 / num2
            break
        default:
            check = false
    }
    if(check) {
        res.send('<h1>'+num1+' '+req.body.operator+' '+num2+' = '+result+'</h1>')
        const { Client } = require('pg')
        const client = new Client({
            user: process.env.postgresUser,
            host: process.env.postgresHost,
            database: process.env.postgresDatabase,
            password: process.env.postgresPassword,
            port: 5432,
            ssl: {rejectUnauthorized: false}
        })
        client.connect()
        .then(()=> client.query('INSERT INTO cal_record (operand1, operator, operand2, result) VALUES ($1, $2, $3, $4)', [num1, req.body.operator , num2, result]))
        .then(()=> client.end())
        redis_change = true
    }
    if(req.body.operator == "log"){
        let cal_record1;
        let cal_record2;
        let cal_record3;
        let cal_record4;
        let cal_record5;
        if (redis_change) {
            if (redis_empty) {
                await redisClient.connect()
            }
            const { Client } = require('pg')
            const client = new Client({
                user: process.env.postgresUser,
                host: process.env.postgresHost,
                database: process.env.postgresDatabase,
                password: process.env.postgresPassword,
                port: 5432,
                ssl: {rejectUnauthorized: false}
            })
            client.connect()
            .then(()=> client.query('SELECT * FROM cal_record'))
            .then(result => {
                let numRows = result.rowCount
                cal_record1 = result.rows.at(numRows - 1).operand1.toString() + ' ' + result.rows.at(numRows - 1).operator.toString() + ' ' + result.rows.at(numRows - 1).operand2.toString() + ' = ' + result.rows.at(numRows - 1).result.toString()
                cal_record2 = result.rows.at(numRows - 2).operand1.toString() + ' ' + result.rows.at(numRows - 2).operator.toString() + ' ' + result.rows.at(numRows - 2).operand2.toString() + ' = ' + result.rows.at(numRows - 2).result.toString()
                cal_record3 = result.rows.at(numRows - 3).operand1.toString() + ' ' + result.rows.at(numRows - 3).operator.toString() + ' ' + result.rows.at(numRows - 3).operand2.toString() + ' = ' + result.rows.at(numRows - 3).result.toString()
                cal_record4 = result.rows.at(numRows - 4).operand1.toString() + ' ' + result.rows.at(numRows - 4).operator.toString() + ' ' + result.rows.at(numRows - 4).operand2.toString() + ' = ' + result.rows.at(numRows - 4).result.toString()
                cal_record5 = result.rows.at(numRows - 5).operand1.toString() + ' ' + result.rows.at(numRows - 5).operator.toString() + ' ' + result.rows.at(numRows - 5).operand2.toString() + ' = ' + result.rows.at(numRows - 5).result.toString()
                res.send('<h1>' + cal_record1 + '</h1>'
                + '<h1>' + cal_record2 + '</h1>'
                + '<h1>' + cal_record3 + '</h1>'
                + '<h1>' + cal_record4 + '</h1>'
                + '<h1>' + cal_record5 + '</h1>')
            })
            .then(async ()=> await redisClient.set('cal_record', cal_record1))
            .then(async ()=> await redisClient.set('cal_record', cal_record2))
            .then(async ()=> await redisClient.set('cal_record', cal_record3))
            .then(async ()=> await redisClient.set('cal_record', cal_record4))
            .then(async ()=> await redisClient.set('cal_record', cal_record5))
            .then(()=> redis_empty = false)
            .then(() => client.end())
        } else {
            value1 = await redisClient.get('cal_record1')
            value2 = await redisClient.get('cal_record2')
            value3 = await redisClient.get('cal_record3')
            value4 = await redisClient.get('cal_record4')
            value5 = await redisClient.get('cal_record5')
            res.send('<h1>' + value1 + '</h1>' + '<h1>' + value2 + '</h1>' + '<h1>' + value3 + '</h1>' + '<h1>' + value4 + '</h1>' + '<h1>' + value5 + '</h1>')
        }
        
    }
})

app.listen(5000,()=>console.log('Server started'))



