const express = require("express");
const fs = require('fs');
var path = require('path');

obGlobal={
    obErori:null,
    obImagini:null
}

app = express();

// folderul proiectului __dirname - nu se schimba, este un macro/o constanta
// __filename - fisierul curent
// process.cwd - se poate modifica daca schimbam directorul

console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

app.set("view engine","ejs");

app.use("/resurse", express.static(__dirname+"/resurse"));

var foldere = ["temp", "temp1"];
creareFoldere(foldere);

app.use(/^\/resurse(\/(\w)*)*$/, function(req,res){
    afisareEroare(res, 403);
});

app.get(["/index","/","/home"], function(req, res){
    res.render("pagini/index" , {ip: req.ip});
});

app.get("/favicon.ico", function(req, res){
    res.sendFile(__dirname+"/resurse/ico/favicon.ico");
});

app.get("/*.ejs",function(req, res){
    console.log("url:", req.url);
    afisareEroare(res, 400);
});

app.get("/*",function(req, res){
    res.render("pagini"+req.url, function(err, rezRandare){
        if(err){
            if(err.message.startsWith("Failed to lookup view")){
                afisareEroare(res, 404);
            }
            else
                afisareEroare(res);
        }
        else{
            console.log(rezRandare);
            res.send(rezRandare);
        }
    });
});

function initErori(){
    var continut = fs.readFileSync(__dirname+"/resurse/json/erori.json").toString("utf-8");
    console.log(continut);
    obGlobal.obErori=JSON.parse(continut);
    let vErori=obGlobal.obErori.info_erori;
    for (let eroare of vErori){
        eroare.imagine=obGlobal.obErori.cale_baza+"/"+eroare.imagine;
    }
}
initErori();

function afisareEroare(res, _identificator, _titlu="Eroare", _text, _imagine){
    let vErori=obGlobal.obErori.info_erori;
    let eroare=vErori.find(function(elem) {return elem.identificator==_identificator;})
    if(eroare){
        let titlu1= _titlu=="Eroare" ? (eroare.titlu || _titlu) : _titlu;
        let text1= _text || eroare.text;
        let imagine1= _imagine || eroare.imagine;
        if(eroare.status)
            res.status(eroare.identificator).render("pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1});
        else
            res.render("pagini/eroare", {titlu:titlu1, text:text1, imagine:imagine1});
    }
    else{
        let errDef=obGlobal.obErori.eroare_default;
        res.render("pagini/eroare", {titlu:errDef.titlu, text:errDef.text, imagine:obGlobal.obErori.cale_baza+"/"+errDef.imagine});
    }
}

function creareFoldere(vector_foldere){
    for(let folder of vector_foldere){
        let curr_path = path.join(__dirname, folder);
        if(fs.existsSync(curr_path) === false)
            fs.mkdir(curr_path, function cb(err){
                if(err){
                    console.log(err);
                }
            });
    }
}

app.listen(8088);
console.log("Serverul a pornit");