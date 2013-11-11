// Express is the web framework
var flash = require('connect-flash')
  , express = require('express')
  , passport = require('passport')
  , util = require('util')
  , LocalStrategy = require('passport-local').Strategy
  , pg = require('pg').native;
  
var app = express();
var conString = "pg://fjupgmyvemqepn:cubKJkYRU__l8azH1vtHXngBjJ@ec2-54-204-17-24.compute-1.amazonaws.com:5432/da7jluqsdd1u63";

var currentUser = {};

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

function findById(id, fn) {
  var client = new pg.Client(conString);
  client.connect();
  var query = client.query("SELECT * FROM customer where uid = $1", [id]);

  query.on("row", function (row, result) {
      result.addRow(row);
  });
  query.on("end", function (result) {
    var len = result.rows.length;
    if (len == 0){
      fn(new Error('User ' + id + ' does not exist'));
    }
    else {  
        // var response = {"user" : result.rows[0]};
        // currentUser = result.rows[0];
        var user = result.rows[0];
        currentUser = result.rows[0];
        console.log("GET username by Id: " + result.rows[0].username);
        console.log("GET password by Id: " + result.rows[0].upassword);
        client.end();
         fn(null, result.rows[0]);
        
      }
  });
  
}

function findByUsername(username, password, fn) {
  var client = new pg.Client(conString);
  client.connect();

  var query = client.query("SELECT * FROM customer where username = $1 AND upassword = $2", [username, password]);

  query.on("row", function (row, result) {
      result.addRow(row);
  });
  query.on("end", function (result) {
    var len = result.rows.length;
    if (len == 0){
      return fn(null, null);
    }
    else {  
        // var response = {"user" : result.rows[0]};
        currentUser = result.rows[0];
        var user = result.rows[0];
        console.log("GET username: " + result.rows[0].username);
        console.log("GET password: " + result.rows[0].upassword);
        client.end();
        return fn(null, user);
        
      }
  });
}


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.uid);
});

passport.deserializeUser(function(uid, done) {
  findById(uid, function (err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, password, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
//         if (user.upassword != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      });
    });
  }
));


// configure Express
app.configure(function() {
  app.use(express.logger());
  app.use(express.cookieParser('shhhh, very secret'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/../../public'));
});

app.get('/', ensureAuthenticated, function(req, res){
  // res.redirect('http://127.0.0.1:8020/ICOM-5016/ProjectClient/index.html');
  res.redirect('http://joevirella.brinkster.net/');
});

// app.get('/account', ensureAuthenticated, function(req, res){
  // res.render('account', { user: req.user });
// 
// });

app.get('/login', function(req, res){
	res.redirect('http://127.0.0.1:8020/ICOM-5016/ProjectClient/login.html');
	// res.redirect('http://joevirella.brinkster.net/login.html');
});

// POST /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
//
//   curl -v -d "username=bob&password=secret" http://127.0.0.1:3000/login
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  function(req, res) {
  	res.redirect('http://127.0.0.1:8020/ICOM-5016/ProjectClient/index.html');
  	// res.redirect('http://joevirella.brinkster.net/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

var product = require("./product.js");
var Product = product.Product;

// Database connection string: pg://<username>:<password>@host:port/dbname 
// var conString = "pg://omar91:000569@localhost:5432/kiwidb";
// var conString = "pg://fjupgmyvemqepn:cubKJkYRU__l8azH1vtHXngBjJ@ec2-54-204-17-24.compute-1.amazonaws.com:5432/da7jluqsdd1u63";


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
app.get('/ProjectServer/currentUser', function(req, res) {
	console.log("GET");
	
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT * " +
							 "FROM customer NATURAL JOIN mailingaddress NATURAL JOIN phonenumber " +
							 "WHERE uid = $1", [currentUser.uid]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var response = {"user" : result.rows};
		client.end();
  		res.json(response);
 	});
});

app.get('/ProjectServer/currentUserCart', function(req, res) {
	console.log("GET");
	
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT product.pid, pname, pmodel, pbrand, pcondition, ppricemethod, pprice, pdescription " +
							  "FROM (customer NATURAL JOIN shoppingcart), product " +
							  "WHERE shoppingcart.pid = product.pid " +
							  		"AND customer.uid = $1", [currentUser.uid]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var response = {"shoppingcart" : result.rows};
		client.end();
  		res.json(response);
 	});
});

