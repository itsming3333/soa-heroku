const express = require("express");
const mysql = require("mysql");
const app = express();
const config = require("./config");
var fs = require('fs');
var morgan = require('morgan');
require('dotenv').config();
var path = require('path')
app.use(express.urlencoded({extended:true}));
//set DB
const pool = mysql.createPool(config.database);
var user=[];
var music=[];

function getConnection(){
    return new Promise(function(resolve, reject){
        pool.getConnection(function(err, conn){
            if(err){
                reject(err);
            }
            else{
                resolve(conn);
            }
        });
    });
}

function executeQuery(conn, query){
    return new Promise(function(resolve, reject){
        conn.query(query, function(err, res){
            if(err){
                reject(err);
            }
            else{
                resolve(res);
            }
        });
    });
}

//1 addUser
app.post('/api/addUser',async function(req,res){
    let nomorhp = req.body.nomorhp;
    let password = req.body.password;
    let nama = req.body.nama;
    let tipe = req.body.tipe;
    let saldo = req.body.saldo;
    let validasi = true;
    if(nama.length < 1 || nomorhp.length < 1 || password.length < 1 || tipe.length < 1){
        validasi = false;
    }

    let conn = await getConnection();
    let getUser = `select * from user`;
    user.splice(0, user.length);
    user = await executeQuery(conn, getUser);
    console.log(user);

    for (let i = 0; i < user.length; i++) {
        const u = user[i];
        if(u.nomorhp == nomorhp){
            validasi = false;
        }
    }

    if(validasi){
        let gkey = Math.floor(Math.random() * (9999999999 - 1111111111) ) + 1111111111;
        let insertUser = `insert into user values('${nomorhp}','${password}','${nama}','${tipe}',${saldo},'${gkey}','')`;
        let result = await executeQuery(conn, insertUser);
        conn.release();
        return res.status(200).send(gkey.toString());
    }else{
        conn.release();
        return res.status(400).send("fill all fields/nomorhp already used!");
    }    
});

//2 topUp
app.post('/api/topUp',async function(req,res){
    let gkey = req.body.gkey;
    let topup = parseInt(req.body.topup);
    let validasi = false;
    let nomorhp = "";
    let saldoNow = 0;

    let conn = await getConnection();
    let getUser = `select * from user`;
    user.splice(0, user.length);
    user = await executeQuery(conn, getUser);
    console.log(user);

    for (let i = 0; i < user.length; i++) {
        const u = user[i];
        if(u.gkey == gkey){
            validasi = true;
            nomorhp = u.nomorhp;
            saldoNow = parseInt(u.saldo);
            saldoNow += topup;
        }
    }

    if(validasi){
        let updateSaldo = `update user set saldo=${saldoNow} where nomorhp=${nomorhp}`;
        let runQ = await executeQuery(conn, updateSaldo);
        conn.release();
        return res.status(200).send("Success topup!");
    }else{
        conn.release();
        return res.status(400).send("Invalid key!");
    }    
});

//3 addSong
app.post('/api/addsong',async function(req,res){
    let gkey = req.body.gkey;
    let judul = req.body.judul;
    let genre = req.body.genre;
    let durasi = req.body.durasi;
    let user_logon = [];
    let validasi = false;

    let conn = await getConnection();
    let getUser = `select * from user`;
    user.splice(0, user.length);
    user = await executeQuery(conn, getUser);
    console.log(user);

    for (let i = 0; i < user.length; i++) {
        const u = user[i];
        if(u.gkey == gkey){
            validasi = true;
            user_logon = u;
        }
    }

    if(validasi){
        if(user_logon.tipeuser == 0){
            let newSong = `insert into music values(null,'${judul}','${genre}','${durasi}','${user_logon.nomorhp}')`
            let runQ = await executeQuery(conn, newSong);
            return res.status(200).send("Song added...");
        }else{
            conn.release();
            return res.status(400).send("Invalid user type!");
        }
    }else{
        conn.release();
        return res.status(400).send("Invalid key!");
    }    
});

