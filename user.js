module.exports =  {  
	User : function(
			  username,
			  password,
			  firstName, 
			  lastName, 
			  streetMailingAddress, 
			  cityMailingAddress, 
			  stateMailingAddress, 
			  zipMailingAddress, 
			  streetBillingAddress, 
			  cityBillingAddress, 
			  stateBillingAddress, 
			  zipBillingAddress, 
			  telephone, 
			  email,
			  rating)
{
	this.id = "";
	this.username = username;
	this.password = password;
	this.firstName = firstName;
	this.lastName = lastName;
	this.streetMailingAddress = streetMailingAddress;
	this.cityMailingAddress = cityMailingAddress;
	this.stateMailingAddress = stateMailingAddress;
	this.zipMailingAddress = zipMailingAddress;
	this.streetBillingAddress = streetBillingAddress;
	this.cityBillingAddress = cityBillingAddress;
	this.stateBillingAddress = stateBillingAddress;
	this.zipBillingAddress = zipBillingAddress;
	this.telephone = telephone;
	this.email = email;
	this.rating = rating;
}
};