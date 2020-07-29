const mongoose = require('mongoose');

//<mongoose>
mongoose.connect("mongodb://Parker:Pi.123@127.0.0.1/colegio?authSource=admin", {useNewUrlParser: true, useUnifiedTopology: true});
//</mongoose>

//<verificacion DB>
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection mongo error: '));
db.once('open', () => {
    console.log('Database Mongo connection OK!');
})
//</verificacion DB>

//<mongose para Schema>
var Schema = mongoose.Schema;
//</mongose para Schema>

//<Schema Usuario>
var usuarioSchemaJSON = {
    usuario: String,
    password: String,
    rol: String
}
var usuario_schema = new Schema(usuarioSchemaJSON);
//COLLECTION
var Usuario = mongoose.model("usuarios", usuario_schema); //nombre collection
//exportar Usuario
module.exports.Usuario = Usuario;
//</Schema Usuario>

//<ESQUEMA PARA TAREA>
var tareaSchemaJSON = {
    ciest: String,
    idmateria: String,
    nombretarea: String,
    calificacion: String,
    nombredocumento: String
}
var tarea_schema = new Schema(tareaSchemaJSON);
var Tarea = mongoose.model("tareas", tarea_schema);
module.exports.Tarea = Tarea;
//</ESQUEMA PARA TAREA>