var formidable = require('formidable');
const http=require('http');
const express=require('express');
const WebSocket_ = require('ws');
const { spawn } = require("child_process")
const path_=require("path")

const app = express();

const server = http.createServer(app);

Globals.engines.fromJsonText(Globals.configasset.get())

app.get('/', Server.indexhtml)
app.get('/enginesetup', Server.indexhtml)
app.get('/wasmboard.js',function(req,res){
  res.setHeader("Content-Type", "application/javascript")
  res.sendFile(__dirname + '/wasmboard.js')
})
app.get('/startup.json',function(req,res){
  res.setHeader("Content-Type", "application/json")
  res.sendFile(__dirname + '/startup.json')
})
app.post('/editengine',function(req,res){
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    let i=Globals.engines.getIndexByName(fields.name)
    if(i>=0){
      Globals.engines.engines[i].path=fields.path
      Globals.engines.engines[i].config=fields.config
    }
    Server.indexhtml(req,res)
  })
})
app.post('/dodeleteengine',function(req,res){
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {    
    Globals.engines.deleteByName(fields.name)
    Server.indexhtml(req,res)
  })
})
app.post('/doeditengine',function(req,res){  
    Server.indexhtml(req,res)
})

app.use('/assets', express.static(path_.join(__dirname, 'assets')))

const wss = new WebSocket_.Server({ server });

let current_ws
let proc=null

function issueCommand(command:string){
  command+="\n"
  command=command.replace(new RegExp("\\n+","g"),"\n")
  try{
    proc.stdin.write(command)
  }catch(err){
    console.log(`could not write command to process stdin`)
  }
}

wss.on('connection', function connection(ws) {
  current_ws=ws
  ws.on('message', function incoming(message) {
    let mjson=JSON.parse(message)
    console.log('received:', mjson);
    if(mjson.action=="sendavailable") ws.send(`{"action":"available","available":[${Globals.engines.engines.map(engine=>`"${engine.name}"`).join(",")}]}`);
    if(mjson.action=="start"){
      let name=mjson.name
      let i=Globals.engines.getIndexByName(name)
      if(i>=0){
        let e=Globals.engines.engines[i]        
        if(proc!=null) try{
          proc.kill()
        }catch(err){
          console.log(`could not kill process: ${proc}`)
        }        
        try{
          proc=spawn(e.path)                
        }catch(err){
          console.log(`could not start process: ${name} @ ${e.path}`)
        }
        if(e.config!=""){
          issueCommand(e.config)
        }
        proc.stdout.on('data', (data) => {        
          let str=data.toString().replace(new RegExp("[\r]","g"),"")
          let lines=str.split("\n")
          lines.map(line=>{
            if(line!="")
              current_ws.send(`{"action":"thinkingoutput","buffer":"${line}"}`);
          })          
        })
      }
    }
    if(mjson.action=="issue"){           
      let command=mjson.command.toString()
      issueCommand(command)      
    }
  });
});

server.listen(9000, () => {
  console.log(`Node engine server started on port ${server.address().port}`);
});