// REST Operation - HTTP GET to read a product based on its id
app.get('/ProjectServer/currentProductSeller/:id', function(req, res) {
	var id = req.params.id;
	console.log("GET product: " + id);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT * " +
							 "FROM customer NATURAL JOIN mailingaddress " +
							 "WHERE uid = $1", [id]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("Current seller not found.");
		}
		else {	
  			var response = {"seller" : result.rows[0]};
			client.end();
  			res.json(response);
  		}
 	});
});

// REST Operation - HTTP GET to read all products
app.get('/ProjectServer/products', function(req, res) {
	console.log("GET");
	
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT * " +
							 "FROM product NATURAL LEFT JOIN auction NATURAL LEFT JOIN " +
							 "(SELECT auctionid, count(auctionid) as numberofbids " +
							 "FROM auction NATURAL JOIN bids " + 
							 "GROUP BY auctionid) as A " +
							 "WHERE pid in (select pid " +
	      					 	"FROM sale UNION (select pid " +
			        							"FROM auction))");
	
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
	
	var query = client.query("SELECT * " +
							 "FROM product NATURAL LEFT JOIN auction NATURAL LEFT JOIN " +
							 "(SELECT auctionid, count(auctionid) as numberofbids " +
							 "FROM auction NATURAL JOIN bids " + 
							 "GROUP BY auctionid) as A " +
							 "WHERE pid in (select pid " +
	      					 	"FROM sale UNION (select pid " +
			        							"FROM auction))" +
			        							"AND pid = $1 ", [id]);
	
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

// REST Operation - HTTP GET to read a product based on its id
app.get('/ProjectServer/bidderList/:id', function(req, res) {
	var id = req.params.id;
	console.log("GET bidderList: " + id);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT username, userbidprice, userbidtime " +
							 "FROM bids NATURAL JOIN customer NATURAL JOIN auction " +
							 "WHERE pid = $1 " +
							 "ORDER BY userbidprice desc", [id]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("List not found.");
		}
		else {	
  			var response = {"bidderList" : result.rows};
			client.end();
  			res.json(response);
  		}
 	});
});

// REST Operation - HTTP GET to read a product based on its id
app.get('/ProjectServer/saleHistory/:id', function(req, res) {
	var id = req.params.id;
	console.log("GET product: " + id);

	var client = new pg.Client(conString);
	client.connect();
	
	var query = client.query("SELECT * " +
							 "FROM product NATURAL JOIN customerorder " +
							 "WHERE sellerid = $1 ", [id]);
	
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
  			var response = {"saleHistory" : result.rows[0]};
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

var usercopy = require("./user.js");
var User = usercopy.User;

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

// REST Operation - HTTP GET to read all products
app.get('/ProjectServer/itemsforsale/:id', function(req, res) {
	var id = req.params.id;
	console.log("GET");
	
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT * " +
							 "FROM product NATURAL LEFT JOIN auction NATURAL LEFT JOIN " +
							 "(SELECT auctionid, count(auctionid) as numberofbids " +
							 "FROM auction NATURAL JOIN bids " + 
							 "GROUP BY auctionid) as A " +
							 "WHERE pid in (select pid " +
	      					 	"FROM sale UNION (select pid " +
			        							"FROM auction))" +
			        			"AND sellerid = $1", [id]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var response = {"itemsForSale" : result.rows};
		client.end();
  		res.json(response);
 	});
});


app.get('/ProjectServer/saleHistory/:id', function(req, res) {
	var id = req.params.id;
	console.log("GET");
	
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT * " +
							 "FROM customerorder NATURAL JOIN product " +
			        		 "WHERE sellerid = $1", [id]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var response = {"saleHistory" : result.rows};
		client.end();
  		res.json(response);
 	});
});

/*
 * ################################## CATEGORY ##################################
 */

var category = require("./category.js");
var Category = category.Category;

// REST Operations
// Idea: Data is created, read, updated, or deleted through a URL that 
// identifies the resource to be created, read, updated, or deleted.
// The URL and any other input data is sent over standard HTTP requests.
// Mapping of HTTP with REST 
// a) POST - Created a new object. (Database create operation)
// b) GET - Read an individual object, collection of object, or simple values (Database read Operation)
// c) PUT - Update an individual object, or collection  (Database update operation)
// d) DELETE - Remove an individual object, or collection (Database delete operation)

