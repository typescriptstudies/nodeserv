class Engine {
    name:string=""
    path:string=""
    config:string=""
    fromJson(json):Engine{
        this.name=json.name
        this.path=json.path
        this.config=json.config
        return this
    }    
}

class Engines {
    engines:Engine[]=[]
    fromJsonText(jsontext):Engines{
        return this.fromJson(JSON.parse(jsontext))
    }
    fromJson(json):Engines{
        this.engines=[]
        json.engines.map(engine=>{
            let e=new Engine().fromJson(engine)
            this.engines.push(e)
        })
        return this
    }
    getIndexByName(name:string):number{
        if(name=="") return -1
        for(let i=0;i<this.engines.length;i++){
            if(this.engines[i].name==name) return i
        }
        let ne=new Engine()
        ne.name=name
        this.engines.push(ne)
        return this.engines.length-1
    }
    deleteByName(name:string){
        let i=this.getIndexByName(name)
        if(i>=0){            
            let newengines:Engine[]=[]
            for(let j=0;j<this.engines.length;j++){
                if(i!=j) newengines.push(this.engines[j])
            }
            this.engines=newengines
        }        
    }
}

namespace Misc {

    const fs=require("fs")

    export class textFileAssetWithDefault{
        path:string
        default:string
        constructor(_path:string,_default:string){
            this.path=_path
            this.default=_default
        }
        get():string{
            try{fs.openSync(this.path,'r')}catch(err){
                try{fs.writeFileSync(this.path,this.default,'utf8')}
                catch(err){console.log("could not write "+this.path)}
                return this.default
            }                
            return fs.readFileSync(this.path,'utf8')
        }
        storeText(text:string){
            try{fs.writeFileSync(this.path,text,'utf8')}
            catch(err){console.log("could not write "+this.path)}
        }
        storeJson(json){
            this.storeText(JSON.stringify(json,null,1))
        }
    }

}

namespace Server {

    function setuphtml(e:Engine):string{            
        Globals.configasset.storeJson(Globals.engines)    
        let enginescontent=Globals.engines.engines.map(engine=>{
            return `<tr>
            <td class="enginetd">${engine.name}</td>
            <td class="enginetd">${engine.path}</td>
            <td class="enginetd"><pre>${engine.config}</pre></td>
            <td class="enginetd">
                <form method="POST" action="/doeditengine">
                <input type="hidden" name="name" value="${engine.name}">
                <input type="submit" value="Edit">
                </form>
            </td>
            <td class="enginetd">
            <form method="POST" action="/dodeleteengine">
            <input type="hidden" name="name" value="${engine.name}">
            <input type="submit" value="Delete">
            </form>
        </td>
            </tr>`
        }).join("\n")
        let content=`
        <form method="POST" action="/editengine">
        <table>
        <tr>
        <td class="enginetd">Name</td>
        <td class="enginetd">Path</td>
        </tr>
        <tr>
        <td class="enginetd"><input type="text" name="name" style="width:150px;font-family:monospace;" value="${e.name}"></td>
        <td class="enginetd"><input type="text" name="path" style="width:450px;font-family:monospace;" value="${e.path}"></td>        
        </tr>
        <tr>
        <td class="enginetd" colspan="2">Config</td>        
        </tr>
        <tr>        
        <td class="enginetd" colspan="2" align="middle"><textarea style="width:600px;height:100px;" name="config">${e.config}</textarea></td>                
        </tr>
        </table>
        <input type="submit" style="margin-top:8px;" value="Submit">
        </form>
        <hr>
        <table>
        <tr>
        <td class="enginetd">Name</td>
        <td class="enginetd">Path</td>
        <td class="enginetd">Config</td>
        <td class="enginetd">Edit</td>
        <td class="enginetd">Delete</td>
        </tr>
        ${enginescontent}
        </table>
        `        
        return content
    }

    function indexsend(req,res,e:Engine){
        res.send(`
        <html>
        
          <head>
          
            <link rel="stylesheet" href="assets/stylesheets/reset.css">

            <style>
                .enginetd {
                    padding:5px;
                    background-color:#efefef;
                }
                hr {
                    padding:1px;
                    margin:15px;
                }
            </style>
            
          </head>
        
          <body>

            <div style="font-family:monospace;font-size:10px;padding-top:3px;padding-left:10px;">
            <a href="/">Chess</a> | <a href="/enginesetup">Engine setup</a>
            </div>

            ${req.path=="/"?
                `<script src="wasmboard.js"></script>`
                :
                `<div style="padding:10px;margin:5px;background-color:#efefef;font-family:monospace;">
                ${setuphtml(e)}</div>`
            }

            <script src="assets/javascripts/analytics.js"></script>
        
          </body>
        
        </html>
        `);
    }

    export function indexhtml(req, res) {
        console.log(req.path)
        let e=new Engine()
        if(req.path=="/doeditengine"){
            var form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {
                let i=Globals.engines.getIndexByName(fields.name)
                if(i>=0){
                  e=Globals.engines.engines[i]
                  indexsend(req,res,e)
                }
            })
        } else {
            indexsend(req,res,e)
        }   
    }

}

namespace Globals {
    export let engines:Engines=new Engines()
    export let configasset=new Misc.textFileAssetWithDefault(__dirname+"/config.json",`{"engines":[]}`)
}