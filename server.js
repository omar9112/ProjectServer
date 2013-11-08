// Express is the web framework
var express = require('express');
// var pg = require('pg');
var app = express();
var pg = require('pg');

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
app.use(express.cookieParser('shhhh, very secret'));
app.use(express.session());

function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}
 
// app.get('/', function(request, response) {
   // response.redirect('http://10.0.1.20:8020/ICOM-5016/ProjectClient/index.html');
// });
 
app.get('/login', function(request, response) {
   response.redirect('http://10.0.1.20:8020/ICOM-5016/ProjectClient/login.html');
});
 
app.post('/login', function(request, response) {
 
    var username = request.body.username;
    var password = request.body.password;
 
    if(username == 'demo' && password == 'demo'){
        request.session.regenerate(function(){
        request.session.user = username;
        response.redirect('http://10.0.1.20:8020/ICOM-5016/ProjectClient/index.html');
        });
    }
    else {
       response.redirect('/login');
    }    
});
 
app.get('/logout', function(request, response){
    request.session.destroy(function(){
        response.redirect('/');
    });
});
 
app.get('/', restrict, function(request, response){
  // response.send('This is the restricted area! Hello ' + request.session.user + '! click <a href="/logout">here to logout</a>');
});

var product = require("./product.js");
var Product = product.Product;

// Database connection string: pg://<username>:<password>@host:port/dbname 
// var conString = "pg://omar91:000569@localhost:5432/kiwidb";
var conString = "pg://fjupgmyvemqepn:cubKJkYRU__l8azH1vtHXngBjJ@ec2-54-204-17-24.compute-1.amazonaws.com:5432/da7jluqsdd1u63";


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
	
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT * from product");
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var response = {"products" : result.rows};
		client.end();
  		res.json(response);
 	});
});

// REST Operation - HTTP GET to read a product based on its id
app.get('/ProjectServer/products/:id', function(req, res) {
	var id = req.params.id;
	console.log("GET product: " + id);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT * from product where pid = $1", [id]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("Product not found.");
		}
		else {	
  			var response = {"product" : result.rows[0]};
			client.end();
  			res.json(response);
  		}
 	});
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
	else if(!req.body.hasOwnProperty('name') || !req.body.hasOwnProperty('model') || !req.body.hasOwnProperty('brand')
  	|| !req.body.hasOwnProperty('category') || !req.body.hasOwnProperty('condition') || !req.body.hasOwnProperty('priceMethod')
  	|| !req.body.hasOwnProperty('price') || !req.body.hasOwnProperty('description')) {
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
			theProduct.brand = req.body.brand;
			theProduct.category = req.body.category;
			theProduct.condition = req.body.condition;
			theProduct.priceMethod = req.body.priceMethod;
			theProduct.price = req.body.price;
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

  	if(!req.body.hasOwnProperty('name') || !req.body.hasOwnProperty('model') || !req.body.hasOwnProperty('brand')
  	|| !req.body.hasOwnProperty('category') || !req.body.hasOwnProperty('condition') || !req.body.hasOwnProperty('priceMethod')
  	|| !req.body.hasOwnProperty('price') || !req.body.hasOwnProperty('description')) {
    	res.statusCode = 400;
    	return res.send('Error: Missing fields for product.');
  	}

  	var newProduct = new Product(req.body.name, req.body.model, req.body.brand, req.body.category, 
  								 req.body.condition, req.body.priceMethod, req.body.price, req.body.description);
  	console.log("New Product: " + JSON.stringify(newProduct));
  	newProduct.id = productNextId++;
  	productList.push(newProduct);
  	res.json(true);
});


/*
 * ################################## USER ##################################
 */

var user = require("./user.js");
var User = user.User;

var userList = new Array(
	new User("christian.montes", "ICOM-5016", "Christian", "Montes", "calle Amazonas", "Ponce", "PR", "00728", "calle Amazonas", "Ponce", "PR", "00728", "7872315270", "chris.omar91@me.com" , 5)	
);
 var userNextId = 0;
 
