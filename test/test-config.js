

require.config({
  // Testacular serves files under /base, which is the basePath from your config file


  // example of using shim, to load non AMD libraries (such as Backbone, jquery)
  shim: {
    underscore:{exports:"_"},
    backbone:{
      deps:["underscore","jquery"],
      exports:"Backbone"
    }
  },

  paths: {
    'chai': 'lib/chai/chai',
    'jquery': 'lib/jquery.1.7.2',
    'underscore': 'lib/underscore',
    'backbone': 'lib/backbone',
    'handlebars': 'lib/handlebars-1.0.0.beta.6',
    'Backbone.ComponentView': 'componentview',
    'test': 'test/test'
  },

  deps: [
    'test'
  ],

  callback: mocha.run

});
