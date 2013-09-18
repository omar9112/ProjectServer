// Express is the web framework 
var express = require('express');
var app = express();
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

app.configure(function () {
  app.use(allowCrossDomain);
});


app.use(express.bodyParser());

var product = require("./product.js");
var Product = product.Product;

var productList = new Array(
	new Product("iPhone 5S", "A1429", "600", "200", "New"),
	new Product("Samsung Galaxy S4", "550", "300", "test", "New"),
	new Product("HTC One", "test", "500", "100", "Used"),
	new Product("Nexus 4", "LG-E960", "300", "150", "Refurbished"),
	new Product("LG G2", "LG-D820", "400", "200", "New")	
);
 var productNextId = 0;
 
for (var i=0; i < productList.length;++i){
	productList[i].id = productNextId++;
}
// REST Operations
// Idea: Data is created, read, updated, or deleted through a URL that 
// identifies the resource to be created, read, updated, or deleted.
// The URL and any other input data is sent over standard HTTP requests.
// Mapping of HTTP with REST 
// a) POST - Created a new object. (Database create operation)
// b) GET - Read an individual object, collection of object, or simple values (Database read Operation)
// c) PUT - Update an individual object, or collection  (Database update operation)
// d) DELETE - Remove an individual object, or collection (Database delete operation)

// REST Operation - HTTP GET to read all products
app.get('/ProjectServer/products', function(req, res) {
	console.log("GET");
	//var tom = {"make" : "Ford", "model" : "Escape", "year" : "2013", "description" : "V4 engine, 30mpg, Gray", "price" : "$18,000"};
	//var tom = new Product("Ford", "Escape", "2013", "V4 engine, 30mpg, Gray", "$18,000");
	//console.log("tom: " + JSON.stringify(tom));
	var response = {"products" : productList};
  	res.json(response);
});

// REST Operation - HTTP GET to read a product based on its id
app.get('/ProjectServer/products/:id', function(req, res) {
	var id = req.params.id;
		console.log("GET product: " + id);

	if ((id < 0) || (id >= productNextId)){
		// not found
		res.statusCode = 404;
		res.send("Product not found.");
	}
	else {
		var target = -1;
		for (var i=0; i < productList.length; ++i){
			if (productList[i].id == id){
				target = i;
				break;	
			}
		}
		if (target == -1){
			res.statusCode = 404;
			res.send("Product not found.");
		}
		else {
			var response = {"product" : productList[target]};
  			res.json(response);	
  		}	
	}
});

// REST Operation - HTTP PUT to updated a product based on its id
app.put('/ProjectServer/products/:id', function(req, res) {
	var id = req.params.id;
		console.log("PUT product: " + id);

	if ((id < 0) || (id >= productNextId)){
		// not found
		res.statusCode = 404;
		res.send("Product not found.");
	}
	else if(!req.body.hasOwnProperty('name') || !req.body.hasOwnProperty('model')
  	|| !req.body.hasOwnProperty('bidPrice') || !req.body.hasOwnProperty('instantPrice') || !req.body.hasOwnProperty('description')) {
    	res.statusCode = 400;
    	return res.send('Error: Missing fields for product.');
  	}
	else {
		var target = -1;
		for (var i=0; i < productList.length; ++i){
			if (productList[i].id == id){
				target = i;
				break;	
			}
		}
		if (target == -1){
			res.statusCode = 404;
			res.send("Product not found.");			
		}	
		else {
			var theProduct= productList[target];
			theProduct.name = req.body.name;
			theProduct.model = req.body.model;
			theProduct.bidPrice = req.body.bidPrice;
			theProduct.instantPrice = req.body.instantPrice;
			theProduct.description = req.body.description;
			var response = {"product" : theProduct};
  			res.json(response);		
  		}
	}
});

// REST Operation - HTTP DELETE to delete a product based on its id
app.del('/ProjectServer/products/:id', function(req, res) {
	var id = req.params.id;
		console.log("DELETE product: " + id);

	if ((id < 0) || (id >= productNextId)){
		// not found
		res.statusCode = 404;
		res.send("Product not found.");
	}
	else {
		var target = -1;
		for (var i=0; i < productList.length; ++i){
			if (productList[i].id == id){
				target = i;
				break;	
			}
		}
		if (target == -1){
			res.statusCode = 404;
			res.send("Product not found.");			
		}	
		else {
			productList.splice(target, 1);
  			res.json(true);
  		}		
	}
});

// REST Operation - HTTP POST to add a new a product
app.post('/ProjectServer/products', function(req, res) {
	console.log("POST");

  	if(!req.body.hasOwnProperty('name') || !req.body.hasOwnProperty('model')
  	|| !req.body.hasOwnProperty('bidPrice') || !req.body.hasOwnProperty('instantPrice') || !req.body.hasOwnProperty('description')) {
    	res.statusCode = 400;
    	return res.send('Error: Missing fields for product.');
  	}

  	var newProduct = new Product(req.body.name, req.body.model, req.body.bidPrice, req.body.description, req.body.instantPrice);
  	console.log("New Product: " + JSON.stringify(newProduct));
  	newProduct.id = productNextId++;
  	productList.push(newProduct);
  	res.json(true);
});


// Server starts running when listen is called.
app.listen(process.env.PORT || 3412);
console.log("server listening");
