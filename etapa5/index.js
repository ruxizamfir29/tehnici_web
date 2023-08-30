const express = require("express");
const fs = require("fs");
const path = require("path");
const sass = require("sass");
// const sharp = require("sharp");

obGlobal = {
  obErori: null,
  obImagini: null,
  folderCss: __dirname + "/resurse/css/sass-compilat",
  folderScss: __dirname + "/resurse/sass",
};

app = express();

// folderul proiectului __dirname - nu se schimba, este un macro/o constanta
// __filename - fisierul curent
// process.cwd - se poate modifica daca schimbam directorul cu cd

console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

app.set("view engine", "ejs");

app.use("/resurse", express.static(__dirname + "/resurse"));

var foldere = ["temp", "backup"];
creareFoldere(foldere);

app.use(/^\/resurse(\/(\w)*)*$/, function (req, res) {
  afisareEroare(res, 403);
});

app.get(["/index", "/", "/home"], function (req, res) {
  res.render("pagini/index", { ip: req.ip, imagini: obGlobal.imagini });
});

app.get("/galerie", function (req, res) {
  res.render("pagini/galerie", { imagini: obGlobal.imagini });
});

app.get("/favicon.ico", function (req, res) {
  res.sendFile(__dirname + "/resurse/ico/favicon.ico");
});

app.get("/*.ejs", function (req, res) {
  console.log("url:", req.url);
  afisareEroare(res, 400);
});

app.get("/*", function (req, res) {
  res.render("pagini" + req.url, function (err, rezRandare) {
    if (err) {
      if (err.message.startsWith("Failed to lookup view")) {
        afisareEroare(res, 404);
      } else {
        afisareEroare(res);
        console.log(err);
      }
    } else {
      res.send(rezRandare);
    }
  });
});

function initErori() {
  var continut = fs
    .readFileSync(__dirname + "/resurse/json/erori.json")
    .toString("utf-8");
  console.log(continut);
  obGlobal.obErori = JSON.parse(continut);
  let vErori = obGlobal.obErori.info_erori;
  for (let eroare of vErori) {
    eroare.imagine = obGlobal.obErori.cale_baza + "/" + eroare.imagine;
  }
}
initErori();

function afisareEroare(
  res,
  _identificator,
  _titlu = "Eroare",
  _text,
  _imagine
) {
  let vErori = obGlobal.obErori.info_erori;
  let eroare = vErori.find(function (elem) {
    return elem.identificator == _identificator;
  });
  if (eroare) {
    let titlu1 = _titlu == "Eroare" ? eroare.titlu || _titlu : _titlu;
    let text1 = _text || eroare.text;
    let imagine1 = _imagine || eroare.imagine;
    if (eroare.status)
      res
        .status(eroare.identificator)
        .render("pagini/eroare", {
          titlu: titlu1,
          text: text1,
          imagine: imagine1,
        });
    else
      res.render("pagini/eroare", {
        titlu: titlu1,
        text: text1,
        imagine: imagine1,
      });
  } else {
    let errDef = obGlobal.obErori.eroare_default;
    res.render("pagini/eroare", {
      titlu: errDef.titlu,
      text: errDef.text,
      imagine: obGlobal.obErori.cale_baza + "/" + errDef.imagine,
    });
  }
}

function creareFoldere(vector_foldere) {
  for (let folder of vector_foldere) {
    let curr_path = path.join(__dirname, folder);
    if (fs.existsSync(curr_path) === false)
      fs.mkdir(curr_path, function cb(err) {
        if (err) {
          console.log(err);
        }
      });
  }
}

