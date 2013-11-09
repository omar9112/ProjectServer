module.exports =  {  
	User : function(
			  username,
			  password,
			  firstName, 
			  lastName, 
			  telephone, 
			  email,
			  rating)
{
	this.id = "";
	this.username = username;
	this.password = password;
	this.firstName = firstName;
	this.lastName = lastName;
	this.telephone = telephone;
	this.email = email;
	this.rating = rating;
}
};