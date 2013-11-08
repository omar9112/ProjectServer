module.exports =  { 
	Review : function (date, rating, feedback, subject, sellerid, customerid){
		this.reviewid = "";
		this.date = date;
		this.rating = rating;
		this.feedback = feedback;
		this.subject = subject;
		this.sellerid = sellerid;
		this.customerid = customerid;
	}
};