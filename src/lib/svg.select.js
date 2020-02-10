/*! svg.select.js - v2.1.1 - 2016-08-05
* https://github.com/Fuzzyma/svg.select.js
* Copyright (c) 2016 Ulrich-Matthias Schäfer; Licensed MIT */
/*jshint -W083*/
;(function (undefined) {

    function SelectHandler(el) {

        this.el = el;
        el.remember('_selectHandler', this);
        this.pointSelection = {isSelected: false};
        this.rectSelection = {isSelected: false};
        this.assetUrl = window['environment']['assetUrl'];
    }

    SelectHandler.prototype.init = function (value, options) {

        var bbox = this.getBBox();
        this.options = {};

        // Merging the defaults and the options-object together
        for (var i in this.el.selectize.defaults) {
            this.options[i] = this.el.selectize.defaults[i];
            if (options[i] !== undefined) {
                this.options[i] = options[i];
            }
        }

        this.designElement = (this.designElement || options['designElement']);

        this.parent = this.el.parent();
        // NOTE: instead of creating the group for the controls in the parent of this element,
        // we put it outside of the "side" svg element so that it won't be affected by distress
        // this.nested = (this.nested || this.parent.group());
        this.nested = (this.nested || this.designElement.svgElement.doc().group());

        // Default implementation
        // this.nested.matrix(new SVG.Matrix(this.el).translate(bbox.x, bbox.y));

        // New implementation
        const area = this.designElement.area;
        const imprintArea = area.maxImprintAreaElement;

        this.nested.matrix(new SVG.Matrix(this.el.parent(SVG.Nested))
        //this.nested.matrix(new SVG.Matrix(this.el)
          .translate(
            area.svgElement.x() + imprintArea.x() + bbox.x,
            area.svgElement.y() + imprintArea.y() + bbox.y
          )
        );

        // When deepSelect is enabled and the element is a line/polyline/polygon, draw only points for moving
        if (this.options.deepSelect && ['line', 'polyline', 'polygon'].indexOf(this.el.type) !== -1) {
            this.selectPoints(value);
        } else {
            this.selectRect(value);
        }

        this.observe();
        this.cleanup();
    };

    SelectHandler.prototype.selectPoints = function (value) {

        this.pointSelection.isSelected = value;

        // When set is already there we dont have to create one
        if (this.pointSelection.set) {
            return this;
        }

        // Create our set of elements
        this.pointSelection.set = this.parent.set();
        // draw the circles and mark the element as selected
        this.drawCircles();

        return this;
    };

    // create the point-array which contains the 2 points of a line or simply the points-array of polyline/polygon
    SelectHandler.prototype.getPointArray = function () {
        var bbox = this.getBBox();

        return this.el.array().valueOf().map(function (el) {
            return [el[0] - bbox.x, el[1] - bbox.y];
        });
    };

    // The function to draw the circles
    SelectHandler.prototype.drawCircles = function () {

        var _this = this, array = this.getPointArray();

        // go through the array of points
        for (var i = 0, len = array.length; i < len; ++i) {

            var curriedEvent = (function (k) {
                return function (ev) {
                    ev = ev || window.event;
                    ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;

                    var x= ev.pageX || ev.touches[0].pageX;
                    var y= ev.pageY || ev.touches[0].pageY;
                    _this.el.fire('point', {x: x, y: y, i: k, event: ev});
                };
            })(i);

            // add every point to the set
            this.pointSelection.set.add(
                // a circle with our css-classes and a touchstart-event which fires our event for moving points
                this.nested.circle(this.options.radius)
                    .center(array[i][0], array[i][1])
                    .addClass(this.options.classPoints)
                    .addClass(this.options.classPoints + '_point')
                    .on('touchstart', curriedEvent)
                    .on('mousedown', curriedEvent)
            );
        }

    };

    // every time a circle is moved, we have to update the positions of our circle
    SelectHandler.prototype.updatePointSelection = function () {
        var array = this.getPointArray();

        this.pointSelection.set.each(function (i) {
            if (this.cx() === array[i][0] && this.cy() === array[i][1]) {
                return;
            }
            this.center(array[i][0], array[i][1]);
        });
    };

    SelectHandler.prototype.updateRectSelection = function () {
        var bbox = this.getBBox();

        this.rectSelection.set.get(0).attr({
            width: bbox.width,
            height: bbox.height
        });

        // set.get(1) is always in the upper left corner. no need to move it
        if (this.options.points) {
            this.rectSelection.set.get(2).x(bbox.width - 10).y(-15);
            this.rectSelection.set.get(3).x(bbox.width - 10).y(bbox.height - 10);
            this.rectSelection.set.get(4).center(0, bbox.height);

            this.rectSelection.set.get(5).center(bbox.width / 2, 0);
            this.rectSelection.set.get(6).center(bbox.width, bbox.height / 2);
            this.rectSelection.set.get(7).center(bbox.width / 2, bbox.height);
            this.rectSelection.set.get(8).center(0, bbox.height / 2);
        }

        this.rectSelection.set.get(10).center(bbox.width / 2, bbox.height + 15);
    };

    SelectHandler.prototype.selectRect = function (value) {
        var _this = this;
        var bbox = this.getBBox();

        this.rectSelection.isSelected = value;

        // when set is already p
        this.rectSelection.set = this.rectSelection.set || this.parent.set();

        // helperFunction to create a mouse-down function which triggers the event specified in `eventName`
        function getMoseDownFunc(eventName) {
            return function (ev) {
                ev = ev || window.event;
                ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;

                var x= ev.pageX || ev.touches[0].pageX;
                var y= ev.pageY || ev.touches[0].pageY;
                _this.el.fire(eventName, {x: x, y: y, event: ev});
            };
        }

        // create the selection-rectangle and add the css-class
        if (!this.rectSelection.set.get(0)) {
            this.rectSelection.set.add(this.nested.rect(bbox.width, bbox.height).addClass(this.options.classRect));
        }

        // Draw Points at the edges, if enabled
        if (this.options.points && !this.rectSelection.set.get(1)) {
            var ename ="touchstart", mname = "mousedown";

          this.rectSelection.set.add(this.nested.circle(this.options.radius).center(0, 0)
            .attr('class', this.options.classPoints + '_lt')
            .on(mname, getMoseDownFunc('lt'))
            .on(ename, getMoseDownFunc('lt')))
            .addClass(this.designElement && this.designElement.allowRotate() ? 'enabled' : 'disabled')
          ;

            // Custom delete button in top right
            // this.rectSelection.set.add(this.nested.circle(this.options.radius).center(bbox.width, 0).attr('class', this.options.classPoints + '_rt').on(mname, getMoseDownFunc('rt')).on(ename, getMoseDownFunc('rt')));
            this.rectSelection.set.add(this.nested.image(this.assetUrl + 'assets/ui/delete-element-button.png')
                                                  .center(bbox.width - 10, -15)
                                                  .width(25).height(25)
                                                  .attr('class', this.options.classPoints + '_rt')
                                                  .on('click', function() { _this.el.fire('delete') })
            );

            // Custom resize button in bottom-right
            this.rectSelection.set.add(this.nested.image(this.assetUrl + 'assets/ui/resize-element-button.png')
              .center(bbox.width - 10, bbox.height - 10)
              .width(25).height(25)
              .attr('class', this.options.classPoints + '_rb')
              .on(mname, getMoseDownFunc('rb'))
              .on(ename, getMoseDownFunc('rb'))
              .addClass(this.designElement && this.designElement.allowResize() ? 'enabled' : 'disabled')
            );

            this.rectSelection.set.add(this.nested.circle(this.options.radius).center(0, bbox.height).attr('class', this.options.classPoints + '_lb').on(mname, getMoseDownFunc('lb')).on(ename, getMoseDownFunc('lb')));

            this.rectSelection.set.add(this.nested.circle(this.options.radius).center(bbox.width / 2, 0).attr('class', this.options.classPoints + '_t').on(mname, getMoseDownFunc('t')).on(ename, getMoseDownFunc('t')));
            this.rectSelection.set.add(this.nested.circle(this.options.radius).center(bbox.width, bbox.height / 2).attr('class', this.options.classPoints + '_r').on(mname, getMoseDownFunc('r')).on(ename, getMoseDownFunc('r')));
            this.rectSelection.set.add(this.nested.circle(this.options.radius).center(bbox.width / 2, bbox.height).attr('class', this.options.classPoints + '_b').on(mname, getMoseDownFunc('b')).on(ename, getMoseDownFunc('b')));
            this.rectSelection.set.add(this.nested.circle(this.options.radius).center(0, bbox.height / 2).attr('class', this.options.classPoints + '_l').on(mname, getMoseDownFunc('l')).on(ename, getMoseDownFunc('l')));

            this.rectSelection.set.each(function () {
                this.addClass(_this.options.classPoints);
            });
        }

        // draw rotationPint, if enabled
        if (this.options.rotationPoint && ((this.options.points && !this.rectSelection.set.get(9)) || (!this.options.points && !this.rectSelection.set.get(1)))) {

            var curriedEvent = function (ev) {
                ev = ev || window.event;
                ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;

                var x= ev.pageX || ev.touches[0].pageX;
                var y= ev.pageY || ev.touches[0].pageY;
                _this.el.fire('rot', {x: x, y: y, event: ev});
            };
            // custom rotation button
            this.rectSelection.set.add(this.nested.image(this.assetUrl + 'assets/ui/rotate-element-button.png')
                                                  .center(-10, -15)
                                                  .width(25).height(25)
                                                  .attr('class', this.options.classPoints + '_rot')
                                                  .on("touchstart", curriedEvent)
                                                  .on("mousedown", curriedEvent)
                                                  .addClass(this.designElement && this.designElement.allowRotate() ? 'enabled' : 'disabled')

            );
        }

        // Custom edit button below the selection box
        this.rectSelection.set.add(this.nested.image(this.assetUrl + 'assets/ui/edit-element-button.png')
            .width(60).height(26)
            .center(bbox.width / 2, bbox.height + 15)
            .attr('class', 'svg_select_edit_button')
            .on('click', function (e) { _this.el.fire('edit'); e.stopPropagation(); })
        );

    };

    SelectHandler.prototype.handler = function () {

        var bbox = this.getBBox();
        // Default implementation
        // this.nested.matrix(new SVG.Matrix(this.el).translate(bbox.x, bbox.y));

        // Our custom implementation which allows controls to be a direct child of the root SVG element
        const area = this.designElement.area;
        const imprintArea = area.maxImprintAreaElement;

        //this.nested.matrix(new SVG.Matrix(this.el)
        this.nested.matrix(new SVG.Matrix(this.el.parent(SVG.Nested))
          .translate(
            area.svgElement.x() + imprintArea.x() + bbox.x,
            area.svgElement.y() + imprintArea.y() + bbox.y
          )
        );

        if (this.rectSelection.isSelected) {
            this.updateRectSelection();
        }

        if (this.pointSelection.isSelected) {
            this.updatePointSelection();
        }

    };

    SelectHandler.prototype.observe = function () {
        var _this = this;

        if (MutationObserver) {
            if (this.rectSelection.isSelected || this.pointSelection.isSelected) {
                this.observerInst = this.observerInst || new MutationObserver(function () {
                    _this.handler();
                });
                this.observerInst.observe(this.el.node, {attributes: true});
            } else {
                try {
                    this.observerInst.disconnect();
                    delete this.observerInst;
                } catch (e) {
                }
            }
        } else {
            this.el.off('DOMAttrModified.select');

            if (this.rectSelection.isSelected || this.pointSelection.isSelected) {
                this.el.on('DOMAttrModified.select', function () {
                    _this.handler();
                });
            }
        }
    };

    SelectHandler.prototype.cleanup = function () {

        //var _this = this;

        if (!this.rectSelection.isSelected && this.rectSelection.set) {
            // stop watching the element, remove the selection
            this.rectSelection.set.each(function () {
                this.remove();
            });

            this.rectSelection.set.clear();
            delete this.rectSelection.set;
        }

        if (!this.pointSelection.isSelected && this.pointSelection.set) {
            // Remove all points, clear the set, stop watching the element
            this.pointSelection.set.each(function () {
                this.remove();
            });

            this.pointSelection.set.clear();
            delete this.pointSelection.set;
        }

        if (!this.pointSelection.isSelected && !this.rectSelection.isSelected) {
            this.nested.remove();
            delete this.nested;

            /*try{
             this.observerInst.disconnect();
             delete this.observerInst;
             }catch(e){}

             this.el.off('DOMAttrModified.select');

             }else{

             if(MutationObserver){
             this.observerInst = this.observerInst || new MutationObserver(function(){ _this.handler(); });
             this.observerInst.observe(this.el.node, {attributes: true});
             }else{
             this.el.on('DOMAttrModified.select', function(){ _this.handler(); } )
             }
             */
        }
    };

    SelectHandler.prototype.getBBox = function () {
      let bbox = null;

      if (this.designElement) {
        if (this.designElement.className === 'NamesAndNumbersElement') {
          bbox = this.el.bbox();
        } else {
          bbox = this.designElement.wrapperBox();
        }
      } else {
        bbox = this.el.rbox(this.el.parent(SVG.Nested));
      }

      return bbox;
    }

    SelectHandler.prototype.getSubElement = function () {
      var subElement = null;
      if (this.el.each) {
        this.el.each(function(i, children) {
          if (this instanceof SVG.Shape || this instanceof SVG.Container) {
            subElement = this;
            return;
          }
        });
      }
      return subElement;
    };


    SVG.extend(SVG.Element, {
        // Select element with mouse
        selectize: function (value, options) {

            // Check the parameters and reassign if needed
            if (typeof value === 'object') {
                options = value;
                value = true;
            }

            var selectHandler = this.remember('_selectHandler') || new SelectHandler(this);

            selectHandler.init(value === undefined ? true : value, options || {});

            return this;

        }
    });

    SVG.Element.prototype.selectize.defaults = {
        points: true,                            // If true, points at the edges are drawn. Needed for resize!
        classRect: 'svg_select_boundingRect',    // Css-class added to the rect
        classPoints: 'svg_select_points',        // Css-class added to the points
        radius: 7,                               // radius of the points
        rotationPoint: true,                     // If true, rotation point is drawn. Needed for rotation!
        deepSelect: false,                       // If true, moving of single points is possible (only line, polyline, polyon)
        designElement: null,  // reference to our custom design element
    };

})();
