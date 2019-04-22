const express = require('express');
const app = express();
const http = require('http');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');

// 使用解析json中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  //Access-Control-Allow-Headers ,可根据浏览器的F12查看,把对应的粘贴在这里就行
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

const port = 3000;

app.use(express.static('public'));

app.get('/', function(req, res) {
  res.sendFile('index.html', { root: 'public' });
})

app.get('/list', function(req, res) {
  const moveList = fs.readFileSync('./move.json', { encoding: 'utf-8' });
  console.log('获取电影列表');
  res.send(JSON.parse(moveList));
});

app.post('/post', function(req, res) {
  // const moveList = fs.readFileSync('./move.json', { encoding: 'utf-8' });
  // res.send(JSON.parse(moveList));
  res.send(JSON.stringify({data: req.body}))
});

app.get('/post', function(req, res) {
  // const moveList = fs.readFileSync('./move.json', { encoding: 'utf-8' });
  // res.send(JSON.parse(moveList));
  res.send('GET_POST')
});
// 启动服务器
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});