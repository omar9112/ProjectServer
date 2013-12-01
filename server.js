// Express is the web framework 
var express = require('express');
var pg = require('pg').native;
var app = express();
  
// Database connection string: pg://<username>:<password>@host:port/dbname 
var conString = "pg://fjupgmyvemqepn:cubKJkYRU__l8azH1vtHXngBjJ@ec2-54-204-17-24.compute-1.amazonaws.com:5432/da7jluqsdd1u63";

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

// configure Express
app.configure(function() {
  app.use(express.bodyParser());
});

var product = require("./product.js");
var Product = product.Product;


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
app.get('/ProjectServer/currentUser/:uid', function(req, res) {
	var uid = req.params.uid;
	
	var client = new pg.Client(conString);
	client.connect();
							 
	var query = client.query("SELECT uid, username, upassword, fname, lname, email, " +
									"COALESCE(totalreviews, 0) as totalreviews, COALESCE(review.rating, 0) as rating, " +
									"COALESCE(positive, 0) as positive, COALESCE(neutral, 0) as neutral, COALESCE(negative, 0) as negative," +
									"COALESCE(rdescribed, 0) as rdescribed, COALESCE(rcommunication, 0) as rcommunication, " + 
									"COALESCE(rstime, 0) as rstime, COALESCE(rscharges, 0) as rscharges, " +
									"COALESCE(tdescribed, 0) as tdescribed, COALESCE(tcommunication, 0) as tcommunication, " +
									"COALESCE(tstime, 0) as tstime, COALESCE(tscharges, 0) as tscharges, " +
									"COALESCE(itemincart, 0) as itemincart, COALESCE(buying, 0) as buying, " +
									"COALESCE(itemselling, 0) as itemselling,  administrator, " +
									"namema, streetma, cityma, statema, zipma, phonenumber " +
							"FROM (SELECT COUNT(pid) AS buying, buyerid AS uid " +
	 							  "FROM product FULL OUTER JOIN customerorder USING (orderid) " +
	 							  "GROUP BY buyerid) AS itembuying " +
	 							  "FULL OUTER JOIN customer USING(uid) FULL OUTER JOIN (SELECT * FROM hasmailingaddress WHERE primaryoption = 'true') " +
	 							  "as hasmailingaddress USING(uid) FULL OUTER JOIN mailingaddress using(maddressid) FULL OUTER JOIN " +
	 							  "(select * from phonenumber  where primaryoption = 'true') as phonenumber using(uid) " +
	 							  "FULL OUTER JOIN (SELECT uid, count(reviewid) as totalreviews, avg(rating) as rating, avg(ratingdescribed) as rdescribed, " +
									"avg(ratingcommunication) as rcommunication, avg(ratingstime) as rstime, avg(ratingscharges) as rscharges, " +
									"count(ratingdescribed) as tdescribed, count(ratingcommunication) as tcommunication, count(ratingstime) as tstime, " +
									"count(ratingscharges) as tscharges, " +
									"sum(case when reviewtype = 'Positive' then 1 else 0 end) as positive, " +
									"sum(case when reviewtype = 'Neutral' then 1 else 0 end) as neutral, " +
									"sum(case when reviewtype = 'Negative' then 1 else 0 end) as negative " +
									"FROM review " +
									"GROUP BY uid) as review using(uid) " +
								  "NATURAL LEFT JOIN " +
								 "(SELECT sellerid AS uid, count(sellerid) as itemSelling " +
							"FROM product NATURAL LEFT JOIN auction NATURAL LEFT JOIN " +
							"(SELECT auctionid, COUNT(auctionid) AS numberofbids " +
							"FROM auction NATURAL JOIN bids " +
							"GROUP BY auctionid) AS A " +
							"WHERE pid IN (SELECT pid " +
						      "FROM sale UNION (SELECT pid " +
								        "FROM auction)) " +
								        "GROUP BY sellerid) AS selling NATURAL JOIN (SELECT uid, COUNT(pid) AS itemincart " +
					"FROM customer NATURAL LEFT JOIN shoppingcart " +
					"GROUP BY uid) AS shoppingcart2 " +
							 "WHERE uid = $1", [uid]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("User not found.");
		}
		else {	
  			var response = {"currentUser" : result.rows[0]};
			client.end();
  			res.json(response);
  		}
 	});
});



