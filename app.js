require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
mongoose.connect(process.env.MONGODB, {useNewUrlParser: true, useUnifiedTopology: true});

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const itemsSchema = mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item ({
  name: "This is Harshit's to-do list"
});

const item2 = new Item ({
  name: "Click the + button to add a new item"
});

const item3 = new Item ({
  name: "<-- Click this to delete an item"
});

const defaultItems = [item1, item2, item3];

//= mongoose.Schema {} is not necessary when creating a schema
const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find(function(err, foundItems) {

    if (foundItems.length == 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("default items successfully saved into the database.");
        }
      })
      res.redirect('/');
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      if (!err) {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      } else {
        console.log(err);
      }
    });
  }

});

app.post("/delete", function(req, res) {
  const checkedItemID = req.body.itemCheckbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({_id: checkedItemID}, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("item successfully deleted");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function(err, results){
      if (err) {
        console.log(err);
      } else {
        console.log("item successfully deleted");
      }
    });
    res.redirect("/" + listName);
  }


})

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (foundList) {
        //show existing list
        res.render("list",{listTitle: foundList.name, newListItems: foundList.items});
      } else {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/"+ customListName);
      }
    }
  })

});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started successfully");
});
