// ==========================================
// Copyright 2013 Dataminr
// Licensed under The MIT License
// http://opensource.org/licenses/MIT
// work derived from http://closure-library.googlecode.com/svn/docs/closure_goog_ui_component.js.source.html
// ==========================================

// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

define('Backbone.ComponentView', [
  'underscore',
  'backbone',
  'handlebars'
], function(_, Backbone, Handlebars) {


  var orig = Backbone.View.prototype;

  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'template', 'itemView'];

  Backbone.ComponentView = Backbone.View.extend({
    constructor: function(options) {
      this.cid = _.uniqueId('view');
      this._configure(options || {});
      this.initialize.apply(this, arguments);
    },
    _inDocument: false,
    _parent: null,
    _children: null,
    _childIndex: null,
    _wasDecorated: false,
    _disposed: false,
    _domCreated: false,
    __manager__: {},
    _views: null,
    _options: function(){},
    _configure: function(options) {
      if (this.options) options = _.extend({}, this.options, options);
      for (var i = 0, l = viewOptions.length; i < l; i++) {
        var attr = viewOptions[i];
        if (options[attr]) this[attr] = options[attr];
      }
      this.options = options;

      if (options.views)
        this.setViews(options.views);
    },
    _setupChildStorage: function() {
      this._views = this._views || {};
      this._children = this._children || [];
      this._childIndex = this._childIndex || {};
    },
    super: function(fn) {
      var caller = Backbone.ComponentView.prototype.super.caller;
      var found;
      for (var child = this; child && _.isFunction(child[fn]); child = child.constructor.__super__) {
        if (!found)
          found = true;
        else if (child[fn] != caller)
          return child[fn].apply(this, [].slice.call(arguments, 1));
      }
    },
    getId: function() {
      return this.cid;
    },
    getElement: function() {
      return this.el;
    },
    setParent: function(parent) {
      if (this._parent && this._parent != parent)
        this._parent.removeChild(this);
      this._parent = parent;
    },
    getModel: function() {
      return this.model || this.collection;
    },
    setModel: function(model) {
      if (model instanceof Backbone.Model)
        this.model = model;
      if (model instanceof Backbone.Collection)
        this.collection = model;
    },
    getParent: function() {
      return this._parent;
    },
    isInDocument: function() {
      return this._inDocument;
    },
    createDom: function(force) {
      if (this._domCreated && !force)
        return;
      this._ensureElement();
      if (this.template && _.isString(this.template)) {
        this.template = Handlebars.compile(this.template);
      }
      if (this.template && _.isFunction(this.template)) {
        this.$el.empty();
        this.$el.append(this.template(this.serialize()));
      }

      this._domCreated = true;

      this.delegateEvents();
    },
    isDomCreated: function() {
      return this._domCreated;
    },
    serialize: function() {
      if (this.getModel())
        return this.getModel().toJSON();
      return {};
    },
    render: function(el) {
      if (_.isString(el))
        el = $(el)[0];
      this.render_(el || (this.getParent() &&
        this.getParent().getElForChild(this)), this.getNextSibling());
      return this;
    },
    getElForChild: function(child) {
      var sel;
      _.each(this._views, function(val, key) {
        if (_.contains(val, child))
          sel = key;
      });
      if (sel)
        sel = this.$(sel)[0];
      return sel || this.getContentElement();
    },
    getNextSibling: function() {
      var parent = this.getParent();
      if (!parent)
        return;
      var children = parent.getChildrenBySelector(parent.getSelectorForChild(this));
      return children[_.indexOf(children, this) + 1];
    },
    renderBefore: function(sibling) {
      this.render_(sibling.parentNode, sibling);
    },
    render_: function(opt_parentElement, opt_beforeNode) {

      this.createDom();

      if (opt_parentElement) {
        opt_parentElement.insertBefore(this.el, opt_beforeNode || null);
      } else {
        document.body.appendChild(this.el);
      }

      if (!this._parent || this._parent.isInDocument()) {
        this._enterDocument();
      }
    },
    decorate: function(element) {
      if (this._inDocument) {
        throw new Error('already rendered');
      } else if (element && this.canDecorate(element)) {
        this._wasDecorated = true;

        // Call specific component decorate logic.
        this.decorateInternal(element);
        this._enterDocument();
      } else {
        return false;
      }
    },
    canDecorate: function(el) {
      return !!el;
    },
    wasDecorated: function() {
      return this._wasDecorated;
    },
    decorateInternal: function(element) {
      this.setElement(element);
    },
    _enterDocument: function() {
      var wasIn = this._inDocument;
      this._inDocument = true;
      this.forEachChild(function(child) {
        if (!child.isInDocument() && child.getElement()) {
          child._enterDocument();
        }
      });
      this.delegateEvents();
      if (!wasIn) {
        if (this.enterDocument)
          this.enterDocument();
        this.trigger('enterDocument', this);
      }
    },
    delegateEvents: function(events) {
      if (this._inDocument)
        orig.delegateEvents.call(this, events);
    },
    exitDocument: function() {
      var wasIn = this._inDocument;
      this.forEachChild(function(child) {
        if (child.isInDocument()) {
          child.exitDocument();
        }
      });
      this.undelegateEvents();
      this._inDocument = false;
      if (wasIn)
        this.trigger('exitDocument', this);
    },
    dispose: function() {
      if (!this._disposed) {
        this._disposed = true;
        if (this.disposeInternal)
          this.disposeInternal();
        this._disposeInternal();
      }
    },
    _disposeInternal: function() {
      if (this._inDocument) {
        this.exitDocument();
      }

      this.forEachChild(function(child) {
        child.dispose();
      });

      this.stopListening && this.stopListening();

      // Detach the component's element from the DOM, unless it was decorated.
      if (!this._wasDecorated && this.el) {
        this.$el.remove();
      }

      this._children = null;
      this._childIndex = null;
      this.el = null;
      this._parent = null;
    },
    addChild: function(child, opt_render) {
      this.addChildAt(child, this.getChildCount(), opt_render);
    },
    addChildAt: function(child, index, opt_render) {
      if (child._inDocument && (opt_render || !this._inDocument) || child == this) {
        return false;
      }

      if (index < 0) {
        index = this.getChildCount() - index;
      }

      index = Math.min(Math.max(0, index || this.getChildCount()), this.getChildCount());

      this._setupChildStorage();

      // Moving child within component, remove old reference.
      if (child.getParent() == this) {
        this._childIndex[child.getId()] = child;
        this._children = _.without(this._children, child);

        // Add the child to this component.  goog.object.add() throws an error if
        // a child with the same ID already exists.
      } else {
        // if (this._childIndex[child.cid])
        // return false;
        this._childIndex[child.cid] = child;
      }

      // Set the parent of the child to this component.
      child.setParent(this);
      this._children.splice(index, 0, child);

      if (opt_render && (!child._inDocument || !this._inDocument)) {
        this.createDom();
        child.render();
      }

      if (child._inDocument && this._inDocument && child.getParent() == this) {
        var contentElement = this.getContentElement();
        if (!this.placeChild)
          contentElement.insertBefore(child.getElement(),
            (contentElement.childNodes[index] || null));
        else
          _.each(this.children_, function(child, index) {
            this.placeChild(contentElement, child, index);
          }, this);



      } else if (!opt_render && this._inDocument && !child._inDocument &&
        child.el && child.el.parentNode) {
        child.enterDocument();
      }
    },
    getContentElement: function() {
      if (this.contentElement && !this.$(this.contentElement)[0]) {
        throw new Error('DANGER!');
      }
      return this.$(this.contentElement)[0] || this.el;
    },
    hasChildren: function() {
      this._setupChildStorage();
      return this._children.length !== 0;
    },
    getChildCount: function() {
      this._setupChildStorage();
      return this._children.length;
    },
    getChildIds: function() {
      this._setupChildStorage();
      return _.map(this._children, function(child) {
        return child.cid;
      });
    },
    getChildrenBySelector: function(selector) {
      if (!selector) {
        return _.filter(this._children, function(child) {
          return !this.getSelectorForChild(child);
        }, this);
      }
      return this._views[selector] || [];
    },
    getAllChildren: function() {
      return (this._children || []).slice();
    },
    getChildren: function(selector) {
      return this.getChildrenBySelector(selector);
    },
    getSelectorForChild: function(child) {
      var selector;
      _.each(this._views, function(arr, key) {
        if (_.contains(arr, child))
          selector = key;
      });
      return selector;
    },
    getChild: function(id) {
      this._setupChildStorage();
      return this._childIndex[id] || null;
    },
    getChildAt: function(index) {
      this._setupChildStorage();
      return this._children[index] || null;
    },
    forEachChild: function(f, opt_obj) {
      this._setupChildStorage();
      _.each(this._children, f, opt_obj);
    },
    indexOfChild: function(child) {
      this._setupChildStorage();
      return _.indexOf(this._children, child);
    },
    removeChild: function(child, opt_unrender) {
      this._setupChildStorage();
      if (child) {
        this._setupChildStorage();
        // Normalize child to be the object and id to be the ID string.  This also
        // ensures that the child is really ours.
        var id = _.isString(child) ? child : child.getId();
        child = this.getChild(id);

        if (id && child) {
          var sel = this.getSelectorForChild(child);
          if (sel) {
            var i = _.indexOf(this._views[sel], child);
            if (i > -1)
              this._views[sel].splice(i, 1);
          }
          delete this._childIndex[id];
          this._children = _.without(this._children, child);

          if (opt_unrender) {
            // Remove the child component's DOM from the document.  We have to call
            // exitDocument first (see documentation).
            child.exitDocument();
            if (child.el) {
              child.$el.remove();
            }
          }

          // Child's parent must be set to null after exitDocument is called
          // so that the child can unlisten to its parent if required.
          child.setParent(null);
        }
      }

      if (!child) {
        return null;
      }

      return child;
    },
    removeChildAt: function(index, opt_unrender) {
      return this.removeChild(this.getChildAt(index), opt_unrender);
    },
    removeChildren: function(opt_unrender) {
      var removedChildren = [];
      while (this.hasChildren()) {
        removedChildren.push(this.removeChildAt(0, opt_unrender));
      }
      return removedChildren;
    },
    setView: function(selector, child) {
      this._setupChildStorage();
      _.each(this._views[selector], function(child) {
        this.removeChild(child, true);
      }, this);
      this.createDom();
      this.$(selector).empty();
      return this.insertView(selector, child);
    },
    insertView: function(selector, child) {
      this._setupChildStorage();
      this.createDom();
      if (!child) {
        child = selector;
        selector = this.getContentElement();
      }
      this.removeChild(child);
      if (_.isString(selector)) {
        this._views = this._views || {};
        this._views[selector] = this._views[selector] || [];
        if (!_.contains(this._views[selector], child)) {
          this._views[selector].push(child);
        }
      }
      this.addChild(child);
      child.render(this.$(selector)[0]);
      return child;
    },
    setViews: function(views) {
      _.each(views, function(val, key) {
        if (!_.isArray(val))
          val = [val];
        _.each(val, function(child) {
          this.insertView(key, child);
        }, this);
      }, this);
    },
    getView: function(selector) {
      return this.getChildrenBySelector(selector)[0];
    },
    getViews: function(selector) {
      return this.getChildrenBySelector(selector);
    }
  });

});
