//<paquetes>
const express = require('express');
const bodyParser = require('body-parser');
const esquema = require('./models/model');
var pg = require("pg");
const session = require("express-session");
//</paquetes>
//<Archivos>
const multer = require("multer");
const mimeTypes = require("mime-types");

//const fs = require("fs");
//</Archivos>

//<conexión>
const host = '127.0.0.1';
const port = 3000;
//</conexión>

//<uso de express>
const app = express();
//</uso de express>

//<archivos estaticos como css, jpg, etc>
app.use(express.static('public'));

app.use(express.static('uploads'));
//</archivos estaticos como css, jpg, etc>

//<bodyParser para formularios>
app.use(bodyParser.json()); //para Json
app.use(bodyParser.urlencoded({extended: true}));
//</bodyParser para formularios>

//<middleware para sesiones>
app.use(session({
    secret: "124325fdsgfdhfdasd",
    resave: false,
    saveUninitialized: false
}));
//</middleware para sesiones>



//<middleware para validacion de sesion>
//app.use("/", session_middleware);
//</middleware para validacion de sesion>

//app.use("/app", router_app);

//<leer jade>
app.set("view engine", "jade");
//</leer jade>

//<llamar Modelos>
var Usuario = esquema.Usuario;
var Tarea = esquema.Tarea;
//</llamar Modelos>

//<CONEXION POSGRESQL>
var connectionString = "pg://Parker:OsoPolar@localhost:5432/colegio";
var client = new pg.Client(connectionString);
client.connect();
//<verificacion DB>
const dbs = client.connection;
dbs.on('error', console.error.bind(console, 'connection postgres error: '));
dbs.once('open', () => {
    console.log('Database Postgres connection OK!');
})
//</verificacion DB>

//</CONEXION POSGRESQL>

//<REALIZAR CONSULTAS A MONGODB>
//<enviar Registro Estudiante>
app.post("/registroest", (req, res) => {
    //<insertar en POSTGRES>
    client.query(`insert into estudiante
        (cia, nombrea, paternoa, maternoa, sexoa, celulara)
        values
        ($1, $2, $3, $4, $5, $6)`, [req.body.ci, req.body.nombre, req.body.paterno, req.body.materno, req.body.sexo, req.body.celular])
    //</POSTGRES>
    //<inscribir en todos las materias del req.body.curso>
    client.query(`select idm from materia where idc=$1`, [req.body.curso])
        .then(response => {
            var n = Object.keys(response.rows).length;
            //console.log(Object.keys(response.rows).length);
            for(var i=0; i < n; i++){
                client.query(`insert into estudiantemateria
                    (cia, idm)
                    values
                    ($1, $2)`, [req.body.ci, response.rows[i].idm]);
                    //console.log(response.rows[i].idm);
            }
            //console.log(response.rows);
            //console.log(response.rows[2]);
            //console.log(response.rows[1].idm);
            //console.log(Object.keys(response.rows).length);
        })
        .catch(err => {
            console.log("No se pudo introducir");
        })
    //</inscribir en todos las materias del req.body.curso>

    //<MONGODB USUARIO>
    var user = new Usuario({usuario: req.body.ci, password: req.body.ci, rol: "estudiante"});
    user.save(() => {
        res.send("Registro estudiante exitoso");
    });
    //</MONGODB USUARIO>    
});
//</enviar Registro Estudiante>

//<enviar Registro Docente>
app.post("/registrodoc", (req, res) => {
    //<insertar en POSTGRES>
    client.query(`insert into docente
        (cid, nombred, paternod, maternod, sexod, celulard, idm)
        values
        ($1, $2, $3, $4, $5, $6, $7)`, [req.body.ci, req.body.nombre, req.body.paterno, req.body.materno, req.body.sexo, req.body.celular, req.body.materia])
    //</POSTGRES>    
    //<MONGODB DOCENTE>
    var user = new Usuario({usuario: req.body.ci, password: req.body.password, rol: "docente"});
    user.save(() => {
        res.send("Registro docente exitoso");
    });
    //</MONGODB USUARIO>    
});
//</enviar Registro Docente>

