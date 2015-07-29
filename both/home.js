if(Meteor.isClient) {
  
  Template.home.events({
    'click #reiseErstellen': function () {
      console.log("Reise erstellt!");
    }
  });

}