//4 edit song
app.put('/api/song',async function(req,res){
    let gkey = req.body.gkey;
    let id_lagu = req.body.id_lagu;
    let judul = req.body.judul;
    let genre = req.body.genre;
    let durasi = req.body.durasi;
    let user_logon = [];
    let validasi = false;

    let conn = await getConnection();
    let getUser = `select * from user`;
    user.splice(0, user.length);
    user = await executeQuery(conn, getUser);
    console.log(user);
    let getMusic = `select * from music`;
    music.splice(0, music.length);
    music = await executeQuery(conn, getMusic);
    console.log(music);

    for (let i = 0; i < user.length; i++) {
        const u = user[i];
        if(u.gkey == gkey){
            validasi = true;
            user_logon = u;
            for (let j = 0; j < music.length; j++) {
                const m = music[j];
                if(m.nomorhpartis!=u.nomorhp){
                    validasi = false;
                }
            }
        }
    }

    let validasi_music = false;
    music.forEach(m => {
        if(m.id == id_lagu){
            validasi_music = true;
        }
    });

    if(validasi && validasi_music){
        if(judul.length < 1 || id_lagu.length < 1 || genre.length < 1 || durasi.length < 1){
            conn.release();
            return res.status(400).send("Fill all fields!");
        }
        if(user_logon.tipeuser == 0){
            let updateSong = `update music set judul='${judul}',genre='${genre}',durasi='${durasi}' where id='${id_lagu}'`
            let runQ = await executeQuery(conn, updateSong);
            conn.release();
            return res.status(200).send("Song updated...");
        }else{
            conn.release();
            return res.status(400).send("Invalid user type!");
        }
    }else{
        conn.release();
        return res.status(400).send("Invalid key/music owner/music id!");
    }    
});

//5 Delete Song
app.delete('/api/song',async function(req,res){
    let gkey = req.body.gkey;
    let id_lagu = req.body.id_lagu;
    let user_logon = [];
    let validasi = false;

    let conn = await getConnection();
    let getUser = `select * from user`;
    user.splice(0, user.length);
    user = await executeQuery(conn, getUser);
    console.log(user);
    let getMusic = `select * from music`;
    music.splice(0, music.length);
    music = await executeQuery(conn, getMusic);
    console.log(music);

    for (let i = 0; i < user.length; i++) {
        const u = user[i];
        if(u.gkey == gkey){
            validasi = true;
            user_logon = u;
            for (let j = 0; j < music.length; j++) {
                const m = music[j];
                if(m.nomorhpartis!=u.nomorhp){
                    validasi = false;
                }
            }
        }
    }

    let validasi_music = false;
    music.forEach(m => {
        if(m.id == id_lagu){
            validasi_music = true;
        }
    });

    if(validasi && validasi_music){
        if(user_logon.tipeuser == 0){
            let updateSong = `delete from music where id='${id_lagu}'`
            let runQ = await executeQuery(conn, updateSong);
            conn.release();
            return res.status(200).send("Song deleted...");
        }else{
            conn.release();
            return res.status(400).send("Invalid user type!");
        }
    }else{
        conn.release();
        return res.status(400).send("Invalid key/music owner/music id!");
    }    
});

//6 Subscribe
app.post('/api/subscribe',async function(req,res){
    let gkey = req.body.gkey;
    let validasi = false;
    let nomorhp = "";
    let conn = await getConnection();
    let getUser = `select * from user`;
    user.splice(0, user.length);
    user = await executeQuery(conn, getUser);
    console.log(user);

    for (let i = 0; i < user.length; i++) {
        const u = user[i];
        if(u.gkey == gkey){
            validasi = true;
            user_logon = u;
        }
    }

    if(validasi){
        if(user_logon.tipeuser == 2){
            if(user_logon.saldo >= 50000){
                let updateUser = `update user set tipeuser=1 where nomorhp='${user_logon.nomorhp}'`
                let runQ = await executeQuery(conn, updateUser);
                conn.release();
                return res.status(200).send("Success subscribe...");
            }else{
                conn.release();
                return res.status(400).send("Not enough saldo!");
            }
            
        }else{
            conn.release();
            return res.status(400).send("Invalid user type!");
        }
    }else{
        conn.release();
        return res.status(400).send("Invalid key!");
    }    
});

app.listen(3000);