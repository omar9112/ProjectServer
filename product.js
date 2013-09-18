module.exports =  { 
	Product : function (name, model, instantPrice, bidPrice, description, photo, brand, dimensions){
		this.id = "";
		this.name = name;
		this.model = model;
		this.instantPrice = instantPrice;
		this.bidPrice = bidPrice;
		this.description = description;
		this.photo = photo;
		this.brand = brand;
		this.dimensions = dimensions;
	}
};