//<consultar login>
app.post("/login", (req, res) => {
    Usuario.find({usuario: req.body.usuario,
                    password: req.body.password},
                    (err, doc) => {
                        var user = doc.toString();

                        //<guardamos la sesión>
                        req.session.user_id = req.body.usuario; //se convierte en JSon
                        console.log(req.session.user_id);
                        console.log(typeof(req.session.user_id));
                        //</guardamos la sesión>
                        
                        if(user.includes("estudiante")){
                            //consulta en postgres para mostrar sus datos
                            ;(async () => {
                                //<NOMBRE>
                                var nombrecompleto;
                                var nombre = await client.query(`select nombrea, paternoa, maternoa from estudiante where cia=$1`, [req.session.user_id]);
                                //console.log(res.rows);
                                nombrecompleto = nombre.rows[0].nombrea+" "+nombre.rows[0].paternoa+" "+nombre.rows[0].maternoa;
                                console.log(nombrecompleto);
                                //</NOMBRE>

                                //<CURSO>
                                var gradoe, paraleloe;
                                var curso = await client.query(`select distinct c.grado, c.paralelo
                                from estudiante e, estudiantemateria em, materia m, curso c
                                where em.cia=$1 and em.idm=m.idm and m.idc=c.idc`, [req.session.user_id]);
                                console.log(curso.rows);
                                gradoe = curso.rows[0].grado;
                                paraleloe = curso.rows[0].paralelo;
                                //</CURSO>
                                
                                //<MATERIAS>
                                var materiase = [];
                                var materias = await client.query(`select distinct m.nombrem
                                from estudiante e, estudiantemateria em, materia m
                                where em.cia=$1 and em.idm=m.idm`, [req.session.user_id]);
                                console.log(materias.rows);
            
                                var n = Object.keys(materias.rows).length;
                                for(var i=0; i < n; i++){
                                    materiase.push(materias.rows[i].nombrem);
                                }
                                console.log(materiase);
                                //</MATERIAS>

                                //<TAREAS>
                                var tarease = [];
                                var tareas = await client.query(`select t.nombret
                                from estudiantemateria em, tarea t
                                where em.cia=$1 and em.idm=t.idm`, [req.session.user_id]);
                                console.log(tareas.rows);

                                var n = Object.keys(tareas.rows).length;
                                for(var i=0; i < n; i++){
                                    tarease.push(tareas.rows[i].nombret);
                                }
                                console.log(tarease);
                                //</TAREAS>

                                res.render("perfilestudiante", {nombre: nombrecompleto, grado: gradoe, paralelo: paraleloe, materias: materiase, tareas: tarease});
                            })()
                        }
                        else if(user.includes("docente")){
                            //consulta en postgres para mostrar sus datos
                            ;(async () => {
                                //<NOMBRE>
                                var nombrecompleto;
                                var nombre = await client.query(`select nombred, paternod, maternod from docente where cid=$1`, [req.session.user_id]);
                                //console.log(res.rows);
                                nombrecompleto = nombre.rows[0].nombred+" "+nombre.rows[0].paternod+" "+nombre.rows[0].maternod;
                                console.log(nombrecompleto);
                                //</NOMBRE>

                                //<CURSO>
                                var gradod, paralelod;
                                var curso = await client.query(`select distinct c.grado, c.paralelo
                                    from docente d, materia m, curso c
                                    where d.cid=$1 and m.idm=d.idm and m.idc=c.idc`, [req.session.user_id]);
                                console.log(curso.rows);
                                gradod = curso.rows[0].grado;
                                paralelod = curso.rows[0].paralelo;
                                //</CURSO>
                                
                                //<MATERIA>
                                var materiad, nombremateriad;
                                var materia = await client.query(`select m.nombrem, m.idm
                                from docente d, materia m
                                where d.cid=$1 and d.idm=m.idm`, [req.session.user_id]);
                                console.log(materia.rows);
                                nombremateriad=materia.rows[0].nombrem;
                                materiad=materia.rows[0].idm;
                                
                                console.log(materiad);
                                console.log(nombremateriad);
                                //</MATERIA>

                                //<TAREAS>
                                var tareasd = [];
                                var tareas = await client.query(`select t.nombret
                                from docente d, tarea t
                                where d.cid=$1 and d.idm=t.idm`, [req.session.user_id]);
                                console.log(tareas.rows);

                                var n = Object.keys(tareas.rows).length;
                                for(var i=0; i < n; i++){
                                    tareasd.push(tareas.rows[i].nombret);
                                }
                                console.log(tareasd);
                                //</TAREAS>
                                res.render("perfildocente", {nombre: nombrecompleto, grado: gradod, paralelo: paralelod, nombremateria: nombremateriad, materia: materiad, tareas: tareasd});
                            })()
                        }
                        else{
                            res.send(typeof(user));
                        }
                });
});
//</consultar login>
//</REALIZAR CONSULTAS A MONGODB>