// REST Operation - HTTP GET to read a product based on its category
app.get('/ProjectServer/categories/:category', function(req, res) {
	var category = req.params.category;
	console.log("GET product from: " + category);

	var client = new pg.Client(conString);
	client.connect();
	
	var query = client.query("SELECT *, to_char(penddate, 'HH12:MI:SS') " +
							 "FROM product NATURAL LEFT JOIN auction NATURAL LEFT JOIN " +
							 "(SELECT auctionid, count(auctionid) as numberofbids " +
							 "FROM auction NATURAL JOIN bids " + 
							 "GROUP BY auctionid) as A NATURAL JOIN hasCategory " +
							 "WHERE pid in (select pid " +
	      					 	"FROM sale UNION (select pid " +
			        							"FROM auction)) " +
			        							"AND categoryname = $1", [category]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("Category not found.");
		}
		else {	
  			var response = {"category" : result.rows};
			client.end();
  			res.json(response);
  		}
 	});
});

// REST Operation - HTTP GET to read a product based on its category
app.get('/ProjectServer/reportList/:reportDate', function(req, res) {
	var reportDate = req.params.reportDate;
	console.log("GET product from: " + reportDate);

	var client = new pg.Client(conString);
	client.connect();
	
	var query = client.query("SELECT * " +
							 "FROM customerorder JOIN product USING(pid) " +
							 "WHERE orderdate = $1 ", [reportDate]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("report date not found.");
		}
		else {	
  			var response = {"reportList" : result.rows};
			client.end();
  			res.json(response);
  		}
 	});
});

app.get('/ProjectServer/recentFeedback/:id', function(req, res) {
	var id = req.params.id;
	console.log("GET product from: " + id);

	var client = new pg.Client(conString);
	client.connect();
	
	var query = client.query("SELECT reviewGiven.reviewid, reviewGiven.uid as uidr, customer.fname as fnameR, customer.lname as lnameR, customer.username as usernamer, reviewGiven.uidg, reviewGiven.fnameG, reviewGiven.lnameG, reviewGiven.usernameg, reviewGiven.subject, reviewGiven.feedback, reviewGiven.rating, reviewGiven.ratedate " +
							 "FROM " +
							 "(select review.reviewid, customer.fname as fnameG, customer.lname as lnameG, customer.username as usernameg, review.subject, review.feedback, review.rating, review.uid as uid, review.reviewgivenby as uidG, review.ratedate " +
							 "from customer, review " + 
							 "where customer.uid = review.reviewgivenby) as reviewGiven " +
	      					 "join customer using(uid) " +
			        							"where reviewGiven.uid = $1", [id]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("Category not found.");
		}
		else {	
  			var response = {"feedbackList" : result.rows};
			client.end();
  			res.json(response);
  		}
 	});
});

app.get('/ProjectServer/orderCategoryBy/:category/:orderType', function(req, res) {
	var category = req.params.category;
	var orderType = req.params.orderType;
	console.log("GET product from: " + orderType);

	var client = new pg.Client(conString);
	client.connect();
	
	var query = client.query("SELECT *, GREATEST(pprice, currentbidprice) AS price " +
							 "FROM product NATURAL LEFT JOIN auction NATURAL LEFT JOIN " +
							 "(SELECT auctionid, count(auctionid) as numberofbids " +
							 "FROM auction NATURAL JOIN bids " + 
							 "GROUP BY auctionid) as A NATURAL JOIN hasCategory " +
							 "WHERE pid in (select pid " +
	      					 	"FROM sale UNION (select pid " +
			        							"FROM auction)) " +
			        							"AND categoryname = $1 " +
			        		 "ORDER BY " + orderType, [category]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("Category not found.");
		}
		else {	
  			var response = {"orderType" : result.rows};
			client.end();
  			res.json(response);
  		}
 	});
});

app.get('/ProjectServer/orderSearchPage/:orderType', function(req, res) {
	var orderType = req.params.orderType;
	console.log("GET product from: " + orderType);

	var client = new pg.Client(conString);
	client.connect();
	
	var query = client.query("SELECT *, GREATEST(pprice, currentbidprice) AS price " +
							 "FROM product NATURAL LEFT JOIN auction NATURAL LEFT JOIN " +
							 "(SELECT auctionid, count(auctionid) as numberofbids " +
							 "FROM auction NATURAL JOIN bids " + 
							 "GROUP BY auctionid) as A " +
							 "WHERE pid in (select pid " +
	      					 	"FROM sale UNION (select pid " +
			        							"FROM auction)) " +
			        		 "ORDER BY " + orderType);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("Category not found.");
		}
		else {	
  			var response = {"orderType" : result.rows};
			client.end();
  			res.json(response);
  		}
 	});
});

// Server starts running when listen is called.
app.listen(process.env.PORT || 3412);
console.log("server listening");