for (var i=0; i < userList.length;++i){
	userList[i].id = userNextId++;
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

// REST Operation - HTTP GET to read all users
app.get('/ProjectServer/users', function(req, res) {
	console.log("GET");
	var response = {"users" : userList};
  	res.json(response);
});

// REST Operation - HTTP GET to read a user based on its id
app.get('/ProjectServer/users/:id', function(req, res) {
	var id = req.params.id;
		console.log("GET user: " + id);

	if ((id < 0) || (id >= userNextId)){
		// not found
		res.statusCode = 404;
		res.send("User not found.");
	}
	else {
		var target = -1;
		for (var i=0; i < userList.length; ++i){
			if (userList[i].id == id){
				target = i;
				break;	
			}
		}
		if (target == -1){
			res.statusCode = 404;
			res.send("User not found.");
		}
		else {
			var response = {"user" : userList[target]};
  			res.json(response);	
  		}	
	}
});

// REST Operation - HTTP PUT to updated a user based on its id
app.put('/ProjectServer/users/:id', function(req, res) {
	var id = req.params.id;
		console.log("PUT user: " + id);

	if ((id < 0) || (id >= userNextId)){
		// not found
		res.statusCode = 404;
		res.send("User not found.");
	}
	else if(!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password') || !req.body.hasOwnProperty('firstName')
	|| !req.body.hasOwnProperty('lastName') || !req.body.hasOwnProperty('streetMailingAddress') || !req.body.hasOwnProperty('cityMailingAddress')
	|| !req.body.hasOwnProperty('stateMailingAddress') || !req.body.hasOwnProperty('zipMailingAddress') || !req.body.hasOwnProperty('streetBillingAddress')
	|| !req.body.hasOwnProperty('cityBillingAddress') || !req.body.hasOwnProperty('stateBillingAddress') || !req.body.hasOwnProperty('zipBillingAddress')
	|| !req.body.hasOwnProperty('telephone') || !req.body.hasOwnProperty('email') ) {
    	res.statusCode = 400;
    	return res.send('Error: Missing fields for user.');
  	}
	else {
		var target = -1;
		for (var i=0; i < userList.length; ++i){
			if (userList[i].id == id){
				target = i;
				break;	
			}
		}
		if (target == -1){
			res.statusCode = 404;
			res.send("User not found.");			
		}	
		else {
			var theUser= userList[target];
			theUser.username = req.body.username;
			theUser.password = req.body.password;
			theUser.firstName = req.body.firstName;
			theUser.lastName = req.body.lastName;
			theUser.streetMailingAddress = req.body.streetMailingAddress;
			theUser.cityMailingAddress = req.body.cityMailingAddress;
			theUser.stateMailingAddress = req.body.stateMailingAddress;
			theUser.zipMailingAddress = req.body.zipMailingAddress;
			theUser.streetBillingAddress = req.body.streetBillingAddress;
			theUser.cityBillingAddress = req.body.cityBillingAddress;
			theUser.stateBillingAddress = req.body.stateBillingAddress;
			theUser.zipBillingAddress = req.body.zipBillingAddress;
			theUser.telephone = req.body.telephone;
			theUser.email = req.body.email;
			theUser.rating = req.body.rating;
			var response = {"user" : theUser};
  			res.json(response);		
  		}
	}
});

// REST Operation - HTTP DELETE to delete a user based on its id
app.del('/ProjectServer/users/:id', function(req, res) {
	var id = req.params.id;
		console.log("DELETE user: " + id);

	if ((id < 0) || (id >= userNextId)){
		// not found
		res.statusCode = 404;
		res.send("User not found.");
	}
	else {
		var target = -1;
		for (var i=0; i < userList.length; ++i){
			if (userList[i].id == id){
				target = i;
				break;	
			}
		}
		if (target == -1){
			res.statusCode = 404;
			res.send("User not found.");			
		}	
		else {
			userList.splice(target, 1);
  			res.json(true);
  		}		
	}
});

// REST Operation - HTTP POST to add a new a user
app.post('/ProjectServer/users', function(req, res) {
	console.log("POST");

  	if(!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password') || !req.body.hasOwnProperty('firstName')
	|| !req.body.hasOwnProperty('lastName') || !req.body.hasOwnProperty('streetMailingAddress') || !req.body.hasOwnProperty('cityMailingAddress')
	|| !req.body.hasOwnProperty('stateMailingAddress') || !req.body.hasOwnProperty('zipMailingAddress') || !req.body.hasOwnProperty('streetBillingAddress')
	|| !req.body.hasOwnProperty('cityBillingAddress') || !req.body.hasOwnProperty('stateBillingAddress') || !req.body.hasOwnProperty('zipBillingAddress')
	|| !req.body.hasOwnProperty('telephone') || !req.body.hasOwnProperty('email')){
    	res.statusCode = 400;
    	return res.send('Error: Missing fields for user.');
  	}

  	var newUser = new User(req.body.username, req.body.password, req.body.firstName, req.body.lastName,
  		req.body.streetMailingAddress, req.body.cityMailingAddress, req.body.stateMailingAddress,
  		req.body.zipMailingAddress, req.body.streetBillingAddress, req.body.cityBillingAddress ,
  		req.body.stateBillingAddress, req.body.zipBillingAddress, req.body.telephone, req.body.email, 0);
  	console.log("New User: " + JSON.stringify(newUser));
  	newUser.id = userNextId++;
  	userList.push(newUser);
  	res.json(true);
});

/*
 * ################################## CATEGORY ##################################
 */

var category = require("./category.js");
var Category = category.Category;

var categoryList = new Array(
	new Category("phones")	
);
 var categoryNextId = 0;
 
for (var i=0; i < categoryList.length;++i){
	categoryList[i].id = categoryNextId++;
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

// // REST Operation - HTTP GET to read all categories
// app.get('/ProjectServer/categories', function(req, res) {
	// console.log("GET categories");
	// var response = {"categories" : categoryList};
  	// res.json(response);
// });

// REST Operation - HTTP GET to read all products from a category
app.get('/ProjectServer/categories', function(req, res) {
	console.log("GET categories");
	
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT * from category");
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var response = {"categories" : result.rows};
		client.end();
  		res.json(response);
 	});
});

// REST Operation - HTTP GET to read a product based on its category
app.get('/ProjectServer/categories/:category', function(req, res) {
	var category = req.params.category;
	console.log("GET product from: " + category);

	var client = new pg.Client(conString);
	client.connect();

	// var query = client.query("SELECT * from product natural join category where category_name = $1", [category]);
	var query = client.query("SELECT * from product natural join category where $1 = any (category_name)", [category]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("Product not found.");
		}
		else {	
  			var response = {"categories" : result.rows};
			client.end();
  			res.json(response);
  		}
 	});
});

// Server starts running when listen is called.
app.listen(process.env.PORT || 3412);
console.log("server listening");