function compileazaFisierScss(caleScss, caleCss)
{
    var absoluteSass = null;
    if(path.isAbsolute(caleScss)){
        absoluteSass = caleScss;
    }
    else{
        absoluteSass = path.resolve(obGlobal.folderScss, caleScss);
    }
    var absoluteCss = null;
    if(path.isAbsolute(caleCss)){
        absoluteCss = caleCss;
    }
    else{
        absoluteCss = path.resolve(obGlobal.folderCss, caleCss);
    }

    var numeFisier = path.basename(absoluteCss);
    var caleFisierBackup = path.join("backup/resurse/css/sassCompilat", numeFisier);

    fs.openSync(caleFisierBackup, 'w');
    console.log("Fisierul", numeFisier, "a fost creat cu succes in folderul de backup!");
    
    if(fs.existsSync(absoluteCss)){
        fs.copyFileSync(absoluteCss, caleFisierBackup);
        let sassCompilat = sass.compile(absoluteSass, { sourceMap: true });
        fs.writeFileSync(absoluteCss, sassCompilat.css);
        console.log("Fisierul", numeFisier, "a fost creat cu succes in folderul de resurse/css/sassCompilat!");
    }
    else{
        let sassCompilat = sass.compile(absoluteSass, { sourceMap: true });
        fs.writeFileSync(absoluteCss, sassCompilat.css);
        console.log("Fisierul", numeFisier, "a fost creat cu succes in folderul de resurse/css/sassCompilat!");
        fs.copyFileSync(absoluteCss, caleFisierBackup);
        console.log("Fisierul", numeFisier, "din resurse/css/sassCompilat a fost mutat in backup!");
    }
}

function compileazaFolderScss(caleScss = obGlobal.folderScss, caleCss = obGlobal.folderCss)
{
    var backupResurse = "backup/resurse";
    var backupResurseCss = "backup/resurse/css";
    var backupResurseCssSassCompilat = "backup/resurse/css/sassCompilat";
    creareFoldere([backupResurse, backupResurseCss, backupResurseCssSassCompilat]);
    
    fs.readdir(caleScss, function(err, files){
        if(err){
            console.log(err);
            return;
        }
        else{
            for (let file of files) {
                fs.watch(path.join(caleScss, file), function(eventType, fileName) {
                    try {
                        var fisierFaraExtensie = file.substring(0, file.lastIndexOf("."));
                        var fisierCss = fisierFaraExtensie + ".css";
                        compileazaFisierScss(file, fisierCss);
                    } catch (error) {
                        console.error("A aparut o eroare:", error);
                    }
                });
            }
        }
    });
}

compileazaFolderScss();

function createImages() {
  var continutFisier = fs
    .readFileSync(__dirname + "/resurse/json/galerie.json")
    .toString("utf8");
  var obiect = JSON.parse(continutFisier);
  var dim_mare = 300;
  var dim_mediu = 200;
  var dim_mic = 150;
  obGlobal.imagini = obiect.imagini;

  obGlobal.imagini.forEach(function (elem) {
    [numeFisier, extensie] = elem.fisier.split(".");
    elem.fisier = obiect.cale_galerie + "/" + elem.fisier;

    if (!fs.existsSync(__dirname + "/" + obiect.cale_galerie + "/mare/")) {
      fs.mkdirSync(__dirname + "/" + obiect.cale_galerie + "/mare/");
    }
    elem.fisier_mare = obiect.cale_galerie + "/mare/" + numeFisier + ".webp";
    // sharp(__dirname + "/" + elem.fisier)
    //   .resize(dim_mare)
    //   .toFile(__dirname + "/" + elem.fisier_mare);

    if (!fs.existsSync(__dirname + "/" + obiect.cale_galerie + "/mediu/")) {
      fs.mkdirSync(__dirname + "/" + obiect.cale_galerie + "/mediu/");
    }
    elem.fisier_mediu = obiect.cale_galerie + "/mediu/" + numeFisier + ".webp";
    // sharp(__dirname + "/" + elem.fisier)
    //   .resize(dim_mediu)
    //   .toFile(__dirname + "/" + elem.fisier_mediu);

    if (!fs.existsSync(__dirname + "/" + obiect.cale_galerie + "/mic/")) {
      fs.mkdirSync(__dirname + "/" + obiect.cale_galerie + "/mic/");
    }
    elem.fisier_mic = obiect.cale_galerie + "/mic/" + numeFisier + ".webp";
    // sharp(__dirname + "/" + elem.fisier)
    //   .resize(dim_mic)
    //   .toFile(__dirname + "/" + elem.fisier_mic);
  });
  console.log(obGlobal.imagini);
}
createImages();

app.listen(8088);
console.log("Serverul a pornit!");
