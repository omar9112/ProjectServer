module.exports =  { 
	Product : function (name, model, brand, category, condition, priceMethod, price, description){
		this.id = "";
		this.name = name;
		this.model = model;
		this.brand = brand;
		this.category = category;
		this.condition = condition;
		this.priceMethod = priceMethod;
		this.price = price;
		this.description = description;
	}
};
