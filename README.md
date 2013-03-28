# Backbone.ComponentView #

a component handler for Backbone Views which derives heavily from http://closure-library.googlecode.com/svn/docs/class_goog_ui_Component.html with the selector conecpts from https://github.com/tbranyen/backbone.layoutmanager

## Usage ##

see https://code.google.com/p/closure-library/wiki/IntroToComponents

The componentView has a few states. It starts out with no element, then createDom is called giving it an element and structure, and finally enterDocument will be called once it is put in the document. exitDocument will be called if it is removed from the document and you can also call dispose() to remove all it's references.

When a componentView is first instantiated it has no element. Calling createDom will create an element and try to call handlebars on this.template if one exists. If you want to create your DOM structure another way, just override createDom, or if you'd like to add to it you can use super like so:

```
var Red = Backbone.ComponentView.extend({
	createDom: function(force) {
		this.super('createDom', force);
		this.$el.css('background', 'red');
	}
});
```

the enterDocument function is where you setup all you event handlers like listening to collections. If you setup anything here like references to DOM elements you'll want to clean them up in exitDocument (exitDocument by default will call undelegateEvents).

to put the view on a page you can do so like this:

```
var myRed = new Red({
	model: myModel;
});
myRed.render(document.body);
```

render will append it to the document and call createDom and enterDocument.

you can also add children to the component using `addChild` or `addChildAt` and of course remove them with `removeChild`. When calling these methods you can optionally pass a `true` parameter that will render the child in to the component's content element or you can render them manually. Setting up a heirarchy like this enables the parents (that you can get with `getParent`) to control the enter and exit document methods when it is added or removed.

You can also use `setView` or `insertView` which will add a child in an element that matches a selector. you can use `setViews` that takes an object with keys as selector strings and values as either a componentView or another object to setup a heirarchy.

## inheritance ##

if you've extended a componentView you can call it's parent function with `this.super(functionName, *args...);`

## BONUS! ##

if you're using Backbone.Advice you can get autolist functionality using this mixin:

```
function(options) {
    if (options.contentElement)
        this.clobber({
            getContentElement: function() {
                return this.$el.find(options.contentElement);
            }
        });

    this.after('enterDocument', function() {
        this.collection.on('reset', this.autolist_, this);
        this.collection.on('add', this.autolist_, this);
        this.collection.on('remove', this.autolist_, this);
        this.autolist_();
    });

    this.setDefaults({
        autolist_: function() {
            this.beforeList(this.getContentElement());
            var model = this.collection;
            var models = model.models;
            var children = this._children || [];

            var childModels = _.map(children, function(child) {
                return child.getModel();
            });

            var removed = _.filter(children, function(child) {
                return !_.contains(models, child.getModel());
            });

            if (children.length === 0) {
                _.each(models, function(model) {
                    var setup = _.extend({}, options.setup);
                    if (model instanceof Backbone.Model)
                        setup.model = model;
                    if (model instanceof Backbone.Collection)
                        setup.collection = model;
                    var newChild = new this.itemView(setup);
                    this.addChild(newChild, true);
              }, this);
            } else {
                _.each(removed, function(child) {
                    if (!_.chain(this.views).values().flatten().contains(child)) {
                        this.removeChild(child, true);
                        child.dispose();
                    }
                }, this);
                _.each(models, function(model, ind) {
                    var child;
                    if(!_.contains(childModels, model)) {
                        var setup = _.extend({}, options.setup);
                        if (model instanceof Backbone.Model)
                            setup.model = model;
                        if (model instanceof Backbone.Collection)
                            setup.collection = model;
                        child = new this.itemView(setup);
                        child.createDom();
                        this.addChildAt(child, ind, true);
                    } else {
                        child = _.find(children, function(c) {
                            return c.getModel() == model;
                        });
                        if (this.getChildAt(ind) != child)
                          this.addChildAt(child, ind);
                    }

                }, this);
            }
            this.afterList(this.getContentElement());
        },
        afterList: function() {},
        beforeList: function() {}
    });
};
```
