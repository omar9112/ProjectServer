// Express is the web framework 
var express = require('express');
var pg = require('pg').native;
var app = express(),
path = require('path'),
    fs = require('fs');
  
function getDateTime() {
    var now     = new Date(); 
    var year    = now.getFullYear();
    var month   = now.getMonth()+1; 
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds(); 
    if(month.toString().length == 1) {
        var month = '0'+month;
    }
    if(day.toString().length == 1) {
        var day = '0'+day;
    }   
    if(hour.toString().length == 1) {
        var hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
        var minute = '0'+minute;
    }
    if(second.toString().length == 1) {
        var second = '0'+second;
    }   
    var dateTime = year+'/'+month+'/'+day+' '+hour+':'+minute+':'+second;   
    return dateTime;
}

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
// app.configure(function() {
  // app.use(express.bodyParser());
// });

var product = require("./product.js");
var Product = product.Product;

app.use(express.bodyParser({uploadDir:'/Users/omar91/Sites/ProjectServer/tmp'}));

// ...
// app.post('/upload', function (req, res) {
    // var tempPath = req.files.file.path,
        // targetPath = path.resolve('./uploads/image.png');
    // if (path.extname(req.files.file.name).toLowerCase() === '.png') {
        // fs.rename(tempPath, targetPath, function(err) {
            // if (err) throw err;
            // console.log("Upload completed!");
        // });
    // } else {
        // fs.unlink(tempPath, function () {
            // if (err) throw err;
            // console.error("Only .png files are allowed!");
        // });
    // }
    // // ...
// });

app.get('/image.png', function (req, res) {
    res.sendfile(path.resolve('./uploads/image.png'));
}); 

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
									"COALESCE(itemselling, 0) as itemselling,  administrator, deleted, " +
									"maddressid, namema, streetma, cityma, statema, zipma, hasmailingaddress.primaryoption as poptionma, phonenumber, cardid " +
							"FROM (SELECT COUNT(pid) AS buying, buyerid AS uid " +
	 							  "FROM product FULL OUTER JOIN customerorder USING (orderid) " +
	 							  "GROUP BY buyerid) AS itembuying " +
	 							  "FULL OUTER JOIN customer USING(uid) FULL OUTER JOIN (SELECT * FROM hasmailingaddress WHERE primaryoption = 1) " +
	 							  "as hasmailingaddress USING(uid) FULL OUTER JOIN mailingaddress using(maddressid) " +
	 							  "FULL OUTER JOIN (select * from creditcard where primaryoption = 1) as creditcard using(uid) FULL OUTER JOIN " +
	 							  "(select * from phonenumber where primaryoption = 'true') as phonenumber using(uid) " +
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
		else if (result.rows[0].deleted == 1) {
			res.statusCode = 409;
			res.send("User was deleted.");
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

app.get('/ProjectServer/shoppingcart/:uid/:pid', function(req, res) {
	var uid = req.params.uid;
	var pid = req.params.pid;
	console.log("GET");
	
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT pid " +
							  "FROM shoppingcart " +
							  "WHERE pid = $1 " +
							  "AND uid = $2 ", [pid, uid]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("No product with that id in shopping cart.");
		}
		else {	
			var response = {"shoppingcart" : result.rows};
			client.end();
	  		res.json(response);
	  }
 	});
});