//<RENDERIZADO>
//<DOCENTE>
app.get("/perfildocente", (req, res) => {
    //consulta en postgres para mostrar sus datos
    ;(async () => {
        //<NOMBRE>
        var nombrecompleto;
        var nombre = await client.query(`select nombred, paternod, maternod from docente where cid=$1`, [req.session.user_id]);
        //console.log(res.rows);
        nombrecompleto = nombre.rows[0].nombred+" "+nombre.rows[0].paternod+" "+nombre.rows[0].maternod;
        console.log(nombrecompleto);
        //</NOMBRE>

        //<CURSO>
        var gradod, paralelod;
        var curso = await client.query(`select distinct c.grado, c.paralelo
            from docente d, materia m, curso c
            where d.cid=$1 and m.idm=d.idm and m.idc=c.idc`, [req.session.user_id]);
        console.log(curso.rows);
        gradod = curso.rows[0].grado;
        paralelod = curso.rows[0].paralelo;
        //</CURSO>
        
        //<MATERIA>
        var materiad, nombremateriad;
        var materia = await client.query(`select m.nombrem, m.idm
        from docente d, materia m
        where d.cid=$1 and d.idm=m.idm`, [req.session.user_id]);
        console.log(materia.rows);
        nombremateriad=materia.rows[0].nombrem;
        materiad=materia.rows[0].idm;
        
        console.log(materiad);
        console.log(nombremateriad);
        //</MATERIA>

        //<TAREAS>
        var tareasd = [];
        var tareas = await client.query(`select t.nombret
        from docente d, tarea t
        where d.cid=$1 and d.idm=t.idm`, [req.session.user_id]);
        console.log(tareas.rows);

        var n = Object.keys(tareas.rows).length;
        for(var i=0; i < n; i++){
            tareasd.push(tareas.rows[i].nombret);
        }
        console.log(tareasd);
        //</TAREAS>
        res.render("perfildocente", {nombre: nombrecompleto, grado: gradod, paralelo: paralelod, nombremateria: nombremateriad, materia: materiad, tareas: tareasd});
    })()
});
//</DOCENTE>

