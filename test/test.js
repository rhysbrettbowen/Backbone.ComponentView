define(['chai', 'Backbone.ComponentView'], function(chai) {


	chai.should();

	describe('Backbone.ComponentView', function() {

		// var coll1 = new Backbone.Collection();
		// var coll2 = new Backbone.Collection();

		describe('namespace', function() {


			it('should exist', function() {
				Backbone.ComponentView.should.be.a('function');
			});

		});

		describe('initialize', function() {


			it('should create new view inheriting from Backbone.View', function() {
				var test = new Backbone.ComponentView();
				test.should.be.an.instanceof(Backbone.View);

			});

			it('should have the correct API', function() {
				var test = new Backbone.ComponentView();
				test.should.have.property('super');
				test.should.have.property('getId');
				test.should.have.property('getElement');
				test.should.have.property('setParent');
				test.should.have.property('getModel');
				test.should.have.property('setModel');
				test.should.have.property('getParent');
				test.should.have.property('isInDocument');
				test.should.have.property('createDom');
				test.should.have.property('isDomCreated');
				test.should.have.property('serialize');
				test.should.have.property('render');
				test.should.have.property('getElForChild');
				test.should.have.property('renderBefore');
				test.should.have.property('decorate');
				test.should.have.property('canDecorate');
				test.should.have.property('wasDecorated');
				test.should.have.property('decorateInternal');
				test.should.have.property('delegateEvents');
				test.should.have.property('dispose');
				test.should.have.property('addChild');
				test.should.have.property('addChildAt');
				test.should.have.property('getContentElement');
				test.should.have.property('hasChildren');
				test.should.have.property('getChildCount');
				test.should.have.property('getChildIds');
				test.should.have.property('getChildrenBySelector');
				test.should.have.property('getSelectorForChild');
				test.should.have.property('getChild');
				test.should.have.property('getChildAt');
				test.should.have.property('forEachChild');
				test.should.have.property('indexOfChild');
				test.should.have.property('removeChild');
				test.should.have.property('removeChildAt');
				test.should.have.property('removeChildren');
				test.should.have.property('setView');
				test.should.have.property('insertView');
				test.should.have.property('setViews');
			});

		});

		describe('Lifecycle', function() {
			var test = new Backbone.ComponentView();
			it('should not be in document or have dom created', function() {
				test.isDomCreated().should.be.false;
				test.isInDocument().should.be.false;
			});
			it('should have dom created after createDom call', function() {
				test.createDom();
				test.isDomCreated().should.be.true;
				test.isInDocument().should.be.false;
			});
			it('should be in document after render', function() {
				test.render(document.body);
				test.isDomCreated().should.be.true;
				test.isInDocument().should.be.true;
			});
			it('should be out of document after dispose', function() {
				test.dispose();
				test.isInDocument().should.be.false;
			});
		});

		describe('child lifecycle', function() {

			it('should not render until called', function() {
				var p = new Backbone.ComponentView();
				var c = new Backbone.ComponentView();
				p.render(document.body);
				p.addChild(c);
				c.isDomCreated().should.be.false;
				c.isInDocument().should.be.false;
				c.getParent().should.equal(p);
			});

			it('should not render if passed true', function() {
				var p = new Backbone.ComponentView();
				var c = new Backbone.ComponentView();
				p.render(document.body);
				p.addChild(c, true);
				c.isDomCreated().should.be.true;
				c.isInDocument().should.be.true;
				c.getParent().should.equal(p);
			});

			it('telling child to render should force parent to createDom but not enter document', function() {
				var p = new Backbone.ComponentView();
				var c = new Backbone.ComponentView();
				p.addChild(c, true);
				c.isDomCreated().should.be.true;
				c.isInDocument().should.be.false;
				p.isDomCreated().should.be.true;
				p.isInDocument().should.be.false;
				c.getParent().should.equal(p);
			});

			it('should switch parents', function() {
				var p1 = new Backbone.ComponentView();
				var p2 = new Backbone.ComponentView();
				var c = new Backbone.ComponentView();
				p1.addChild(c);
				c.getParent().should.equal(p1);
				p2.addChild(c);
				c.getParent().should.equal(p2);
				p1.hasChildren().should.be.false;
			});

		});

		describe('parent child interaction', function() {
			it('should have rendered child enter document when parent does', function() {
				var p = new Backbone.ComponentView();
				var c = new Backbone.ComponentView();
				p.addChild(c, true);
				p.render(document.body);
				p.isInDocument().should.be.true;
				c.isInDocument().should.be.true;
			});
		});

		describe('super', function() {
			it('should call up the super chain', function() {
				var test = false;
				var test2 = false;
				var Super = Backbone.ComponentView.extend({
					callMe: function() {
						test = true;
					}
				});
				var Parent = Super.extend({
					callMe: function() {
						this.super('callMe');
						test2 = true;
					}
				});
				var Child = Parent.extend({
					callMe: function() {
						this.super('callMe');
					}
				});
				var c = new Child();
				c.callMe();
				test.should.be.true;
				test2.should.be.true;
			});
		});

	});

});