app.get('/ProjectServer/currentUserCart/:id', function(req, res) {
	var id = req.params.id;
	console.log("GET");
	
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT product.pid, pname, pmodel, pbrand, pcondition, ppricemethod, pprice, pdescription, sellerid, penddate " +
							  "FROM (customer NATURAL JOIN shoppingcart), product " +
							  "WHERE shoppingcart.pid = product.pid " +
							  		"AND customer.uid = $1", [id]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("Cart not found.");
		}
		else {	
			var response = {"shoppingcart" : result.rows};
			client.end();
	  		res.json(response);
	  }
 	});
});

// REST Operation - HTTP GET to read a product based on its id
app.get('/ProjectServer/user/:username/:password', function(req, res) {
	var username = req.params.username;
	var password = req.params.password;

	console.log("GET user: " + username + ", " + password);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT uid " +
							 "FROM customer " +
							 "WHERE username = $1 AND upassword = $2", [username, password]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("User not found.");
		}
		else {	
  			var response = {"user" : result.rows[0]};
			client.end();
  			res.json(response);
  		}
 	});
});

// REST Operation - HTTP GET to read all categories
app.get('/ProjectServer/categories', function(req, res) {
	console.log("GET categories");
	
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT * " +
							 "FROM category ");
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var response = {"categories" : result.rows};
		client.end();
  		res.json(response);
 	});
});


// REST Operation - HTTP GET to read all products
app.get('/ProjectServer/searchResults/:searchInput', function(req, res) {
	var searchInput = req.params.searchInput;
	console.log("GET product search results: " + searchInput);
	
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT * " +
							 "FROM product NATURAL LEFT JOIN auction NATURAL LEFT JOIN " +
							 "(SELECT auctionid, count(auctionid) as numberofbids " +
							 "FROM auction NATURAL JOIN bids " + 
							 "GROUP BY auctionid) as A " +
							 "WHERE pid in (select pid " +
	      					 	"FROM sale UNION (select pid " +
			        							"FROM auction)) " +
			        		 "AND pname ilike '%" + searchInput + "%'");
	
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
	
	var query = client.query("SELECT DISTINCT ON (pid) * " +
							 "FROM product NATURAL LEFT JOIN auction NATURAL LEFT JOIN " +
							 "(SELECT auctionid, count(auctionid) as numberofbids " +
							 "FROM auction NATURAL JOIN bids " + 
							 "GROUP BY auctionid) as A NATURAL JOIN hasCategory " +
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
app.get('/ProjectServer/bidderList/:pid', function(req, res) {
	var pid = req.params.pid;
	console.log("GET bidderList from product: " + pid);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT username, userbidprice, userbidtime, pname " +
							 "FROM bids NATURAL JOIN customer NATURAL JOIN auction NATURAL JOIN product " +
							 "WHERE pid = $1 " +
							 "ORDER BY userbidtime desc ", [pid]);
	
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

app.get('/ProjectServer/bidderListSummary/:pid', function(req, res) {
	var pid = req.params.pid;
	console.log("GET bidderList: " + pid);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT COUNT(*) AS numberofbids, COUNT(DISTINCT uid) AS bidders, MAX(userbidprice) AS highbidder " +
							 "FROM bids NATURAL JOIN customer NATURAL JOIN auction " +
							 "WHERE pid = $1 ", [pid]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("Summary not found.");
		}
		else {	
  			var response = {"bidderListSummary" : result.rows};
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
  			var response = {"saleHistory" : result.rows};
			client.end();
  			res.json(response);
  		}
 	});
});

