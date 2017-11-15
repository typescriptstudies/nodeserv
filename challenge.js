#! /usr/bin/env node
var Engine = /** @class */ (function () {
    function Engine() {
        this.name = "";
        this.path = "";
        this.config = "";
    }
    Engine.prototype.fromJson = function (json) {
        this.name = json.name;
        this.path = json.path;
        this.config = json.config;
        return this;
    };
    return Engine;
}());
var Engines = /** @class */ (function () {
    function Engines() {
        this.engines = [];
    }
    Engines.prototype.fromJsonText = function (jsontext) {
        return this.fromJson(JSON.parse(jsontext));
    };
    Engines.prototype.fromJson = function (json) {
        var _this = this;
        this.engines = [];
        json.engines.map(function (engine) {
            var e = new Engine().fromJson(engine);
            _this.engines.push(e);
        });
        return this;
    };
    Engines.prototype.getIndexByName = function (name) {
        if (name == "")
            return -1;
        for (var i = 0; i < this.engines.length; i++) {
            if (this.engines[i].name == name)
                return i;
        }
        var ne = new Engine();
        ne.name = name;
        this.engines.push(ne);
        return this.engines.length - 1;
    };
    Engines.prototype.deleteByName = function (name) {
        var i = this.getIndexByName(name);
        if (i >= 0) {
            var newengines = [];
            for (var j = 0; j < this.engines.length; j++) {
                if (i != j)
                    newengines.push(this.engines[j]);
            }
            this.engines = newengines;
        }
    };
    return Engines;
}());
var Misc;
(function (Misc) {
    var fs = require("fs");
    var textFileAssetWithDefault = /** @class */ (function () {
        function textFileAssetWithDefault(_path, _default) {
            this.path = _path;
            this.default = _default;
        }
        textFileAssetWithDefault.prototype.get = function () {
            try {
                fs.openSync(this.path, 'r');
            }
            catch (err) {
                try {
                    fs.writeFileSync(this.path, this.default, 'utf8');
                }
                catch (err) {
                    console.log("could not write " + this.path);
                }
                return this.default;
            }
            return fs.readFileSync(this.path, 'utf8');
        };
        textFileAssetWithDefault.prototype.storeText = function (text) {
            try {
                fs.writeFileSync(this.path, text, 'utf8');
            }
            catch (err) {
                console.log("could not write " + this.path);
            }
        };
        textFileAssetWithDefault.prototype.storeJson = function (json) {
            this.storeText(JSON.stringify(json, null, 1));
        };
        return textFileAssetWithDefault;
    }());
    Misc.textFileAssetWithDefault = textFileAssetWithDefault;
})(Misc || (Misc = {}));
var Server;
(function (Server) {
    function setuphtml(e) {
        Globals.configasset.storeJson(Globals.engines);
        var enginescontent = Globals.engines.engines.map(function (engine) {
            return "<tr>\n            <td class=\"enginetd\">" + engine.name + "</td>\n            <td class=\"enginetd\">" + engine.path + "</td>\n            <td class=\"enginetd\"><pre>" + engine.config + "</pre></td>\n            <td class=\"enginetd\">\n                <form method=\"POST\" action=\"/doeditengine\">\n                <input type=\"hidden\" name=\"name\" value=\"" + engine.name + "\">\n                <input type=\"submit\" value=\"Edit\">\n                </form>\n            </td>\n            <td class=\"enginetd\">\n            <form method=\"POST\" action=\"/dodeleteengine\">\n            <input type=\"hidden\" name=\"name\" value=\"" + engine.name + "\">\n            <input type=\"submit\" value=\"Delete\">\n            </form>\n        </td>\n            </tr>";
        }).join("\n");
        var content = "\n        <form method=\"POST\" action=\"/editengine\">\n        <table>\n        <tr>\n        <td class=\"enginetd\">Name</td>\n        <td class=\"enginetd\">Path</td>\n        </tr>\n        <tr>\n        <td class=\"enginetd\"><input type=\"text\" name=\"name\" style=\"width:150px;font-family:monospace;\" value=\"" + e.name + "\"></td>\n        <td class=\"enginetd\"><input type=\"text\" name=\"path\" style=\"width:450px;font-family:monospace;\" value=\"" + e.path + "\"></td>        \n        </tr>\n        <tr>\n        <td class=\"enginetd\" colspan=\"2\">Config</td>        \n        </tr>\n        <tr>        \n        <td class=\"enginetd\" colspan=\"2\" align=\"middle\"><textarea style=\"width:600px;height:100px;\" name=\"config\">" + e.config + "</textarea></td>                \n        </tr>\n        </table>\n        <input type=\"submit\" style=\"margin-top:8px;\" value=\"Submit\">\n        </form>\n        <hr>\n        <table>\n        <tr>\n        <td class=\"enginetd\">Name</td>\n        <td class=\"enginetd\">Path</td>\n        <td class=\"enginetd\">Config</td>\n        <td class=\"enginetd\">Edit</td>\n        <td class=\"enginetd\">Delete</td>\n        </tr>\n        " + enginescontent + "\n        </table>\n        ";
        return content;
    }
    function indexsend(req, res, e) {
        res.send("\n        <html>\n        \n          <head>\n          \n            <link rel=\"stylesheet\" href=\"assets/stylesheets/reset.css\">\n\n            <style>\n                .enginetd {\n                    padding:5px;\n                    background-color:#efefef;\n                }\n                hr {\n                    padding:1px;\n                    margin:15px;\n                }\n            </style>\n            \n          </head>\n        \n          <body>\n\n            <div style=\"font-family:monospace;font-size:10px;padding-top:3px;padding-left:10px;\">\n            <a href=\"/\">Chess</a> | <a href=\"/enginesetup\">Engine setup</a>\n            </div>\n\n            " + (req.path == "/" ?
            "<script src=\"wasmboard.js\"></script>"
            :
                "<div style=\"padding:10px;margin:5px;background-color:#efefef;font-family:monospace;\">\n                " + setuphtml(e) + "</div>") + "\n\n            <script src=\"assets/javascripts/analytics.js\"></script>\n        \n          </body>\n        \n        </html>\n        ");
    }
    function indexhtml(req, res) {
        console.log(req.path);
        var e = new Engine();
        if (req.path == "/doeditengine") {
            var form = new formidable.IncomingForm();
            form.parse(req, function (err, fields, files) {
                var i = Globals.engines.getIndexByName(fields.name);
                if (i >= 0) {
                    e = Globals.engines.engines[i];
                    indexsend(req, res, e);
                }
            });
        }
        else {
            indexsend(req, res, e);
        }
    }
    Server.indexhtml = indexhtml;
})(Server || (Server = {}));
var Globals;
(function (Globals) {
    Globals.engines = new Engines();
    Globals.configasset = new Misc.textFileAssetWithDefault(__dirname + "/config.json", "{\"engines\":[]}");
})(Globals || (Globals = {}));
var formidable = require('formidable');
var http = require('http');
var express = require('express');
var WebSocket_ = require('ws');
var spawn = require("child_process").spawn;
var path_ = require("path");
var app = express();
var server = http.createServer(app);
Globals.engines.fromJsonText(Globals.configasset.get());
app.get('/', Server.indexhtml);
app.get('/enginesetup', Server.indexhtml);
app.get('/wasmboard.js', function (req, res) {
    res.setHeader("Content-Type", "application/javascript");
    res.sendFile(__dirname + '/wasmboard.js');
});
app.get('/startup.json', function (req, res) {
    res.setHeader("Content-Type", "application/json");
    res.sendFile(__dirname + '/startup.json');
});
app.post('/editengine', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var i = Globals.engines.getIndexByName(fields.name);
        if (i >= 0) {
            Globals.engines.engines[i].path = fields.path;
            Globals.engines.engines[i].config = fields.config;
        }
        Server.indexhtml(req, res);
    });
});
app.post('/dodeleteengine', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        Globals.engines.deleteByName(fields.name);
        Server.indexhtml(req, res);
    });
});
app.post('/doeditengine', function (req, res) {
    Server.indexhtml(req, res);
});
app.use('/assets', express.static(path_.join(__dirname, 'assets')));
var wss = new WebSocket_.Server({ server: server });
var current_ws;
var proc = null;
function issueCommand(command) {
    command += "\n";
    command = command.replace(new RegExp("\\n+", "g"), "\n");
    try {
        proc.stdin.write(command);
    }
    catch (err) {
        console.log("could not write command to process stdin");
    }
}
wss.on('connection', function connection(ws) {
    current_ws = ws;
    ws.on('message', function incoming(message) {
        var mjson = JSON.parse(message);
        console.log('received:', mjson);
        if (mjson.action == "sendavailable")
            ws.send("{\"action\":\"available\",\"available\":[" + Globals.engines.engines.map(function (engine) { return "\"" + engine.name + "\""; }).join(",") + "]}");
        if (mjson.action == "start") {
            var name_1 = mjson.name;
            var i = Globals.engines.getIndexByName(name_1);
            if (i >= 0) {
                var e = Globals.engines.engines[i];
                if (proc != null)
                    try {
                        proc.kill();
                    }
                    catch (err) {
                        console.log("could not kill process: " + proc);
                    }
                try {
                    proc = spawn(e.path);
                }
                catch (err) {
                    console.log("could not start process: " + name_1 + " @ " + e.path);
                }
                if (e.config != "") {
                    issueCommand(e.config);
                }
                proc.stdout.on('data', function (data) {
                    var str = data.toString().replace(new RegExp("[\r]", "g"), "");
                    var lines = str.split("\n");
                    lines.map(function (line) {
                        if (line != "")
                            current_ws.send("{\"action\":\"thinkingoutput\",\"buffer\":\"" + line + "\"}");
                    });
                });
            }
        }
        if (mjson.action == "issue") {
            var command = mjson.command.toString();
            issueCommand(command);
        }
    });
});
server.listen(9000, function () {
    console.log("Node engine server started on port " + server.address().port);
});