//<ESTUDIANTE>
app.get("/perfilestudiante", (req, res) => {
    //consulta en postgres para mostrar sus datos
    ;(async () => {
        //<NOMBRE>
        var nombrecompleto;
        var nombre = await client.query(`select nombrea, paternoa, maternoa from estudiante where cia=$1`, [req.session.user_id]);
        //console.log(res.rows);
        nombrecompleto = nombre.rows[0].nombrea+" "+nombre.rows[0].paternoa+" "+nombre.rows[0].maternoa;
        console.log(nombrecompleto);
        //</NOMBRE>

        //<CURSO>
        var gradoe, paraleloe;
        var curso = await client.query(`select distinct c.grado, c.paralelo
        from estudiante e, estudiantemateria em, materia m, curso c
        where em.cia=$1 and em.idm=m.idm and m.idc=c.idc`, [req.session.user_id]);
        console.log(curso.rows);
        gradoe = curso.rows[0].grado;
        paraleloe = curso.rows[0].paralelo;
        //</CURSO>
        
        //<MATERIAS>
        var materiase = [];
        var materias = await client.query(`select distinct m.nombrem
        from estudiante e, estudiantemateria em, materia m
        where em.cia=$1 and em.idm=m.idm`, [req.session.user_id]);
        console.log(materias.rows);

        var n = Object.keys(materias.rows).length;
        for(var i=0; i < n; i++){
            materiase.push(materias.rows[i].nombrem);
        }
        console.log(materiase);
        //</MATERIAS>

        //<TAREAS>
        var tarease = [];
        var tareas = await client.query(`select t.nombret
        from estudiantemateria em, tarea t
        where em.cia=$1 and em.idm=t.idm`, [req.session.user_id]);
        console.log(tareas.rows);

        var n = Object.keys(tareas.rows).length;
        for(var i=0; i < n; i++){
            tarease.push(tareas.rows[i].nombret);
        }
        console.log(tarease);
        //</TAREAS>

        res.render("perfilestudiante", {nombre: nombrecompleto, grado: gradoe, paralelo: paraleloe, materias: materiase, tareas: tarease});
    })()
});
//</ESTUDIANTE>




//<principal_login>
app.get("/", (req, res) => {
    res.render("login");
});
//</principal_login>

//<listar nuevos estudiantes>
app.get("/listarestudiantes", (req, res) => {
    //<listar estudiantes>
    client.query(`select e.cia, e.nombrea, e.paternoa, e.maternoa, d.idm
    from estudiante e, docente d, estudiantemateria em
    where d.cid=$1 and d.idm=em.idm and em.cia=e.cia`, [req.session.user_id])
    .then(response => {
        estudiantes = [];
        idestudiantes = [];
        //response.rows[0].idm

        //numero de alumnos en la materia
        var n = Object.keys(response.rows).length;
        //console.log(Object.keys(response.rows).length);
        for(var i=0; i < n; i++){
            var nombrecompletoe = response.rows[i].nombrea+" "+response.rows[i].paternoa+" "+response.rows[i].maternoa;
            estudiantes.push(nombrecompletoe);
            idestudiantes.push(response.rows[i].cia);
            console.log(response.rows[i].cia);
        }
        console.log(estudiantes);
        console.log(idestudiantes);
        console.log("YA AÑADIDA LAS TAREAS");
        res.render("aniadirestudiante", {estudiantes: estudiantes, cis: idestudiantes, idmateria: response.rows[0].idm});
    })
    .catch(err => {
        console.log("No se pudo listar estudiantes");
    })
});
//</listar nuevos estudiantes>

//<añadir nuevo estudiante>
app.get("/nuevoestudiante", (req, res) => {
    res.render("nuevoestudiante");
});
//</añadir nuevo estudiante>

//<añadir nuevo docente>
app.get("/nuevodocente", (req, res) => {
    res.render("nuevodocente");
});
//</añadir nuevo docente>

//<TAREA DOCENTE>
app.get("/aniadirtarea", (req, res) => {
    console.log(__dirname);
    res.sendFile(__dirname + "/public/html/aniadirtarea.html");
});
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function(req, file, cb){
        //cb("", "imagen.jpg");
        //nombre de la imagen jalada del formulario
        cb("", req.body.nombre+"."+mimeTypes.extension(file.mimetype));
    }
});
const upload = multer({
    //dest: 'uploads/'
    storage: storage
});
app.post("/filesdocente", upload.single('tarea'),(req, res) => {
    //cargar los datos a postgres
    client.query(`insert into tarea(idt, nombret, puntost, idm) values ($1, $2, $3, $4);`, [req.body.idtarea, req.body.nombre, req.body.puntos, req.body.idmateria])
    //codigo
    res.send("Tarea subida con exito");   
});
//</TAREA DOCENTE>