app.get('/ProjectServer/cartInfo/:id', function(req, res) {
	var id = req.params.id;
	console.log("GET");
	
	var client = new pg.Client(conString);
	client.connect();
	
	var query = client.query("SELECT COALESCE(totalprice, 0) as totalprice, COALESCE(totalitems, 0) as totalitems " +
							  "FROM ( SELECT sum(pprice) as totalprice, count(sid) as totalItems " +
							  "FROM shoppingcart NATURAL JOIN product " +
							  		"WHERE uid = $1) AS cartinfo ", [id]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("Cart info not found.");
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

	var query = client.query("SELECT uid, deleted " +
							 "FROM customer " +
							 "WHERE username = $1 AND upassword = $2", [username, password]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 500;
			res.send("User not found.");
		}
		else if (result.rows[0].deleted == 1) {
			console.log('2 ' + result.rows[0].deleted);
			res.statusCode = 409;
			res.send("User was deleted.");
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

app.get('/ProjectServer/creditCard/:cardid', function(req, res) {
	var cardid = req.params.cardid;
	console.log("GET credit card  " + cardid);

	var client = new pg.Client(conString);
	client.connect();
	
	var query = client.query("SELECT * " +
							 "FROM creditcard NATURAL JOIN customer NATURAL JOIN billingaddress " +
							 "WHERE cardid = $1 ", [cardid]);
	
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var len = result.rows.length;
		if (len == 0){
			res.statusCode = 404;
			res.send("Credit Card not found.");
		}
		else {	
  			var response = {"creditCard" : result.rows};
			client.end();
  			res.json(response);
  		}
 	});
});

app.get('/ProjectServer/recentOrder/:uid', function(req, res) {
	var uid = req.params.uid;
	console.log("GET recent order from user  " + req.params.uid);

	var client = new pg.Client(conString);
	client.connect();
	
	var query = client.query("SELECT MAX(orderid) " +
							 "FROM customerorder " +
							 "WHERE buyerid = $1 ", [uid]);
	
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
  			var response = {"order" : result.rows[0]};
			client.end();
  			res.json(response);
  		}
 	});
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

// REST Operation - HTTP POST to add a new a user
app.post('/ProjectServer/users', function(req, res) {
	console.log("Before" + req.body.username);

	console.log("POST");
	var client = new pg.Client(conString);
	client.connect();
	
	if (!req.body.username || !req.body.upassword || !req.body.fname || !req.body.lname || !req.body.email){
    	res.statusCode = 400;
    	res.send('Error: Missing fields for user.');
 	}
 	else {
	 		    // console.log(JSON.stringify(req.files));

	    // var tempPath = req.files.file.path,
	        // targetPath = path.resolve('./uploads/image.png');
	    // if (path.extname(req.files.file.name).toLowerCase() === '.png') {
	        // fs.rename(tempPath, targetPath, function(err) {
	            // if (err) throw err;
	            // console.log("Upload completed!");
	        // });
	    // } else {
	        // fs.unlink(tempPath, function () {
	            // if (err) throw err;
	            // console.error("Only .png files are allowed!");
	        // });
	    // }
//  	
		var admin = 'false', deleted = 0;
        var query = client.query('INSERT INTO customer (username, upassword, fname, lname, email, administrator, deleted) ' +
		'VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING uid ', [req.body.username, req.body.upassword, req.body.fname, req.body.lname, req.body.email, admin, deleted], 
        function(err, result) {
        	if (err) {
            	console.log(err);
                res.statusCode = 500;
                console.log(res.statusCode);
                res.send('Error: Data fields for user.');
            } else {
                console.log('row inserted with id: ' + result.rows[0].uid);
                var response = {"uid" : result.rows[0].uid};
                client.end();
				res.json(response);
            }
           }); 
   }
});

// REST Operation - HTTP PUT to updated a user based on its id
app.put('/ProjectServer/user/:id', function(req, res) {
	var id = req.params.id;
	console.log("PUT user: " + id);
	
	var client = new pg.Client(conString);
	client.connect();
	
	if (!req.body.updemail || !req.body.updpassword){
    	 res.statusCode = 404;
    	res.send('Error: Missing fields for user.');
 	}
 	else {
        var query = client.query('UPDATE customer SET (email, upassword) = ' +
 								'($1, $2) ' +
								'WHERE uid = $3 ', [req.body.updemail, req.body.updpassword, id], 
        function(err, result) {
        	if (err) {
            	console.log(err);
                res.statusCode = 500;
                console.log(res.statusCode);
                res.send('Error: User could not be updated.');
            } else {
                client.end();
				res.json('Success');            
				}
       }); 
       
       }
});

// REST Operation - HTTP PUT to updated a user based on its id
app.put('/ProjectServer/user/delete/:id', function(req, res) {
	var id = req.params.id;
	console.log("PUT user: " + id);
	
	var client = new pg.Client(conString);
	client.connect();
 	
    var query = client.query('UPDATE customer SET (deleted) = (1) ' +
								'WHERE uid = $1 ', [id], 
    function(err, result) {
        if (err) {
            console.log(err);
            res.statusCode = 500;
            console.log(res.statusCode);
            res.send('Error: User could not be updated.');
        } else {
                client.end();
				res.json('Success');            
				}
       }); 
       
       
});

app.post('/ProjectServer/addMailingAddress/:option', function(req, res) {
	
	var option = req.params.option;
	console.log("POST");
	var client = new pg.Client(conString);
	client.connect();

        var query = client.query('BEGIN TRANSACTION; ' +
        'WITH rows AS (INSERT INTO mailingaddress (namema, streetma, cityma, statema, zipma) ' +
        "VALUES ('" + req.body.fistLastName + "', '"  + req.body.streetMa + "', '"  + req.body.cityMa + "', '"  + req.body.stateMa + "', '"  + req.body.zipMa + "') RETURNING maddressid) " +
        'INSERT INTO hasmailingaddress (uid, maddressid, primaryoption) ' +
        "VALUES (" + req.body.uid + ", (SELECT maddressid FROM rows), " + option +
        '); ' + 
        'INSERT INTO phonenumber (phonenumber, uid, primaryoption) ' +
        "VALUES ('" + req.body.phoneNumberMa + "', '"  + req.body.uid + "', '"  + option + "'); " +
        'END TRANSACTION; ', 
        function(err, result) {
        	if (err) {
            	console.log(err);
                res.statusCode = 500;
                console.log(res.statusCode);
                res.send('Error: .');
            } else {
                client.end();
				res.json('Success');
            }
           }); 
 });

app.post('/ProjectServer/addCreditCard/:option', function(req, res) {
	
	var option = req.params.option;	//"to_date('" +  req.body.cardExp + "', 'Mon-YYYY + "')"
	console.log("POST Credit Card");
	var client = new pg.Client(conString);
	client.connect();
		console.log(req.body.cardExp);
		
        var query = client.query('BEGIN TRANSACTION; ' +
        'WITH rows AS (INSERT INTO billingaddress (nameba, streetba, cityba, stateba, zipba, uid) ' +
        "VALUES ('" + req.body.fistLastNameCD + "', '"  + req.body.streetBa + "', '" + req.body.cityBa + "', '"  +
        req.body.stateBa + "', '" + req.body.zipBa + "', " + req.body.uid + ") RETURNING baddressid) " +
        'INSERT INTO creditcard (cardnumber, svn, uid, nameoncard, cardtype, baddressid, primaryoption, expirationdate) ' +
        "VALUES ('" + req.body.card_number + "', " + req.body.svn + ", " + req.body.uid + ", '" +
        req.body.fistLastNameCD + "', '" + req.body.cardType + "', (SELECT baddressid FROM rows), " + option + ", '" + req.body.cardExp + "'" +
        '); ' + 
        'END TRANSACTION; ', 
        function(err, result) {
        	if (err) {
            	console.log(err);
                res.statusCode = 500;
                console.log(res.statusCode);
                res.send('Error: .');
            } else {
                client.end();
				res.json('Success');
            }
           }); 
 });

// Creating new order
// app.post('/ProjectServer/customerOrder', function(req, res) {
	// console.log("POST");
	// console.log("Before" + req.body.buyerid);
// 
	// var client = new pg.Client(conString);
	// client.connect();
// 	
	// // if (!req.body.username || !req.body.upassword || !req.body.fname || !req.body.lname || !req.body.email){
    	// // res.statusCode = 400;
    	// // res.send('Error: Missing fields for user.');
 	// // }
 	// // else {
// 
        // var query = client.query('INSERT INTO customerorder (buyerid, orderdate, status, shippingoption, cardid, maddressid) ' +
		// 'VALUES ($1, $2, $3, $4, $5, $6) RETURNING orderid ', [req.body.buyerid, req.body.orderdate, req.body.status, req.body.shippingoption, req.body.cardid, req.body.maddressid], 
        // function(err, result) {
        	// if (err) {
            	// console.log(err);
                // res.statusCode = 500;
                // console.log(res.statusCode);
                // res.send('Error: Data fields for user.');
            // } else {
                // console.log('row inserted with id: ' + result.rows[0].orderid);
                // var response = {"orderid" : result.rows[0].orderid};
                // // var response = result.rows[0].uid;	
                // client.end();
				// res.json(response);
            // }
           // }); 
   // //}
// });

app.post('/ProjectServer/customerOrder', function(req, res) {
	console.log("POST Customer Order");

	var client = new pg.Client(conString);
	client.connect();
	
	// if (!req.body.username || !req.body.upassword || !req.body.fname || !req.body.lname || !req.body.email){
    	// res.statusCode = 400;
    	// res.send('Error: Missing fields for user.');
 	// }
 	// else {

        var query = client.query('BEGIN TRANSACTION; ' +
        						'WITH rows AS (INSERT INTO customerorder (buyerid, orderdate, status, shippingoption, cardid, maddressid) ' +
								'VALUES (' + "'" + req.body.buyerid + "', '" + req.body.orderdate + "', '" + req.body.status + "', '" + req.body.shippingoption + "', '" + req.body.cardid + "', '" + req.body.maddressid + "'" + ') RETURNING orderid) ' +
								'UPDATE product SET orderid = (SELECT orderid ' +
								'FROM rows) ' +
								'WHERE pid IN (SELECT pid ' + 
									      'FROM shoppingcart ' +
									      'WHERE uid = ' + req.body.buyerid + '); ' +
								'DELETE FROM sale ' +
								'WHERE pid in (SELECT pid ' +
									      'FROM shoppingcart ' +
									      'WHERE uid = ' + req.body.buyerid + '); ' +
								'DELETE FROM shoppingcart ' +
								'WHERE uid = ' + req.body.buyerid + '; ' +
								'END TRANSACTION;', 
        function(err, result) {
        	if (err) {
            	console.log(err);
                res.statusCode = 500;
                console.log(res.statusCode);
                res.send('Error: customer order.');
            } else {
                // console.log('row inserted with id: ' + result.rows[0].orderid);
                // var response = {"orderid" : result.rows[0].orderid};
                // var response = result.rows[0].uid;	
                client.end();
				res.json('success');
            }
           }); 
   //}
});

app.post('/ProjectServer/customerOrderbuyitnow', function(req, res) {
	console.log("POST Customer Order from buy it now");

	var client = new pg.Client(conString);
	client.connect();
	
    var query = client.query("BEGIN TRANSACTION; " +
        					 "WITH rows AS (INSERT INTO customerorder (buyerid, orderdate, status, shippingoption, cardid, maddressid) " +
							 "VALUES (" + req.body.buyerid + ", '" + getDateTime() + "', '"  + req.body.status + "', '" + req.body.shippingoption + "', " + req.body.cardid + "," + req.body.maddressid + ") RETURNING orderid) " +
							 "UPDATE product SET orderid = (SELECT orderid " +
							 "FROM rows) " +
							 "WHERE pid = '" + req.body.pid + "'; " +
							 "DELETE FROM sale " +
							 "WHERE pid = '" + req.body.pid + "'; " +
							 "DELETE FROM shoppingcart " +
							 "WHERE pid = '" + req.body.pid + "'; " +
							 "END TRANSACTION; ", 
        function(err, result) {
        	if (err) {
            	console.log(err);
                res.statusCode = 500;
                console.log(res.statusCode);
                res.send('Error: customer order from buy it now.');
            } else {
                client.end();
				res.json('success');
            }
           }); 
});



app.post('/ProjectServer/bidonproduct/:auctionid/:uid/:userbidprice', function(req, res) {
	var auctionid = req.params.auctionid;
	var uid = req.params.uid;
	var userbidprice = req.params.userbidprice;
	
	var client = new pg.Client(conString);
	client.connect();
	
    var query = client.query('BEGIN TRANSACTION; ' +
        					 'INSERT INTO bids (auctionid, uid, userbidprice, userbidtime) ' +
							 "VALUES ('" + auctionid + "', '" + uid + "', '" + userbidprice + "', '" + getDateTime() + "'); " +
							 "UPDATE auction SET currentbidprice = (" + userbidprice + ") " +
							 "WHERE auctionid = " + auctionid  + "; " +
							 "END TRANSACTION; ", 
    function(err, result) {
    	if (err) {
            	console.log(err);
                res.statusCode = 500;
                console.log(res.statusCode);
                res.send('Error: Data fields for user.');
        } else {
                client.end();
				res.json('response');
            }
           }); 
});

app.del('/ProjectServer/shoppingcart/:uid', function(req, res) {
	console.log("POST");
	var uid = req.params.uid;
	var client = new pg.Client(conString);
	client.connect();

        var query = client.query('DELETE FROM shoppingcart ' +
								'WHERE uid = $1 ', [uid], 
        function(err, result) {
        	if (err) {
            	console.log(err);
                res.statusCode = 500;
                console.log(res.statusCode);
                res.send('Error: Data fields for user.');
            } else {
                // console.log('row inserted with id: ' + result.rows[0].orderid);
                // var response = {"orderid" : result.rows[0].orderid};
                // var response = result.rows[0].uid;	
                client.end();
				res.json('response');
            }
           }); 
   //}
});

app.del('/ProjectServer/deleteItemCart/:uid/:pid', function(req, res) {
	console.log("POST");
	var uid = req.params.uid;
	var pid = req.params.pid;
	var client = new pg.Client(conString);
	client.connect();

        var query = client.query('DELETE FROM shoppingcart ' +
								'WHERE uid = $1 AND pid = $2', [uid, pid], 
        function(err, result) {
        	if (err) {
            	console.log(err);
                res.statusCode = 500;
                console.log(res.statusCode);
                res.send('Error: Data fields for user.');
            } else {
                // console.log('row inserted with id: ' + result.rows[0].orderid);
                // var response = {"orderid" : result.rows[0].orderid};
                // var response = result.rows[0].uid;	
                client.end();
				res.json('response');
            }
           }); 
   //}
});

// REST Operation - HTTP POST to add a new a user
app.post('/ProjectServer/shoppingcart/:uid/:pid', function(req, res) {
	var uid = req.params.uid;
	var pid = req.params.pid;
	
	console.log("Added to shopping cart" + pid);
	var client = new pg.Client(conString);
	client.connect();
	
	// if (!req.body.username || !req.body.upassword || !req.body.fname || !req.body.lname || !req.body.email){
    	// res.statusCode = 400;
    	// res.send('Error: Missing fields for user.');
 	// }
 	// else {
        var query = client.query('INSERT INTO shoppingcart (uid, pid) ' +
								 'VALUES ($1, $2) ', [uid, pid], 
        function(err, result) {
        	if (err) {
            	console.log(err);
                res.statusCode = 500;
                console.log(res.statusCode);
                res.send('Error: Data fields for user.');
            } else {
                // console.log('row inserted with id: ' + result.rows[0].uid);
                // var response = {"uid" : result.rows[0].uid};
                // var response = result.rows[0].uid;	
                client.end();
				res.json('response');
            }
           }); 
   // }
});

// Updating products with orderid
app.put('/ProjectServer/orderProduct/:orderid/:uid', function(req, res) {
	var orderid = req.params.orderid;
	var uid = req.params.uid;

	console.log("PUT orderid: " + orderid + " " + uid);
	
	var client = new pg.Client(conString);
	client.connect();
	
	// if (!req.body.updemail || !req.body.updpassword){
    	 // res.statusCode = 404;
    	// res.send('Error: Missing fields for user.');
 	// }
 	// else {
        var query = client.query('UPDATE product SET (orderid) = ' +
 								'($1) ' +
								'WHERE pid IN (SELECT pid FROM shoppingcart WHERE uid = $2) ', [orderid, uid], 
        function(err, result) {
        	if (err) {
            	console.log(err);
                res.statusCode = 500;
                console.log(res.statusCode);
                res.send('Error: User could not be updated.');
            } else {
                client.end();
				res.json('Success');            
				}
       }); 
       
       // }
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

// REST Operation - HTTP GET to get a user based on username (for administrator)
app.get('/ProjectServer/user/:username', function(req, res) {
	var username = req.params.username;
	console.log("GET user: " + username);

	var client = new pg.Client(conString);
	client.connect();
	
	var query = client.query("SELECT uid, deleted " +
							 "FROM customer " +
							 "WHERE username = $1", [username]);
	
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
  			var response = {"user" : result.rows[0]};
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
