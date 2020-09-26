//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");
const date = require(__dirname + "/date.js");
const mongosrv = require(__dirname + "/mongosrv.js")
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(mongosrv, { useNewUrlParser: true, useUnifiedTopology: true });

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Your item needs to have a name"]
  }
})

const Item = mongoose.model('Item', itemSchema)

const item1 = new Item({
  name: "Welcome to your todoList!"
})

const item2 = new Item({
  name: "Hit the + button to add a new item."
})

const item3 = new Item({
  name: "<-- Hit this to delete an item."
})

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
})

const List = mongoose.model('List', listSchema);
let items;

app.get("/", function (req, res) {
  const day = date.getDate();

  Item.find({}, (err, docs) => {
    if (err) { console.log(err) }
    else {
      if (docs.length === 0) {
        Item.insertMany([item1, item2, item3], err => {
          if (err) { console.log(err) }
        })
        res.redirect('/')
      } else {
        items = docs;
        let listTitle = lodash.capitalize('today');
        res.render("list", { listTitle: listTitle, newListItems: items });
      }
    }
  })
})

app.post("/", function (req, res) {
  const item = req.body.newItem;
  const listName = lodash.kebabCase(req.body.list);

  if (item) {
    let newItem = new Item({
      name: item
    })

    if (listName === "today") {
      newItem.save();
      res.redirect("/");
    } else {
      List.findOne({ name: listName }, (err, doc) => {
        if (err) {
          console.log(err)
        } else {
          if (doc) {
            doc.items.push(newItem);
            doc.save()
            res.redirect("/" + listName)
          }
        }
      })
    }
  }

});

app.post('/delete', (req, res, next) => {
  const itemId = req.body.checked;
  const listName = lodash.kebabCase(req.body.listName);
  if (req.body.checked) {
    if (listName === 'today') {
      Item.deleteOne({ _id: itemId }, err => {
        if (err) {
          console.log(err)
        } else {
          res.redirect("/")
        }
      })
    } else {
      List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: itemId } } }, (err, doc) => {
        if (err) {
          console.log(err)
        } else {
          res.redirect('/' + listName)
        }
      })
    }
  }

})

app.get('/:custom', (req, res, next) => {
  const listName = lodash.kebabCase(req.params.custom);
  // List.find({}, (err, docs) => {
  //   let foundPages = docs.map(doc => doc.name)
  //   if (err) {
  //     console.log(err)
  //   } else if (foundPages.includes(listName)) {
  //     res.render('list', { listTitle: listName, newListItems: items })
  //   } else {
  //     let newListItem = new List({
  //       name: listName,
  //       items: [item1, item2, item3]
  //     })
  //     newListItem.save();
  //     res.render('list', { listTitle: listName, newListItems: [] })
  //   }
  // })

  List.findOne({ name: listName }, (err, doc) => {
    if (err) {
      console.log(err)
    }
    else {
      if (!doc) {
        let newListItem = new List({
          name: listName,
          items: [item1, item2, item3]
        })
        newListItem.save();
        res.redirect("/" + listName)
      } else {
        res.render('list', { listTitle: lodash.capitalize(listName), newListItems: doc.items })
      }
    }
  })
})

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started running");
});
