const express = require("express");

var router = express.Router();//Manejo de imagenes

//<MANEJO DE IMAGENES>
//formulario para añadir imagen
router.get("/imagenes/new", function(req, res){

})
//editar
router.get("/imagenes/:id/edit", function(req, res){

})

router.route("/imagenes/:id")
    //mostrar la imagen basado en el id
    .get(function(req, res){

    })
    //actualizar
    .put(function(req, res){

    })
    //eliminar
    .delete(function(req, res){

    });
router.route("/imagenes")
    //obtener todas las imagenes
    .get(function(req, res){

    })
    //crear una nueva imagen
    .post(function(req, res){

    });
//<MANEJO DE IMAGENES>

module.exports = router;