app.get('/ProjectServer/orderHistory/:buyerId', function(req, res) {
	var buyerId = req.params.buyerId;
	console.log("GET order history of user: " + buyerId);

	var client = new pg.Client(conString);
	client.connect();
	
	var query = client.query("SELECT namema, orderdate, orderid, COUNT(pid) AS orderitems " +
							 "FROM product NATURAL JOIN customerorder NATURAL JOIN mailingaddress " +
							 "WHERE buyerid = $1 " +
							 "GROUP BY orderdate, namema, orderid " +
							 "ORDER BY orderdate ", [buyerId]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("Order History not found.");
		}
		else {	
  			var response = {"orderhistory" : result.rows};
			client.end();
  			res.json(response);
  		}
 	});
});

app.get('/ProjectServer/orderView/:buyerId/:orderId', function(req, res) {
	var buyerId = req.params.buyerId;
	var orderId = req.params.orderId;
	console.log("GET order " + orderId + "of user " + buyerId);

	var client = new pg.Client(conString);
	client.connect();
	
	var query = client.query("SELECT * " +
							 "FROM product NATURAL JOIN customerorder NATURAL JOIN creditcard " +
							 "JOIN billingaddress USING(baddressid) NATURAL JOIN mailingaddress " +
							 "WHERE buyerid = $1 AND orderid = $2 ", [buyerId, orderId]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("Order not found.");
		}
		else {	
  			var response = {"orderView" : result.rows};
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
  			var response = {"saleHistory" : result.rows};
			client.end();
  			res.json(response);
  		}
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
							 "FROM customerorder NATURAL JOIN product " +
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
	
	var query = client.query("SELECT reviewid, review.uid, reviewgivenby, username as usernameg, review.rating, reviewtype, feedback, ratedate " +
							 "FROM customer, review " + 
							 "WHERE reviewgivenby = customer.uid " +
			        		 "AND review.uid = $1 " +
			        		 "ORDER BY ratedate desc", [id]);
			        							
	// var query = client.query("SELECT reviewGiven.reviewid, reviewGiven.uid as uidr, customer.fname as fnameR, customer.lname as lnameR, " +
								"customer.username as usernamer, reviewGiven.uidg, reviewGiven.fnameG, reviewGiven.lnameG, reviewGiven.usernameg, " +
								"reviewGiven.subject, reviewGiven.feedback, reviewGiven.rating, reviewGiven.ratedate " +
							 // "FROM " +
							 // "(select review.reviewid, customer.fname as fnameG, customer.lname as lnameG, customer.username as usernameg, " + 
							 "review.subject, review.feedback, review.rating, review.uid as uid, review.reviewgivenby as uidG, review.ratedate " +
							 // "from customer, review " + 
							 // "where customer.uid = review.reviewgivenby) as reviewGiven " +
	      					 // "join customer using(uid) " +
			        							// "where reviewGiven.uid = $1", [id]);
	
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

app.get('/ProjectServer/orderSearchPage/:searchInput/:orderType', function(req, res) {
	var searchInput = req.params.searchInput;
	var orderType = req.params.orderType;
	console.log("GET product order by: " + orderType);

	var client = new pg.Client(conString);
	client.connect();
	
	var query = client.query("SELECT * " +
							 "FROM product NATURAL LEFT JOIN auction NATURAL LEFT JOIN " +
							 "(SELECT auctionid, count(auctionid) as numberofbids " +
							 "FROM auction NATURAL JOIN bids " + 
							 "GROUP BY auctionid) as A " +
							 "WHERE pid in (select pid " +
	      					 	"FROM sale UNION (select pid " +
			        							"FROM auction)) " +
			        		 "AND pname ilike '%" + searchInput + "%' " +
			        		 "ORDER BY " + orderType);
	
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
  			var response = {"orderType" : result.rows};
			client.end();
  			res.json(response);
  		}
 	});
});

app.get('/ProjectServer/itemsSalePage/:sellerId/:orderType', function(req, res) {
	var sellerId = req.params.sellerId;
	var orderType = req.params.orderType;
	console.log("GET item sale product  order by: " + orderType);

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
			        			"AND sellerid = $1 " +
			        			"ORDER BY " + orderType , [sellerId]);
	
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
  			var response = {"orderType" : result.rows};
			client.end();
  			res.json(response);
  		}
 	});
});

// Server starts running when listen is called.
app.listen(process.env.PORT || 3412);
console.log("server listening");
