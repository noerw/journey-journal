Router.route('/', function() {
    this.render('home');
});

Router.route('/uwot', function() {
    this.render('uwot');
});

Router.route('/map', function() {
    this.render('map');
});