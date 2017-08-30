
Meteor.subscribe("comments");

Router.configure({
  layoutTemplate: 'ApplicationLayout'
});

Router.route('/', function() {
  console.log("you hit /");
  this.render("navbar", {to:"header"});
  this.render("docList", {to:"main"});
});

Router.route('/documents/:_id', function() {
  console.log("you hit /"+this.params._id);
  Session.set("docid",this.params._id)
  this.render("navbar", {to:"header"});
  this.render("docItem", {to:"main"});
});



// return the id of the first document you can find
Template.editor.helpers({
  docid:function(){
    setupCurrentDocument();
    return Session.get("docid");
  }, 
  // configure the CodeMirror editor
  config:function(){
    return function(editor){
      editor.setOption("lineNumbers", true);
      editor.setOption("theme", "cobalt");
      // set a callback that gets triggered whenever the user
      // makes a change in the code editing window
      editor.on("change", function(cm_editor, info){
        // send the current code over to the iframe for rendering
        $("#viewer_iframe").contents().find("html").html(cm_editor.getValue());
        Meteor.call("addEditingUser", Session.get("docid"));
      });        
    }
  }, 
});

Template.editingUsers.helpers({
  // retrieve a set of users that are editing this document
  users:function(){
    var doc, eusers, users;
    doc = Documents.findOne({_id:Session.get("docid")});
    if (!doc){return;}// give up
    eusers = EditingUsers.findOne({docid:doc._id});
    if (!eusers){return;}// give up
    users = new Array();
    var i = 0;
    for (var user_id in eusers.users){
        users[i] = fixObjectKeys(eusers.users[user_id]);
        i++;
    }
    return users;
  }
});

Template.navbar.helpers({
  documents:function(){
    return Documents.find();
  }  
});

Template.docMeta.helpers({
  document:function(){
    return Documents.findOne({_id:Session.get("docid")});
  },
  canEdit:function(){
    var doc;
    doc = Documents.findOne({_id:Session.get("docid")});
    if (doc){
      if (doc.owner == Meteor.userId()){
        return true;
      }
    }
    return false;
  }
});

Template.editableText.helpers({
  userCanEdit:function(doc,Collection){
    //can edit if the current doc is owned by me.
    doc = Documents.findOne({_id:Session.get("docid"), owner:Meteor.userId()});
    if(doc){
      return true;
    }
    else{
      return false;
    }
  }
});

Template.docList.helpers({
  documents:function(){
    return Documents.find();
  }  
});

Template.insertCommentForm.helpers({
  docid:function(){
    return Session.get("docid");
  }
});

Template.commentList.helpers({
  comments:function(){
    return Comments.find({docid:Session.get("docid")});
  }
});
//////////
/// EVENTS
//////////

Template.navbar.events({
  "click .js-add-doc":function(event){
    event.preventDefault();
    console.log("js-add-doc");
    if (!Meteor.user()){// user not available
      alert("You need to login first!");
    }
    else{
      // they are logged in... lets insert a doc
      var id = Meteor.call("addDoc",function(err,res){
          console.log("event callback received id: "+res);
          Session.set("docid", res);
        }
      });
    }
  },
  "click .js-load-doc":function(event){
    Session.set("docid", this._id);
  }
});

Template.docMeta.events({
  "click .js-rtog-private": function(event){
    console.log(event.target.checked);
    var doc = {_id:Session.get("docid"), isPrivate:event.target.checked};
    Meteor.call("updateDocPrivacy", doc);
  }
});


function setupCurrentDocument(){
  var doc;
  if (!Session.get("docid")){// no doc id set yet
    doc = Documents.findOne();
    if (doc){
      Session.set("docid", doc._id);
    }
  }
}

// this renames object keys by removing hyphens to make the compatible 
// with spacebars. 
function fixObjectKeys(obj){
  var newObj = {};
  for (key in obj){
    var key2 = key.replace("-", "");
    newObj[key2] = obj[key];
  }
  return newObj;
}