//<TAREA ESTUDIANTE>
const storageest = multer.diskStorage({
    destination: 'uploads/',
    filename: function(req, file, cb){
        //nombre de la imagen jalada de la base de datos
        cb("", req.session.user_id+req.body.idmateria+req.body.nombretarea+".pdf");
    }
});
const uploadest = multer({
    storage: storageest
});
app.post("/filesestudiante", uploadest.single('tarea'),(req, res) => {
    //cargar los datos a mongo de las tareas entregadas
     //<MONGODB USUARIO>
     var tarea = new Tarea({ciest: req.session.user_id, idmateria: req.body.idmateria, nombretarea: req.body.nombretarea, calificacion: "0", nombredocumento: req.session.user_id+req.body.idmateria+req.body.nombretarea+".pdf"});
     tarea.save();
     //</MONGODB USUARIO>

    //codigo
    res.send("Tarea subida con exito");   
});



app.get("/miscursos", (req, res) => {
    ;(async () => {
        //<TAREAS>
        var idmaterias = [];
        var tarease = [];
        var tareas = await client.query(`select t.idm, t.nombret
        from estudiantemateria em, tarea t
        where em.cia=$1 and em.idm=t.idm`, [req.session.user_id]);
        console.log(tareas.rows);

        var n = Object.keys(tareas.rows).length;
        for(var i=0; i < n; i++){
            idmaterias.push(tareas.rows[i].idm);
            tarease.push(tareas.rows[i].nombret);
        }
        console.log(tarease);
        //</TAREAS>

        res.render("miscursos", {materias: idmaterias, tareas: tarease});
    })()
    //res.send("Hola mundo");
});


app.post("/tareasestudiante", (req, res) => {
    //para guardar las tareas por alumno
    console.log("MOSTRAR TAREAS POR ALUMNO");
    //res.send("Recibiendo datos");
    console.log(req.body.cialumno);
    var tareas = [];
    var nombretareas = [];
    var notatareas = [];
    var notafinal = 0;
    //listamos las tareas del estudiante
    Tarea.find({ciest: req.body.cialumno, idmateria: req.body.idm}, (err, doc) => {
        console.log("TAREAS>>>");
        console.log(req.body.nombre);
        //numero de tareas
        var ntareas = doc.length;
        for(var j=0; j<ntareas; j++){
            //añadir las tareas a un arreglo
            tareas.push(doc[j].nombredocumento);
            nombretareas.push(doc[j].nombretarea);
            notatareas.push(doc[j].calificacion);
            
            //llamar un web services para obtener la suma de la nota)
            notafinal += parseInt(doc[j].calificacion, 10);
            
            /*
            service.useService(http://www.dneonline.com/calculator.asmx?wsdl,
                "AddService");
            service.AddService.callService("Add", notafinal, parseInt(doc[j].calificacion, 10));
            notafinal=event.result.value;*/
        }

        /*
        var data = new FormData();
        data.append('ci', req.body.cialumno);
        data.append('idm', req.body.idm);
        fetch('http://127.0.0.1:5000/notafinalusuario', {
            method: 'POST',
            body: data
        })
        .then((response) => {
            notafinal = parseInt(response.notafinal, 10);
        })
        */
        

        console.log(tareas);
        console.log(nombretareas);
        res.render("estudiante", {tareas: tareas, nombretareas: nombretareas, calificaciones: notatareas, notafinal: notafinal});
    });
});


app.post("/calificar", (req, res) => {
    console.log(req.body.nombretarea);
    console.log(req.body.nota);
    //modificar la nota de la tarea x en mongo
    Tarea.updateOne({nombredocumento: req.body.nombretarea}, {$set: {calificacion: req.body.nota}}, function(err, doc) {
        if (err) throw err;
        res.send("Tarea calificada");
    });
});
//</TAREA ESTUDIANTE>


//</RENDERIZADO>

//<iniciar Servidor>
app.listen(port, host, () => {
    console.log(`Server app listening in http://${host}:${port}`);
});
//</iniciar Servidor>







